"use client";

import { ClockInOutTab } from "@/components/timesheet/timesheet-tabs/clock-in-tab";
import { HistoryTab } from "@/components/timesheet/timesheet-tabs/history-tab";
import { LeaveRequestTab } from "@/components/timesheet/timesheet-tabs/leave-request";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function TimesheetPage() {
  const [activeTab, setActiveTab] = useState("clock-in");

  return (
    <main className="min-h-screen ">
      <div className="max-w-3xl mx-auto sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Timesheet</h1>
          <p className="mt-2 text-neutral-600">
            Manage your clock-in/out, view your shift history, and request leave
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-neutral-200 h-10 rounded-lg">
            <TabsTrigger
              value="clock-in"
              className="data-[state=active]:bg-indigo-500 cursor-pointer data-[state=active]:text-white"
            >
              Clock In/Out
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-indigo-500 cursor-pointer data-[state=active]:text-white"
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="leaves"
              className="data-[state=active]:bg-indigo-500 cursor-pointer data-[state=active]:text-white"
            >
              Leave
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <div className="mt-8">
            <TabsContent
              value="clock-in"
              className="focus-visible:outline-none"
            >
              <ClockInOutTab />
            </TabsContent>

            <TabsContent value="history" className="focus-visible:outline-none">
              <HistoryTab />
            </TabsContent>

            <TabsContent value="leaves" className="focus-visible:outline-none">
              <LeaveRequestTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  );
}
