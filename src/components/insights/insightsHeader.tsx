import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createReport,
  getCurrentUserId,
  type DashboardInsightsResponse,
  type DashboardReport,
} from "@/lib/backend-api";
import {
  buildCSVContent,
  buildPDFPreviewURL,
  exportToCSV,
  exportToPDF,
} from "@/lib/export-utils";
import type { DashboardInsightsResponse as InsightsResponse } from "@/lib/backend-api";
import { Download, FileSpreadsheet, FileText, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";

const PRESET_DAYS = [7, 14, 30, 90] as const;

type InsightsHeaderProps = {
  days: number;
  onDaysChange: (days: number) => void;
  metrics?: DashboardInsightsResponse["metrics"] | null;
  reports?: DashboardReport[];
  onReportCreated?: () => void;
  workspaces?: Array<{ id: string; name: string }>;
  selectedWorkspaceId?: string;
  onWorkspaceChange?: (id: string) => void;
  promptValue?: string;
  onPromptChange?: (value: string) => void;
  onPromptSubmit?: () => void;
  isPromptLoading?: boolean;
  aiQuestion?: string | null;
  aiResponse?: string | null;
  productivityTrend?: InsightsResponse["productivityTrend"];
  taskStatusOverview?: InsightsResponse["taskStatusOverview"];
  timeAllocation?: InsightsResponse["timeAllocation"];
};

export function InsightsHeader({ days, onDaysChange, metrics, reports, onReportCreated, workspaces, selectedWorkspaceId, onWorkspaceChange, promptValue, onPromptChange, onPromptSubmit, isPromptLoading, aiQuestion, aiResponse, productivityTrend, taskStatusOverview, timeAllocation }: InsightsHeaderProps) {
  const [previewType, setPreviewType] = useState<"pdf" | "csv" | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);

  const saveReport = (type: "PDF" | "CSV") => {
    const userId = getCurrentUserId();
    if (!userId) return;
    const now = new Date();
    const name = `${type} Report - ${now.toLocaleDateString()}`;
    createReport({
      userId,
      name,
      type,
      tasks: metrics?.tasksCompleted ?? 0,
      hours: metrics?.hoursTracked ?? 0,
      periodDays: days,
    })
      .then(() => onReportCreated?.())
      .catch(() => {});
  };

  const chartData = { productivityTrend, taskStatusOverview, timeAllocation };
  const aiSummary = aiQuestion && aiResponse ? { question: aiQuestion, response: aiResponse } : undefined;

  const handlePDFPreview = () => {
    const url = buildPDFPreviewURL(metrics ?? undefined, reports, chartData, aiSummary);
    setPdfUrl(url);
    setPreviewType("pdf");
  };

  const handleCSVPreview = () => {
    const content = buildCSVContent(metrics ?? undefined, reports, chartData, aiSummary);
    setCsvContent(content);
    setPreviewType("csv");
  };

  const handleDownload = () => {
    if (previewType === "pdf") {
      exportToPDF(metrics ?? undefined, reports, chartData, aiSummary);
      saveReport("PDF");
    } else if (previewType === "csv") {
      exportToCSV(metrics ?? undefined, reports, chartData, aiSummary);
      saveReport("CSV");
    }
    closePreview();
  };

  const closePreview = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setCsvContent(null);
    setPreviewType(null);
  };

  // Parse CSV for table preview
  const csvRows = csvContent
    ? csvContent.split("\n").map((row) =>
        row.split(",").map((cell) => cell.replace(/^"|"$/g, "")),
      )
    : [];

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Performance
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your productivity and measure what matters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2" data-tour="insights-export">
            <Button size="sm" className="gap-2" variant="outline" onClick={handlePDFPreview}>
              <FileText className="w-4 h-4" />
              PDF
            </Button>
            <Button size="sm" className="gap-2" variant="outline" onClick={handleCSVPreview}>
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {workspaces && workspaces.length > 0 && (
            <Select value={selectedWorkspaceId ?? "all"} onValueChange={onWorkspaceChange} data-tour="insights-workspace">
              <SelectTrigger className="w-44 h-8 text-xs rounded-full">
                <SelectValue placeholder="All Workspaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workspaces</SelectItem>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {PRESET_DAYS.map((preset) => (
            <Button
              key={preset}
              size="sm"
              variant={days === preset ? "default" : "outline"}
              className="rounded-full px-4 h-8 text-xs"
              onClick={() => onDaysChange(preset)}
            >
              {preset}d
            </Button>
          ))}

          <div className="flex items-center gap-1.5 ml-auto" data-tour="insights-ai">
            <div className="relative">
              <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={promptValue ?? ""}
                onChange={(e) => onPromptChange?.(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onPromptSubmit?.(); } }}
                placeholder="Ask about your analytics..."
                className="pl-8 h-8 text-xs w-56 rounded-full"
                disabled={isPromptLoading}
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={isPromptLoading || !promptValue?.trim()}
              className="h-8 w-8 p-0 rounded-full"
              onClick={onPromptSubmit}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

      </div>

      {/* Preview Modal */}
      <Dialog open={previewType !== null} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {previewType === "pdf" ? "PDF Preview" : "CSV Preview"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-auto rounded-md border bg-muted/30">
            {previewType === "pdf" && pdfUrl && (
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded-md"
                title="PDF Preview"
              />
            )}

            {previewType === "csv" && csvRows.length > 0 && (
              <div className="p-4 overflow-auto">
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {csvRows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={
                          row.length === 1 && row[0]
                            ? "bg-muted font-semibold"
                            : rowIdx === 0
                              ? "bg-indigo-50 dark:bg-indigo-950/30 font-semibold"
                              : "hover:bg-muted/50"
                        }
                      >
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="border border-border px-3 py-1.5 text-xs"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0 pt-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={closePreview}>
              <X className="w-4 h-4" />
              Close
            </Button>
            <Button size="sm" className="gap-2" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Download {previewType?.toUpperCase()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
