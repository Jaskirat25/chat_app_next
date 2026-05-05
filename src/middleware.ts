import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!token || token.trim() === "") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
