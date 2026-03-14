"use client";

import { auth } from "@/lib/firebase";

type DownloadReportPdfParams = {
  reportId: string;
  reportName?: string;
};

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

export async function downloadReportPdf({
  reportId,
  reportName,
}: DownloadReportPdfParams): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Brak zalogowanego użytkownika.");
  }

  const token = await user.getIdToken();

  const res = await fetch(`/api/reports/${reportId}/pdf`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Report-Name": reportName ?? "",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Błąd pobierania PDF: ${res.status} ${text}`);
  }

  const blob = await res.blob();
  const fileName = sanitizeFileName(reportName || `raport-${reportId}`);
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.pdf`;
  link.rel = "noopener";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}