"use client";

import { useState } from "react";
import { downloadReportPdf } from "@/lib/pdf/downloadReportPdf";

type DownloadReportPdfButtonProps = {
  reportId: string;
  reportName?: string;
  className?: string;
};

export default function DownloadReportPdfButton({
  reportId,
  reportName,
  className = "",
}: DownloadReportPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    try {
      setLoading(true);

      await downloadReportPdf({
        reportId,
        reportName,
      });
    } catch (error) {
      console.error("Błąd generowania PDF:", error);
      alert("Nie udało się pobrać PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`dg-btn dg-btn-primary ${className}`}
    >
      {loading ? "Generowanie PDF..." : "Pobierz PDF"}
    </button>
  );
}
