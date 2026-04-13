import { createHmac } from "node:crypto";
import { EnvConfigError, getMetaAccountLookupEnv } from "@/lib/env";

const META_GRAPH_VERSION = "v19.0";

type MetaPageListItem = {
  id: string;
  name: string;
};

type MetaPagesResponse = {
  data?: MetaPageListItem[];
  error?: {
    message?: string;
  };
};

type MetaPageInstagramResponse = {
  id: string;
  name: string;
  instagram_business_account?: {
    id: string;
  } | null;
  error?: {
    message?: string;
  };
};

export type MetaPageInstagramAccountRecord = {
  pageId: string;
  pageName: string;
  instagramBusinessAccountId: string | null;
  hasInstagramBusinessAccount: boolean;
};

export class MetaAccountLookupError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "MetaAccountLookupError";
    this.status = status;
  }
}

function getLookupEnv() {
  try {
    return getMetaAccountLookupEnv();
  } catch (error) {
    if (error instanceof EnvConfigError) {
      throw new MetaAccountLookupError(error.message, error.status);
    }

    throw error;
  }
}

function createAppSecretProof(accessToken: string, appSecret?: string) {
  if (!appSecret) {
    return null;
  }

  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

async function metaGet<T>(path: string, accessToken: string, appSecret?: string) {
  const params = new URLSearchParams({
    access_token: accessToken,
  });

  const appSecretProof = createAppSecretProof(accessToken, appSecret);

  if (appSecretProof) {
    params.set("appsecret_proof", appSecretProof);
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${path}${path.includes("?") ? "&" : "?"}${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as T & {
    error?: {
      message?: string;
    };
  };

  if (!response.ok) {
    throw new MetaAccountLookupError(
      payload.error?.message ??
        "Meta Graph API Anfrage fuer Page oder Instagram Account fehlgeschlagen",
      response.status,
    );
  }

  return payload;
}

export async function fetchMetaPagesWithInstagramAccounts() {
  const { accessToken, appSecret } = getLookupEnv();

  const pagesResponse = await metaGet<MetaPagesResponse>("me/accounts", accessToken, appSecret);
  const pages = pagesResponse.data ?? [];

  if (pages.length === 0) {
    throw new MetaAccountLookupError(
      "Keine Facebook Pages gefunden. Stelle sicher, dass dein Nutzer Pages sehen darf und die erforderlichen Meta Berechtigungen vorliegen.",
      404,
    );
  }

  const pageDetails = await Promise.all(
    pages.map(async (page) => {
      const detail = await metaGet<MetaPageInstagramResponse>(
        `${page.id}?fields=instagram_business_account,name`,
        accessToken,
        appSecret,
      );

      return {
        pageId: page.id,
        pageName: detail.name ?? page.name,
        instagramBusinessAccountId: detail.instagram_business_account?.id ?? null,
        hasInstagramBusinessAccount: Boolean(detail.instagram_business_account?.id),
      } satisfies MetaPageInstagramAccountRecord;
    }),
  );

  const hasInstagramAccount = pageDetails.some(
    (page) => page.hasInstagramBusinessAccount,
  );

  if (!hasInstagramAccount) {
    throw new MetaAccountLookupError(
      "Keine verknuepfte Instagram Business Account ID gefunden. Der Instagram Account muss ein Business oder Creator Account sein und mit einer Facebook Page verknuepft sein.",
      404,
    );
  }

  return pageDetails;
}
