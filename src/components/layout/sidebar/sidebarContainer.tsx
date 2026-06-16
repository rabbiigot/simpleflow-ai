import { Card } from "@/components/ui/card";
import { navigationSidebarItems } from "@/constants/navigation/sidebar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { usePlanEntitlements } from "@/hooks/use-plan-entitlements";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import FooterContainer from "./footerContainer";
import SidebarButton from "./sidebarButton";

type SidebarButtonProps = {
  sidebarState: string;
  toggleSidebar: () => void;
};

const SidebarContainer = ({
  sidebarState,
  toggleSidebar,
}: SidebarButtonProps) => {
  const { pathname } = useLocation();
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = authUser?.role === "ADMIN";
  const featureFlags = authUser?.featureFlags;
  const entitlements = usePlanEntitlements();
  const [currentPathname, setCurrentPathname] = useState<string>(pathname);
  const navItems = useMemo(() =>
    navigationSidebarItems.filter((item) => {
      // Automation requires a plan that allows automations (Free = 0).
      if (item.name === "Automation") {
        return isAdmin || (entitlements ? entitlements.maxAutomations !== 0 : false);
      }
      // Campaign requires a plan with email campaigns (or an explicit feature flag).
      if (item.name === "Campaign") {
        return (
          isAdmin ||
          featureFlags?.campaign === true ||
          (entitlements ? entitlements.emailCampaigns : false)
        );
      }
      return true;
    }),
  [isAdmin, featureFlags, entitlements]);
  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  return (
    <>
      <Card className="flex flex-col border-r z-30 border-t-0 rounded-none h-full grow px-3 pb-2">
        <nav className="flex flex-1 z-50 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1 p-1">
            {navItems.map((item, index) => {
              const isActive = currentPathname === item.href;

              return (
                <li key={index}>
                  <Link
                    to={item.href}
                    data-tour={`sidebar-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className={cn(
                      isActive
                        ? "bg-linear-to-r from-purple-500 via-indigo-500 to-blue-500 text-white"
                        : "text-sidebar-foreground hover:bg-accent hover:text-sidebar-accent-foreground",
                      "group flex items-center gap-x-2 rounded-md px-1.5 py-2 text-sm font-medium transition-colors duration-200",
                      sidebarState !== "expanded" && "w-10 justify-center px-0 pl-1.5",
                    )}
                  >
                    <item.icon
                      className={`shrink-0 ${
                        isActive ? "text-white" : "text-indigo-700 dark:text-blue-400"
                      }`}
                      size={20}
                      strokeWidth={1.5}
                    />

                    <span
                      className={cn(
                        "whitespace-nowrap overflow-hidden transition-all duration-300",
                        sidebarState !== "expanded"
                          ? "opacity-0 w-0"
                          : "opacity-100 ml-2 w-auto",
                      )}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <FooterContainer sidebarState={sidebarState} />
      </Card>
      <SidebarButton
        sidebarState={sidebarState}
        toggleSidebar={toggleSidebar}
      />
    </>
  );
};

export default SidebarContainer;
