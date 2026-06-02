import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TaskCompletionChartProps = {
  data: Array<{ category: string; value: number }>;
};

export function TaskCompletionChart({ data }: TaskCompletionChartProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Task Status Overview</CardTitle>
        <CardDescription>Breakdown of all tasks by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="category" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            />
            <Bar
              dataKey="value"
              fill="var(--chart-1)"
              radius={[8, 8, 0, 0]}
              name="Count"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
