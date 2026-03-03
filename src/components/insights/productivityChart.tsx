"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { day: "Mon", productivity: 75, target: 80 },
  { day: "Tue", productivity: 82, target: 80 },
  { day: "Wed", productivity: 78, target: 80 },
  { day: "Thu", productivity: 85, target: 80 },
  { day: "Fri", productivity: 88, target: 80 },
  { day: "Sat", productivity: 72, target: 80 },
  { day: "Sun", productivity: 70, target: 80 },
];

export function ProductivityChart() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Weekly Productivity Trend</CardTitle>
        <CardDescription>
          Your productivity score compared to target
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="productivity"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-1)" }}
              name="Productivity"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="var(--chart-2)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "var(--chart-2)" }}
              name="Target"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
