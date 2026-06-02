import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AutomationLogEntry } from "@/lib/backend-api";
import { AlertCircle, CheckCircle, Clock, Loader2, MinusCircle } from "lucide-react";

type AutomationHistoryProps = {
  logs: AutomationLogEntry[];
  loading?: boolean;
};

const STATUS_CONFIG: Record<
  AutomationLogEntry["status"],
  { label: string; variant: "success" | "destructive" | "secondary"; icon: typeof CheckCircle }
> = {
  SUCCESS: { label: "Success", variant: "success", icon: CheckCircle },
  FAILED: { label: "Failed", variant: "destructive", icon: AlertCircle },
  SKIPPED: { label: "Skipped", variant: "secondary", icon: MinusCircle },
};

function formatDuration(ms?: number): string {
  if (ms === undefined || ms === null) return "--";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AutomationHistory({
  logs,
  loading,
}: AutomationHistoryProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading execution history...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No execution logs yet. Automations will appear here once they run.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Automation</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Executed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const cfg = STATUS_CONFIG[log.status];
              const StatusIcon = cfg.icon;
              return (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.automationName ?? "--"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.triggerType.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cfg.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDuration(log.durationMs)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(log.executedAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
