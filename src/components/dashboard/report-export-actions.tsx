"use client";

import { useId, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toPng } from "html-to-image";
import { MetaContentItem, MetricKey } from "@/types/insights";

type ReportExportActionsProps = {
  reportElementId: string;
  clientName: string;
  activeContentLabel: string;
  activeRangeLabel: string;
  reportDateLabel: string;
  mediaItems: MetaContentItem[];
};

function escapeCsv(value: string | number | null | undefined) {
  const output = value == null ? "" : String(value);
  return `"${output.replaceAll("\"", "\"\"")}"`;
}

function formatMetricLabel(metric: string) {
  return metric
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function buildCsv(mediaItems: MetaContentItem[]) {
  const metricKeys = Array.from(
    new Set(
      mediaItems.flatMap((item) => Object.keys(item.metrics) as MetricKey[]),
    ),
  );

  const header = [
    "Titel",
    "Content-Typ",
    "Plattform",
    "Format",
    "Veroeffentlicht am",
    "Permalink",
    ...metricKeys.map(formatMetricLabel),
  ];

  const rows = mediaItems.map((item) => [
    item.title,
    item.contentType,
    item.platformLabel,
    item.mediaTypeLabel,
    item.publishedAt ?? "",
    item.permalink ?? "",
    ...metricKeys.map((metricKey) => item.metrics[metricKey] ?? ""),
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => escapeCsv(value)).join(","))
    .join("\n");
}

export function ReportExportActions({
  reportElementId,
  clientName,
  activeContentLabel,
  activeRangeLabel,
  reportDateLabel,
  mediaItems,
}: ReportExportActionsProps) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const titleId = useId();

  async function handleCsvExport() {
    setExportingCsv(true);

    try {
      const csv = buildCsv(mediaItems);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${clientName.toLowerCase().replaceAll(/\s+/g, "-")}-${activeContentLabel.toLowerCase()}-${activeRangeLabel.toLowerCase().replaceAll(/\s+/g, "-")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingCsv(false);
    }
  }

  async function handlePdfExport() {
    const reportElement = document.getElementById(reportElementId);
    if (!reportElement) return;

    setExportingPdf(true);
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1280,height=900");

    if (!printWindow) {
      setExportingPdf(false);
      return;
    }

    try {
      printWindow.document.write(`
        <!doctype html>
        <html lang="de">
          <head>
            <meta charset="utf-8" />
            <title>${clientName} Reporting</title>
            <style>
              body {
                margin: 0;
                font-family: Arial, sans-serif;
                background: #ffffff;
                color: #18181b;
                display: grid;
                place-items: center;
                min-height: 100vh;
              }
              p {
                color: #52525b;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <p>PDF wird vorbereitet...</p>
          </body>
        </html>
      `);
      printWindow.document.close();

      const imageDataUrl = await toPng(reportElement, {
        cacheBust: true,
        backgroundColor: "#f4f4f5",
        pixelRatio: 2,
      });

      printWindow.document.open();
      printWindow.document.write(`
        <!doctype html>
        <html lang="de">
          <head>
            <meta charset="utf-8" />
            <title>${clientName} Reporting</title>
            <style>
              body {
                margin: 0;
                font-family: Arial, sans-serif;
                background: #ffffff;
                color: #18181b;
              }
              .page {
                padding: 28px;
              }
              .meta {
                margin-bottom: 18px;
              }
              .meta h1 {
                margin: 0 0 6px 0;
                font-size: 22px;
              }
              .meta p {
                margin: 0;
                color: #52525b;
                font-size: 12px;
                line-height: 1.5;
              }
              img {
                width: 100%;
                height: auto;
                display: block;
                border-radius: 18px;
              }
              @media print {
                .page {
                  padding: 16px;
                }
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="meta">
                <h1>${clientName} Reporting</h1>
                <p>${activeContentLabel} · ${activeRangeLabel}</p>
                <p>Daten basieren auf dem Stand vom ${reportDateLabel}</p>
              </div>
              <img src="${imageDataUrl}" alt="Reporting Export" />
            </div>
            <script>
              window.onload = () => {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch {
      printWindow.document.open();
      printWindow.document.write(`
        <!doctype html>
        <html lang="de">
          <head>
            <meta charset="utf-8" />
            <title>${clientName} Reporting</title>
            <style>
              body {
                margin: 0;
                font-family: Arial, sans-serif;
                background: #ffffff;
                color: #18181b;
                display: grid;
                place-items: center;
                min-height: 100vh;
                padding: 24px;
                text-align: center;
              }
              h1 {
                margin: 0 0 8px 0;
                font-size: 20px;
              }
              p {
                margin: 0;
                color: #52525b;
                line-height: 1.5;
              }
            </style>
          </head>
          <body>
            <div>
              <h1>PDF konnte nicht erstellt werden</h1>
              <p>Bitte Seite neu laden und den Export erneut starten.</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-[2rem] border border-line bg-white/80 p-5 shadow-panel"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone">
            Export
          </p>
          <h2 id={titleId} className="mt-1 text-xl font-bold text-ink">
            Reporting herunterladen
          </h2>
          <p className="mt-1 text-sm text-stone">
            PDF für Präsentationen und CSV für Rohdaten oder Weiterverarbeitung.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePdfExport}
            disabled={exportingPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
          >
            <Download className="size-4" />
            {exportingPdf ? "PDF wird vorbereitet..." : "PDF Export"}
          </button>
          <button
            type="button"
            onClick={handleCsvExport}
            disabled={exportingCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition hover:border-ink disabled:opacity-50"
          >
            <FileSpreadsheet className="size-4" />
            {exportingCsv ? "CSV wird erstellt..." : "CSV Export"}
          </button>
        </div>
      </div>
    </section>
  );
}
