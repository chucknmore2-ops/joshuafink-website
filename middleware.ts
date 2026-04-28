import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*"],
};

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="joshuafink admin"' },
  });
}

export function middleware(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return unauthorized();

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }

  const sepIdx = decoded.indexOf(":");
  if (sepIdx === -1) return unauthorized();
  const submittedPassword = decoded.slice(sepIdx + 1);

  if (!constantTimeEqual(submittedPassword, expected)) return unauthorized();
  return NextResponse.next();
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
