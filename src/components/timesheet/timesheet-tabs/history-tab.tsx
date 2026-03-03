"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  formatDate,
  formatTime,
  getLeaves,
  getShifts,
  LeaveRecord,
  ShiftRecord,
} from "../../../lib/storage";

type HistoryItem = (ShiftRecord | LeaveRecord) & { type: "shift" | "leave" };

function isShift(item: HistoryItem): item is ShiftRecord {
  return item.type === "shift";
}

function isLeave(item: HistoryItem): item is LeaveRecord {
  return item.type === "leave";
}

export function HistoryTab() {
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [historyByMonth, setHistoryByMonth] = useState<
    Record<string, HistoryItem[]>
  >({});

  useEffect(() => {
    const allShifts = getShifts();
    const allLeaves = getLeaves();

    setShifts(allShifts);
    setLeaves(allLeaves);

    // Combine and group by month
    const combined: HistoryItem[] = [
      ...allShifts.map((s) => ({ ...s, type: "shift" as const })),
      ...allLeaves.map((l) => ({ ...l, type: "leave" as const })),
    ];

    // Sort by date descending
    combined.sort((a, b) => {
      const dateA = new Date(isShift(a) ? a.date : a.date).getTime();
      const dateB = new Date(isShift(b) ? b.date : b.date).getTime();
      return dateB - dateA;
    });

    // Group by month
    const grouped: Record<string, HistoryItem[]> = {};
    combined.forEach((item) => {
      const date = new Date(isShift(item) ? item.date : item.date);
      const monthKey = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(date);

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(item);
    });

    setHistoryByMonth(grouped);
  }, []);

  const getStatusBadge = (
    item: HistoryItem,
  ): { text: string; color: string } => {
    if (item.type === "leave") {
      const leave = item as LeaveRecord;
      return {
        text: leave.status === "approved" ? "Approved" : "Pending",
        color:
          leave.status === "approved"
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-amber-50 text-amber-700 border-amber-200",
      };
    } else {
      const shift = item as ShiftRecord;
      return {
        text:
          shift.status === "completed"
            ? "Completed"
            : shift.status === "pending"
              ? "Pending"
              : "Pending Approval",
        color:
          shift.status === "completed"
            ? "bg-green-50 text-green-700 border-green-200"
            : shift.status === "pending"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(historyByMonth).length === 0 ? (
        <Card>
          <CardContent className="pt-1 text-center">
            <p className="text-neutral-600">No timesheet record yet</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(historyByMonth).map(([month, items]) => (
          <div key={month} className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">{month}</h3>

            {items.map((item) => {
              const badge = getStatusBadge(item);

              if (item.type === "leave") {
                const leave = item as LeaveRecord;
                return (
                  <Card key={leave.id} className="overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-neutral-900">
                              {formatDate(leave.date)} - Leave
                            </p>
                            <p className="text-sm text-neutral-600">
                              {leave.type === "shift"
                                ? "Sick Leave"
                                : "Other Leave"}
                              {leave.reason && `: ${leave.reason}`}
                            </p>
                          </div>
                          <span
                            className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${badge.color}`}
                          >
                            {badge.text}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              } else {
                const shift = item as ShiftRecord;
                return (
                  <Card key={shift.id} className="overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-neutral-900">
                              {formatDate(shift.date)}
                            </p>
                            <p className="text-sm text-neutral-600">
                              {formatTime(shift.clockInTime)} -{" "}
                              {shift.clockOutTime
                                ? formatTime(shift.clockOutTime)
                                : "Not clocked out"}
                            </p>
                          </div>
                          <span
                            className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${badge.color}`}
                          >
                            {badge.text}
                          </span>
                        </div>

                        {shift.status === "pending-approval" && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
                            Waiting for lead approval. Will auto-approve after 1
                            hour.
                            {shift.approvalRequiredAt && (
                              <p className="mt-1 text-xs text-amber-600">
                                Flagged at:{" "}
                                {formatTime(shift.approvalRequiredAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            })}
          </div>
        ))
      )}
    </div>
  );
}
