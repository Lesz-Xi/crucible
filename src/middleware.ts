import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// No-op middleware used to ensure middleware manifest emission in dev.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
