"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createLeave } from "@/lib/storage";
import { useState } from "react";

export function LeaveRequestTab() {
  const [leaveType, setLeaveType] = useState<"shift" | "leave">("shift");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = () => {
    if (!date || (leaveType === "leave" && !reason)) {
      setMessage({
        type: "error",
        text: "Please fill in all required fields",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const leave = createLeave(date, leaveType, reason);

      setMessage({
        type: "success",
        text:
          leaveType === "shift"
            ? "Sick leave approved automatically!"
            : "Leave request submitted for approval!",
      });

      // Reset form
      setDate(new Date().toISOString().split("T")[0]);
      setReason("");
      setLeaveType("shift");
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to submit leave request",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request Leave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Leave Type */}
          <div>
            <label className="text-sm font-medium text-neutral-600">
              Leave Type
            </label>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                onClick={() => setLeaveType("shift")}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  leaveType === "shift"
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                Sick Leave
              </button>
              <button
                onClick={() => setLeaveType("leave")}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  leaveType === "leave"
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                Other Leave
              </button>
            </div>

            {leaveType === "shift" && (
              <p className="mt-2 text-xs text-green-600 font-medium">
                Auto-approved
              </p>
            )}
            {leaveType === "leave" && (
              <p className="mt-2 text-xs text-amber-600 font-medium">
                Pending approval
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-neutral-600">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-2 px-4 py-2 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reason - only show for non-sick leave */}
          {leaveType === "leave" && (
            <div>
              <label className="text-sm font-medium text-neutral-600">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain your reason for leave..."
                className="w-full mt-2 px-4 py-2 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
            </div>
          )}

          {leaveType === "shift" && !reason && (
            <div>
              <label className="text-sm font-medium text-neutral-600">
                Optional Note
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add any additional notes..."
                className="w-full mt-2 px-4 py-2 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-linear-to-r from-purple-500 to-blue-500 cursor-pointer text-white h-10 rounded-lg font-medium"
          >
            {isLoading ? "Submitting..." : "Submit Leave Request"}
          </Button>

          {/* Messages */}
          {message && (
            <div
              className={`p-4 rounded-lg text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-neutral-600">
          <div>
            <p className="font-medium text-neutral-900">Sick Leave</p>
            <p>Auto-approved immediately upon submission</p>
          </div>
          <div>
            <p className="font-medium text-neutral-900">Other Leave</p>
            <p>Requires manager approval before taking effect</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
