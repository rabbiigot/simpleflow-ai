export function exportToPDF() {
  // Data to export
  const data = {
    title: "Insights & Reports - Weekly Summary",
    generatedAt: new Date().toLocaleDateString(),
    metrics: [
      { label: "Tasks Completed", value: "127" },
      { label: "Hours Tracked", value: "156.5" },
      { label: "Productivity Score", value: "8.4/10" },
      { label: "Avg. Task Time", value: "47 min" },
    ],
    reports: [
      {
        name: "Weekly Performance Report",
        date: "Feb 26, 2026",
        tasks: 127,
        hours: 42.5,
      },
      {
        name: "Monthly Productivity Summary",
        date: "Feb 24, 2026",
        tasks: 312,
        hours: 156.5,
      },
      {
        name: "Team Collaboration Analysis",
        date: "Feb 20, 2026",
        tasks: 89,
        hours: 38.2,
      },
    ],
  };

  // Create PDF content
  let content = `INSIGHTS & REPORTS - WEEKLY SUMMARY\n`;
  content += `Generated: ${data.generatedAt}\n`;
  content += `${"=".repeat(60)}\n\n`;

  content += `KEY METRICS\n`;
  content += `${"-".repeat(60)}\n`;
  data.metrics.forEach((metric) => {
    content += `${metric.label}: ${metric.value}\n`;
  });

  content += `\n\nRECENT REPORTS\n`;
  content += `${"-".repeat(60)}\n`;
  data.reports.forEach((report) => {
    content += `\nReport: ${report.name}\n`;
    content += `Date: ${report.date}\n`;
    content += `Tasks: ${report.tasks} | Hours: ${report.hours}h\n`;
  });

  content += `\n${"=".repeat(60)}\n`;
  content += `End of Report`;

  // Create and download file
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(content),
  );
  element.setAttribute(
    "download",
    `insights-report-${new Date().getTime()}.txt`,
  );
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function exportToCSV() {
  // CSV data
  const csvContent = [
    [
      "Insights & Reports Export",
      `Generated: ${new Date().toLocaleDateString()}`,
    ],
    [],
    ["METRICS SUMMARY"],
    ["Metric", "Value"],
    ["Tasks Completed", "127"],
    ["Hours Tracked", "156.5"],
    ["Productivity Score", "8.4/10"],
    ["Avg. Task Time", "47 min"],
    [],
    ["REPORTS"],
    ["Report Name", "Date Generated", "Tasks", "Hours Logged", "Status"],
    ["Weekly Performance Report", "Feb 26, 2026", "127", "42.5", "Completed"],
    [
      "Monthly Productivity Summary",
      "Feb 24, 2026",
      "312",
      "156.5",
      "Completed",
    ],
    ["Team Collaboration Analysis", "Feb 20, 2026", "89", "38.2", "Completed"],
    ["Q1 Quarterly Review", "Feb 15, 2026", "245", "112.8", "Pending"],
    ["Time Tracking Audit", "Feb 10, 2026", "156", "62.3", "Completed"],
  ]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  // Create and download file
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent),
  );
  element.setAttribute(
    "download",
    `insights-report-${new Date().getTime()}.csv`,
  );
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
