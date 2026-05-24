import { NextResponse } from "next/server";

const productionHost = "mp-technology-qr.vercel.app";

export function proxy(request) {
  const host = request.headers.get("host") || "";
  if (host.includes("marcellis-pope-s-projects.vercel.app")) {
    const url = request.nextUrl.clone();
    url.hostname = productionHost;
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
