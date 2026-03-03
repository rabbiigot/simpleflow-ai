"use client";

import { Button } from "@/components/ui/button";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
import { Download, Filter } from "lucide-react";

export function InsightsHeader() {
  const handlePDFExport = () => {
    exportToPDF();
  };

  const handleCSVExport = () => {
    exportToCSV();
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-4xl font-bold text-foreground">
          Insights & Reports
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your productivity and performance metrics
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
        <Button size="sm" className="gap-2" onClick={handlePDFExport}>
          <Download className="w-4 h-4" />
          PDF
        </Button>
        <Button
          size="sm"
          className="gap-2"
          onClick={handleCSVExport}
          variant="secondary"
        >
          <Download className="w-4 h-4" />
          CSV
        </Button>
      </div>
    </div>
  );
}
