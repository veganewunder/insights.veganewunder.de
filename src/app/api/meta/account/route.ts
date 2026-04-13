import { NextResponse } from "next/server";
import { fetchMetaPagesWithInstagramAccounts, MetaAccountLookupError } from "@/lib/meta/account";

export async function GET() {
  try {
    const pages = await fetchMetaPagesWithInstagramAccounts();

    return NextResponse.json({
      pages,
    });
  } catch (error) {
    if (error instanceof MetaAccountLookupError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: error.status },
      );
    }

    console.error("meta_account_route_error", error);

    return NextResponse.json(
      {
        message: "Meta Account Lookup konnte nicht verarbeitet werden",
      },
      { status: 500 },
    );
  }
}
