"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const reports = [
  {
    id: 1,
    name: "Weekly Performance Report",
    date: "Feb 26, 2026",
    status: "completed",
    tasks: 127,
    hours: 42.5,
  },
  {
    id: 2,
    name: "Monthly Productivity Summary",
    date: "Feb 24, 2026",
    status: "completed",
    tasks: 312,
    hours: 156.5,
  },
  {
    id: 3,
    name: "Team Collaboration Analysis",
    date: "Feb 20, 2026",
    status: "completed",
    tasks: 89,
    hours: 38.2,
  },
  {
    id: 4,
    name: "Q1 Quarterly Review",
    date: "Feb 15, 2026",
    status: "pending",
    tasks: 245,
    hours: 112.8,
  },
  {
    id: 5,
    name: "Time Tracking Audit",
    date: "Feb 10, 2026",
    status: "completed",
    tasks: 156,
    hours: 62.3,
  },
];

export function ReportsTable() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Recent Reports</CardTitle>
        <CardDescription>
          Access your generated reports and analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Date Generated</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Hours Logged</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.date}
                  </TableCell>
                  <TableCell>{report.tasks}</TableCell>
                  <TableCell>{report.hours}h</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status === "completed" ? "Ready" : "Processing"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
