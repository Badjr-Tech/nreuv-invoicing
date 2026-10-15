import { NextResponse } from "next/server";

// TEMPORARY diagnostic — removed after use.
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("k");
  if (key !== "05d348c7dc3504effde62a30d759ea5b") {
    return NextResponse.json({ error: "nope" }, { status: 403 });
  }
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_FROM_EMAIL;
  const report: Record<string, unknown> = {
    hasKey: !!apiKey,
    keyLen: apiKey?.length ?? 0,
    keyStartsQuote: apiKey?.startsWith('"') ?? null,
    from,
  };
  if (apiKey) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        sender: { name: "NREUV Invoicing", email: from || "noreply@nreuv.com" },
        to: [{ email: "djmj@nreuv.com" }],
        subject: "Production email self-test",
        htmlContent: "<p>Test from the live server to diagnose email sending. No action needed.</p>",
      }),
    });
    report.brevoStatus = res.status;
    report.brevoBody = await res.text();
  }
  return NextResponse.json(report);
}
