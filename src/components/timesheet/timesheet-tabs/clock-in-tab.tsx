"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/context/user-context";
import {
  clockIn as clockInApi,
  clockOut as clockOutApi,
} from "@/lib/backend-api";
import { getCurrentLocation, isWithinOffice } from "@/lib/geolocation";
import { useEffect, useState } from "react";
import {
  clockOutShift,
  createShift,
  formatTime,
  getTodayShift,
  ShiftRecord,
} from "../../../lib/storage";

export function ClockInOutTab() {
  const { user } = useUser();
  const [shift, setShift] = useState<ShiftRecord | null>(null);
  const [expectedClockOut, setExpectedClockOut] = useState("17:00");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);
  const [clockOutError, setClockOutError] = useState<{
    timestamp: number;
    location: boolean;
  } | null>(null);

  useEffect(() => {
    const todayShift = getTodayShift();
    setShift(todayShift);

    // Check if we need to auto-approve a pending approval after 1 hour
    if (
      todayShift &&
      todayShift.status === "pending-approval" &&
      todayShift.approvalRequiredAt
    ) {
      const approvalTime = new Date(todayShift.approvalRequiredAt).getTime();
      const now = Date.now();
      if (now - approvalTime > 3600000) {
        // 1 hour passed
        const updatedShift = { ...todayShift, status: "completed" as const };
        setShift(updatedShift);
        // Persist the change
        import("../../../lib/storage").then(({ saveShift }) => {
          saveShift(updatedShift);
        });
      }
    }
  }, []);

  const handleClockIn = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Get current location
      const location = await getCurrentLocation();

      if (!location.success) {
        setMessage({
          type: "error",
          text: `Location error: ${location.error}`,
        });
        setIsLoading(false);
        return;
      }

      // Create shift with expected clock out time
      const [hours, minutes] = expectedClockOut.split(":");
      const now = new Date();
      const expectedTime = new Date(now);
      expectedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await clockInApi(user.id);

      const newShift = createShift(expectedTime.toISOString(), {
        latitude: location.latitude!,
        longitude: location.longitude!,
      });

      setShift(newShift);
      setMessage({
        type: "success",
        text: "Clocked in successfully!",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to clock in. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!shift) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Get current location
      const location = await getCurrentLocation();

      if (!location.success) {
        setMessage({
          type: "error",
          text: `Location error: ${location.error}`,
        });
        setIsLoading(false);
        return;
      }

      // Check if within office
      const within = isWithinOffice(
        location.latitude!,
        location.longitude!,
        user.officeLocation.latitude,
        user.officeLocation.longitude,
        user.officeLocation.radiusMeters,
      );

      if (!within) {
        // Not within office - flag for approval
        setClockOutError({
          timestamp: Date.now(),
          location: true,
        });
        setMessage({
          type: "warning",
          text: "You are not at the office. Flagged for lead approval. This will auto-approve after 1 hour.",
        });

        // Update shift to pending-approval status
        const updatedShift = {
          ...shift,
          clockOutTime: new Date().toISOString(),
          status: "pending-approval" as const,
          approvalRequiredAt: new Date().toISOString(),
          location: {
            latitude: location.latitude!,
            longitude: location.longitude!,
          },
        };
        setShift(updatedShift);
        import("../../../lib/storage").then(({ saveShift }) => {
          saveShift(updatedShift);
        });
      } else {
        // Within office - complete the clock out
        await clockOutApi(user.id, shift.expectedClockOutTime);

        const updatedShift = clockOutShift(shift.id, new Date().toISOString(), {
          latitude: location.latitude!,
          longitude: location.longitude!,
        });

        setShift(updatedShift);
        setMessage({
          type: "success",
          text: "Clocked out successfully!",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to clock out. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canShowClockOut = shift && shift.status !== "completed";

  // Check if 2 hours have passed since clock in
  const canClockOut = () => {
    if (!shift) return false;
    const clockInTime = new Date(shift.clockInTime).getTime();
    const now = Date.now();
    return now - clockInTime >= 7200000; // 2 hours
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Today's Shift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-neutral-600">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full mt-2 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg disabled:opacity-60"
            />
          </div>

          {!shift ? (
            <>
              {/* Time In - Just show current time */}
              <div>
                <label className="text-sm font-medium text-neutral-600">
                  Time In
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleTimeString()}
                  disabled
                  className="w-full mt-2 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg  disabled:opacity-60"
                />
              </div>

              {/* Expected Time Out */}
              <div>
                <label className="text-sm font-medium text-neutral-600">
                  Expected Time Out
                </label>
                <input
                  type="time"
                  value={expectedClockOut}
                  onChange={(e) => setExpectedClockOut(e.target.value)}
                  className="w-full mt-2 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Clock In Button */}
              <Button
                onClick={handleClockIn}
                disabled={isLoading}
                className="w-full bg-linear-to-r from-purple-500 to-blue-500 cursor-pointer text-white h-10 rounded-lg "
              >
                {isLoading ? "Clocking In..." : "Clock In"}
              </Button>
            </>
          ) : (
            <>
              {/* Clocked In State */}
              <div>
                <label className="text-sm font-medium text-neutral-600">
                  Time In
                </label>
                <input
                  type="text"
                  value={formatTime(shift.clockInTime)}
                  disabled
                  className="w-full mt-2 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-600">
                  Expected Time Out
                </label>
                <input
                  type="text"
                  value={formatTime(shift.expectedClockOutTime)}
                  disabled
                  className="w-full mt-2 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 disabled:opacity-60"
                />
              </div>

              {/* Status Badge */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    Status: {shift.status === "pending" && "Clocked In"}
                    {shift.status === "completed" && "Clocked Out"}
                    {shift.status === "pending-approval" &&
                      "Pending Lead Approval"}
                  </span>
                  {shift.clockOutTime && (
                    <span className="text-sm text-blue-700">
                      Clock Out: {formatTime(shift.clockOutTime)}
                    </span>
                  )}
                </div>
              </div>

              {/* Clock Out Button */}
              {canShowClockOut && (
                <Button
                  onClick={handleClockOut}
                  disabled={isLoading || !canClockOut()}
                  className={`w-full h-12 rounded-lg font-medium ${
                    canClockOut()
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  }`}
                >
                  {isLoading
                    ? "Clocking Out..."
                    : canClockOut()
                      ? "Clock Out"
                      : `Clock Out Available in ${Math.ceil((7200000 - (Date.now() - new Date(shift.clockInTime).getTime())) / 60000)} minutes`}
                </Button>
              )}
            </>
          )}

          {/* Messages */}
          {message && (
            <div
              className={`p-4 rounded-lg text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : message.type === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
