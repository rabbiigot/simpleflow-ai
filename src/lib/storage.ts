// Types for timesheet data
export interface ShiftRecord {
  id: string;
  date: string; // ISO format
  clockInTime: string; // ISO format
  expectedClockOutTime: string; // ISO format (selected by user)
  clockOutTime: string | null; // ISO format or null if not clocked out
  status: "pending" | "completed" | "pending-approval"; // pending: clocked in, waiting for clock out; completed: both times set; pending-approval: clock out flagged for lead approval
  location?: {
    latitude: number;
    longitude: number;
  };
  approvalRequiredAt?: string; // ISO format - when approval was requested
  notes?: string;
  type: "shift" | "leave"; // Added type field to distinguish between shift and leave records
}

export interface LeaveRecord {
  id: string;
  date: string; // ISO format
  type: "shift" | "leave"; // sick is auto-approved
  reason: string;
  status: "approved" | "pending"; // sick is always approved
  createdAt: string; // ISO format
}

// Shift management
export function getShifts(): ShiftRecord[] {
  if (typeof window === "undefined") return [];
  const shifts = localStorage.getItem("shifts");
  return shifts ? JSON.parse(shifts) : [];
}

export function saveShift(shift: ShiftRecord): void {
  if (typeof window === "undefined") return;
  const shifts = getShifts();
  const existingIndex = shifts.findIndex((s) => s.id === shift.id);
  if (existingIndex >= 0) {
    shifts[existingIndex] = shift;
  } else {
    shifts.push(shift);
  }
  localStorage.setItem("shifts", JSON.stringify(shifts));
}

export function createShift(
  expectedClockOutTime: string,
  location?: { latitude: number; longitude: number },
): ShiftRecord {
  const shift: ShiftRecord = {
    id: `shift-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    clockInTime: new Date().toISOString(),
    expectedClockOutTime,
    clockOutTime: null,
    status: "pending",
    location,
    type: "shift",
  };
  saveShift(shift);
  return shift;
}

export function getTodayShift(): ShiftRecord | null {
  const shifts = getShifts();
  const today = new Date().toISOString().split("T")[0];
  return shifts.find((s) => s.date === today) || null;
}

export function clockOutShift(
  shiftId: string,
  clockOutTime: string,
  location?: { latitude: number; longitude: number },
): ShiftRecord {
  const shifts = getShifts();
  const shift = shifts.find((s) => s.id === shiftId);
  if (!shift) throw new Error("Shift not found");

  shift.clockOutTime = clockOutTime;
  shift.location = location;
  shift.status = "completed";
  saveShift(shift);
  return shift;
}

// Leave management
export function getLeaves(): LeaveRecord[] {
  if (typeof window === "undefined") return [];
  const leaves = localStorage.getItem("leaves");
  return leaves ? JSON.parse(leaves) : [];
}

export function saveLeave(leave: LeaveRecord): void {
  if (typeof window === "undefined") return;
  const leaves = getLeaves();
  const existingIndex = leaves.findIndex((l) => l.id === leave.id);
  if (existingIndex >= 0) {
    leaves[existingIndex] = leave;
  } else {
    leaves.push(leave);
  }
  localStorage.setItem("leaves", JSON.stringify(leaves));
}

export function createLeave(
  date: string,
  type: "shift" | "leave",
  reason: string,
): LeaveRecord {
  const leave: LeaveRecord = {
    id: `leave-${Date.now()}`,
    date,
    type,
    reason,
    status: type === "leave" ? "approved" : "pending",
    createdAt: new Date().toISOString(),
  };
  saveLeave(leave);
  return leave;
}

// Utility functions
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function groupShiftsByMonth(
  shifts: ShiftRecord[],
): Record<string, ShiftRecord[]> {
  const grouped: Record<string, ShiftRecord[]> = {};
  shifts.forEach((shift) => {
    const date = new Date(shift.date);
    const monthKey = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(shift);
  });
  return grouped;
}

export function groupLeavesByMonth(
  leaves: LeaveRecord[],
): Record<string, LeaveRecord[]> {
  const grouped: Record<string, LeaveRecord[]> = {};
  leaves.forEach((leave) => {
    const date = new Date(leave.date);
    const monthKey = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(leave);
  });
  return grouped;
}
