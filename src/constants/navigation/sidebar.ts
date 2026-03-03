import {
  AlarmClockCheck,
  BarChart3,
  HandHeart,
  Layers,
  LayoutDashboard,
  ServerCog,
  Workflow,
} from "lucide-react";
import type { NavigationItem } from "../../interface/navigationItems";

export const navigationSidebarItems: NavigationItem[] = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    name: "Social",
    icon: HandHeart,
    href: "/social",
  },
  {
    name: "Workspace",
    icon: Layers,
    href: "/workspace",
  },
  {
    name: "Tasks",
    icon: ServerCog,
    href: "/tasks",
  },
  // {
  //   name: "Finances",
  //   icon: Receipt,
  //   href: "/finances",
  // },
  {
    name: "Time Sheet",
    icon: AlarmClockCheck,
    href: "/time-sheet",
  },
  {
    name: "Insights & Reports",
    icon: BarChart3,
    href: "/insights",
  },
  {
    name: "Automation",
    icon: Workflow,
    href: "/automation",
  },
];
