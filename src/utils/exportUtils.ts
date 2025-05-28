// src/utils/exportUtils.ts

import { GridResults } from "../types";
import jsPDF from "jspdf";

/**
 * Exports an array of result objects to a downloadable CSV file.
 * @param data - Array of objects to export (e.g., [results])
 * @param fileName - Optional file name
 */
export function exportResultsToCSV(
  data: Record<string, any>[],
  fileName: string = "results.csv"
) {
  if (!data || !data.length) return;

  const header = Object.keys(data[0]);
  const csvRows = [
    header.join(","),
    ...data.map(row => header.map(field => JSON.stringify(row[field] ?? "")).join(",")),
  ];
  const csv = csvRows.join("\r\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports the main results metrics to a PDF file.
 * @param results - The GridResults object
 * @param fileName - Optional PDF file name
 */
export function exportResultsToPDF(results: GridResults, fileName: string = "grid-results.pdf") {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Grid Trading Profit Report", 14, 18);

  doc.setFontSize(12);
  let y = 30;
  const lines = [
    ["Total Estimated Profit", `$${results.totalEstimatedProfit.toFixed(2)}`],
    ["Estimated Daily Profit", `$${results.estimatedDailyProfit.toFixed(2)}`],
    ["Trades per Day", results.estimatedTradesPerDay.toFixed(1)],
    ["Grid Spacing", results.gridSpacing.toFixed(4)],
    ["Investment per Grid", `$${results.investmentPerGrid.toFixed(2)}`],
    ["Net Profit/Tx", `$${results.netProfitPerGridTransaction.toFixed(4)}`],
    ["ATR / Min", results.atrPerMin.toFixed(4)],
    ["Total Net Profit", `$${results.totalNetProfit.toFixed(2)}`],
    ["Total Grid Profit (Gross)", `$${results.totalGridProfit.toFixed(2)}`],
    ["Estimated Daily Grid Profit (Gross)", `$${results.estimatedDailyGridProfit.toFixed(2)}`],
    ["Simulation Days", results.durationDays.toString()],
  ];

  lines.forEach(([label, value]) => {
    doc.text(`${label}:`, 14, y);
    doc.text(value, 110, y);
    y += 8;
  });

  doc.save(fileName);
}
