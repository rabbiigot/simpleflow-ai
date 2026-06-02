import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ExportMetrics = {
  tasksCompleted: number;
  hoursTracked: number;
  productivityScore: number;
  avgTaskMinutes: number;
};

type ExportReport = {
  name: string;
  date: string;
  tasks: number;
  hours: number;
  status?: string;
};

type ExportChartData = {
  productivityTrend?: Array<{ day: string; productivity: number; target: number }>;
  taskStatusOverview?: Array<{ category: string; value: number }>;
  timeAllocation?: Array<{ name: string; value: number }>;
};

type ExportAISummary = {
  question: string;
  response: string;
};

function buildMetricRows(metrics: ExportMetrics) {
  return [
    { label: "Tasks Completed", value: String(metrics.tasksCompleted) },
    { label: "Hours Tracked", value: metrics.hoursTracked.toFixed(1) },
    { label: "Productivity Score", value: `${metrics.productivityScore}%` },
    { label: "Avg. Task Time", value: `${metrics.avgTaskMinutes} min` },
  ];
}

// ── PDF ──

export function buildPDFBlob(
  metrics?: ExportMetrics,
  reports?: ExportReport[],
  chartData?: ExportChartData,
  aiSummary?: ExportAISummary,
): Blob {
  const doc = new jsPDF();
  const generatedAt = new Date().toLocaleDateString();
  const metricRows = metrics ? buildMetricRows(metrics) : [];
  const reportRows = reports ?? [];

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Insights & Reports", 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Generated: ${generatedAt}`, 14, 27);
  doc.setTextColor(0);

  let cursorY = 34;

  // AI Summary
  if (aiSummary) {
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("AI Analytics Summary", 14, cursorY);
    cursorY += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80);
    doc.text("Question:", 14, cursorY);
    doc.setFont("helvetica", "normal");
    const qLines = doc.splitTextToSize(aiSummary.question, 180);
    doc.text(qLines, 38, cursorY);
    cursorY += qLines.length * 4 + 3;
    doc.setFont("helvetica", "bold");
    doc.text("Response:", 14, cursorY);
    doc.setFont("helvetica", "normal");
    const rLines = doc.splitTextToSize(aiSummary.response, 180);
    doc.text(rLines, 14, cursorY + 5);
    cursorY += rLines.length * 4 + 12;
    doc.setTextColor(0);
  }

  // Metrics table
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Key Metrics", 14, cursorY);

  autoTable(doc, {
    startY: cursorY + 4,
    head: [["Metric", "Value"]],
    body: metricRows.length
      ? metricRows.map((m) => [m.label, m.value])
      : [["No metrics data available", ""]],
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 4 },
    alternateRowStyles: { fillColor: [245, 245, 255] },
  });

  cursorY = (doc as any).lastAutoTable?.finalY ?? cursorY + 40;

  // Productivity Trend
  if (chartData?.productivityTrend?.length) {
    cursorY += 10;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Productivity Trend", 14, cursorY);
    autoTable(doc, {
      startY: cursorY + 4,
      head: [["Day", "Productivity", "Target"]],
      body: chartData.productivityTrend.map((r) => [r.day, String(r.productivity), String(r.target)]),
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 255] },
    });
    cursorY = (doc as any).lastAutoTable?.finalY ?? cursorY + 30;
  }

  // Task Status Overview
  if (chartData?.taskStatusOverview?.length) {
    cursorY += 10;
    if (cursorY > 250) { doc.addPage(); cursorY = 20; }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Task Status Overview", 14, cursorY);
    autoTable(doc, {
      startY: cursorY + 4,
      head: [["Status", "Count"]],
      body: chartData.taskStatusOverview.map((r) => [r.category, String(r.value)]),
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 255] },
    });
    cursorY = (doc as any).lastAutoTable?.finalY ?? cursorY + 30;
  }

  // Time Allocation
  if (chartData?.timeAllocation?.length) {
    cursorY += 10;
    if (cursorY > 250) { doc.addPage(); cursorY = 20; }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Time Allocation", 14, cursorY);
    autoTable(doc, {
      startY: cursorY + 4,
      head: [["Category", "Hours"]],
      body: chartData.timeAllocation.map((r) => [r.name, String(r.value)]),
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 255] },
    });
    cursorY = (doc as any).lastAutoTable?.finalY ?? cursorY + 30;
  }

  // Reports table
  cursorY += 10;
  if (cursorY > 250) { doc.addPage(); cursorY = 20; }
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Recent Reports", 14, cursorY);

  autoTable(doc, {
    startY: cursorY + 4,
    head: [["Report", "Date", "Tasks", "Hours", "Status"]],
    body: reportRows.length
      ? reportRows.map((r) => [
          r.name,
          new Date(r.date).toLocaleDateString(),
          String(r.tasks),
          `${r.hours}h`,
          r.status ?? "completed",
        ])
      : [["No reports available", "", "", "", ""]],
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 4 },
    alternateRowStyles: { fillColor: [245, 245, 255] },
  });

  return doc.output("blob");
}

export function exportToPDF(
  metrics?: ExportMetrics,
  reports?: ExportReport[],
  chartData?: ExportChartData,
  aiSummary?: ExportAISummary,
) {
  const blob = buildPDFBlob(metrics, reports, chartData, aiSummary);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `insights-report-${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── CSV ──

export function buildCSVContent(
  metrics?: ExportMetrics,
  reports?: ExportReport[],
  chartData?: ExportChartData,
  aiSummary?: ExportAISummary,
): string {
  const generatedAt = new Date().toLocaleDateString();
  const metricRows = metrics ? buildMetricRows(metrics) : [];
  const reportRows = reports ?? [];

  const rows: (string | number)[][] = [
    ["Insights & Reports Export", `Generated: ${generatedAt}`],
    [],
  ];

  // AI Summary
  if (aiSummary) {
    rows.push(["AI ANALYTICS SUMMARY"]);
    rows.push(["Question", aiSummary.question]);
    rows.push(["Response", aiSummary.response]);
    rows.push([]);
  }

  rows.push(["METRICS SUMMARY"]);
  rows.push(["Metric", "Value"]);

  if (metricRows.length > 0) {
    metricRows.forEach((m) => rows.push([m.label, m.value]));
  }

  // Productivity Trend
  if (chartData?.productivityTrend?.length) {
    rows.push([]);
    rows.push(["PRODUCTIVITY TREND"]);
    rows.push(["Day", "Productivity", "Target"]);
    chartData.productivityTrend.forEach((r) => rows.push([r.day, r.productivity, r.target]));
  }

  // Task Status Overview
  if (chartData?.taskStatusOverview?.length) {
    rows.push([]);
    rows.push(["TASK STATUS OVERVIEW"]);
    rows.push(["Status", "Count"]);
    chartData.taskStatusOverview.forEach((r) => rows.push([r.category, r.value]));
  }

  // Time Allocation
  if (chartData?.timeAllocation?.length) {
    rows.push([]);
    rows.push(["TIME ALLOCATION"]);
    rows.push(["Category", "Hours"]);
    chartData.timeAllocation.forEach((r) => rows.push([r.name, r.value]));
  }

  rows.push([]);
  rows.push(["REPORTS"]);
  rows.push(["Report Name", "Date Generated", "Tasks", "Hours Logged", "Status"]);

  reportRows.forEach((report) => {
    rows.push([
      report.name,
      new Date(report.date).toLocaleDateString(),
      String(report.tasks),
      String(report.hours),
      report.status ?? "completed",
    ]);
  });

  return rows
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
}

export function exportToCSV(
  metrics?: ExportMetrics,
  reports?: ExportReport[],
  chartData?: ExportChartData,
  aiSummary?: ExportAISummary,
) {
  const csvContent = buildCSVContent(metrics, reports, chartData, aiSummary);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `insights-report-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Preview URLs ──

export function buildPDFPreviewURL(
  metrics?: ExportMetrics,
  reports?: ExportReport[],
  chartData?: ExportChartData,
  aiSummary?: ExportAISummary,
): string {
  const blob = buildPDFBlob(metrics, reports, chartData, aiSummary);
  return URL.createObjectURL(blob);
}

export function buildCSVPreviewURL(
  metrics?: ExportMetrics,
  reports?: ExportReport[],
  chartData?: ExportChartData,
  aiSummary?: ExportAISummary,
): string {
  const csvContent = buildCSVContent(metrics, reports, chartData, aiSummary);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  return URL.createObjectURL(blob);
}
