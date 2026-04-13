const META_ENV_KEYS = [
  "META_APP_ID",
  "META_APP_SECRET",
  "META_REDIRECT_URI",
  "META_ACCESS_TOKEN",
  "META_INSTAGRAM_ACCOUNT_ID",
] as const;

type MetaEnvKey = (typeof META_ENV_KEYS)[number];

export class EnvConfigError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "EnvConfigError";
    this.status = status;
  }
}

export function getRequiredEnv(key: MetaEnvKey) {
  const value = process.env[key];

  if (!value) {
    throw new EnvConfigError(`${key} fehlt`, 500);
  }

  return value;
}

export function getMetaEnv() {
  return {
    appId: getRequiredEnv("META_APP_ID"),
    appSecret: getRequiredEnv("META_APP_SECRET"),
    redirectUri: getRequiredEnv("META_REDIRECT_URI"),
    accessToken: getRequiredEnv("META_ACCESS_TOKEN"),
    instagramAccountId: getRequiredEnv("META_INSTAGRAM_ACCOUNT_ID"),
  };
}

export function getMetaOAuthEnv() {
  return {
    appId: getRequiredEnv("META_APP_ID"),
    redirectUri: getRequiredEnv("META_REDIRECT_URI"),
  };
}

export function getMetaCallbackEnv() {
  return {
    appId: getRequiredEnv("META_APP_ID"),
    appSecret: getRequiredEnv("META_APP_SECRET"),
    redirectUri: getRequiredEnv("META_REDIRECT_URI"),
  };
}

export function getMetaInsightsEnv() {
  return {
    accessToken: getRequiredEnv("META_ACCESS_TOKEN"),
    instagramAccountId: getRequiredEnv("META_INSTAGRAM_ACCOUNT_ID"),
    appSecret: process.env.META_APP_SECRET,
  };
}

export function getMetaContentEnv() {
  return {
    accessToken: getRequiredEnv("META_ACCESS_TOKEN"),
    instagramAccountId: getRequiredEnv("META_INSTAGRAM_ACCOUNT_ID"),
    appSecret: process.env.META_APP_SECRET,
  };
}

export function getMetaAccountLookupEnv() {
  return {
    accessToken: getRequiredEnv("META_ACCESS_TOKEN"),
    appSecret: process.env.META_APP_SECRET,
  };
}

export function getMetaEnvPresence() {
  return {
    META_APP_ID: Boolean(process.env.META_APP_ID),
    META_APP_SECRET: Boolean(process.env.META_APP_SECRET),
    META_REDIRECT_URI: Boolean(process.env.META_REDIRECT_URI),
    META_ACCESS_TOKEN: Boolean(process.env.META_ACCESS_TOKEN),
    META_INSTAGRAM_ACCOUNT_ID: Boolean(process.env.META_INSTAGRAM_ACCOUNT_ID),
  };
}

export function logMetaEnvPresence(context: string) {
  console.log(context, getMetaEnvPresence());
}

export function isSupabaseServerConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getSupabaseServiceRoleEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new EnvConfigError("NEXT_PUBLIC_SUPABASE_URL fehlt", 500);
  }

  if (!serviceRoleKey) {
    throw new EnvConfigError("SUPABASE_SERVICE_ROLE_KEY fehlt", 500);
  }

  return {
    url,
    serviceRoleKey,
  };
}
