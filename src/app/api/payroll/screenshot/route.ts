import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Streams a private payroll screenshot to signed-in admins and approvers.
// The blob store is private, so browsers can't fetch blob URLs directly.
export async function GET(request: Request) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_APPROVER")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "Bad url" }, { status: 400 });
  }
  if (!target.hostname.endsWith(".blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Bad url" }, { status: 400 });
  }

  const upstream = await fetch(target, {
    headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });
  if (!upstream.ok) {
    return NextResponse.json({ error: "Not found" }, { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") || "image/png",
      "cache-control": "private, max-age=3600",
    },
  });
}
