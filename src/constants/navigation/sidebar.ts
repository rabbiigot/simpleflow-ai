import {
  BarChart3,
  HandHeart,
  Layers,
  LayoutDashboard,
  Megaphone,
  PhoneCall,
  ServerCog,
  Sparkles,
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
  {
    name: "Campaign",
    icon: Megaphone,
    href: "/campaign",
  },
  {
    name: "Call Flows",
    icon: PhoneCall,
    href: "/call-flows",
  },
  {
    name: "Flowmo AI",
    icon: Sparkles,
    href: "/flowmo",
  },
];
