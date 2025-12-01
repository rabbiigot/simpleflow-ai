import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, DollarSign, Target, TrendingUp } from "lucide-react";

const information = [
  {
    title: "Active Goals",
    icon: Target,
    value: "3",
    description: "+1 from last month",
  },
  {
    title: "Completed Tasks",
    icon: CheckCircle,
    value: "5",
    description: "-2 from last month",
  },
  {
    title: "Success Rate",
    icon: TrendingUp,
    value: "90%",
    description: "No change from last month",
  },
  {
    title: "Monthly Budget",
    icon: DollarSign,
    value: "$1,200",
    description: "$300 remaining",
  },
];

const DashboardContainerV2 = () => {
  return (
    <div>
      <div className="grid gap-4 my-4 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2">
        {information.map((infoCard) => (
          <Card key={infoCard.title} className="p-4">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="">{infoCard.title}</CardTitle>
              <infoCard.icon className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              {infoCard.value}
              <p>{infoCard.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardContainerV2;
