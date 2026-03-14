import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function sanitizeFileName(value: string) {
  const map: Record<string, string> = {
    ą: "a",
    ć: "c",
    ę: "e",
    ł: "l",
    ń: "n",
    ó: "o",
    ś: "s",
    ź: "z",
    ż: "z",
    Ą: "A",
    Ć: "C",
    Ę: "E",
    Ł: "L",
    Ń: "N",
    Ó: "O",
    Ś: "S",
    Ź: "Z",
    Ż: "Z",
  };

  return value
    .trim()
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (char) => map[char] ?? char)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await context.params;

  const token = getBearerToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Brak tokenu autoryzacji." },
      { status: 401 }
    );
  }

  try {
    await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowy token autoryzacji." },
      { status: 401 }
    );
  }

  const reportNameHeader = request.headers.get("x-report-name") || "";
  const safeFileName = sanitizeFileName(reportNameHeader || `raport-${reportId}`);

  const origin = new URL(request.url).origin;
  const printUrl = `${origin}/reports/${reportId}/print?token=${encodeURIComponent(
    token
  )}&hideToolbar=1&pdf=1`;

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage({
      viewport: {
        width: 1600,
        height: 2200,
      },
      deviceScaleFactor: 1,
    });

    await page.emulateMedia({ media: "screen" });

    await page.goto(printUrl, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    await page.waitForFunction("window.__PRINT_READY__ === true", undefined, {
      timeout: 60000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "10mm",
        right: "8mm",
        bottom: "10mm",
        left: "8mm",
      },
    });

    const pdfBytes = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF route error:", error);

    return NextResponse.json(
      {
        error: "Nie udało się wygenerować PDF.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}