import {
  BarChart3,
  Layers,
  LayoutDashboard,
  Receipt,
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
    name: "Workspace",
    icon: Layers,
    href: "/workspace",
  },
  {
    name: "Tasks",
    icon: ServerCog,
    href: "/tasks",
  },
  {
    name: "Finance",
    icon: Receipt,
    href: "/finance",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    name: "Automation",
    icon: Workflow,
    href: "/automation",
  },
];
