import { InsightsHeader } from "@/components/insights/insightsHeader";
import { MetricsOverview } from "@/components/insights/metricsOverview";
import { ProductivityChart } from "@/components/insights/productivityChart";
import { ReportsTable } from "@/components/insights/reportsTable";
import { TaskCompletionChart } from "@/components/insights/taskCompletionChart";
import { TimeAllocationChart } from "@/components/insights/timeAllocationChart";

const InsightsContainer = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <InsightsHeader />

        <MetricsOverview />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductivityChart />
          <TaskCompletionChart />
        </div>

        <TimeAllocationChart />

        <ReportsTable />
      </div>
    </div>
  );
};

export default InsightsContainer;
