import { Card } from "@/components/ui/card";
import { navigationSidebarItems } from "@/constants/navigation/sidebar";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const [currentPathname, setCurrentPathname] = useState<string>(pathname);
  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  return (
    <>
      <Card className="flex flex-col border-r z-30 border-t-0 rounded-none h-full grow px-3 pb-4">
        {/* <CardHeader title="Sidebar" /> */}
        <nav className="flex flex-1 z-50 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1 p-1">
            {navigationSidebarItems.map((item, index) => {
              const isActive = currentPathname === item.href;

              return (
                <li key={index}>
                  <Link
                    to={item.href}
                    className={cn(
                      isActive
                        ? "bg-linear-to-r from-purple-500 via-indigo-500 to-blue-500 text-white"
                        : "text-sidebar-foreground hover:bg-gray-200 hover:text-sidebar-accent-foreground",
                      "group flex items-center gap-x-2 rounded-md p-2 text-sm font-medium transition-colors duration-200"
                    )}
                  >
                    <item.icon
                      className={`shrink-0 ${
                        isActive ? "text-white" : "text-indigo-700"
                      }`}
                    />

                    <span
                      className={cn(
                        "whitespace-nowrap overflow-hidden transition-all duration-300",
                        sidebarState !== "expanded"
                          ? "opacity-0 w-0"
                          : "opacity-100 ml-2 w-auto"
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
      </Card>
      <SidebarButton
        sidebarState={sidebarState}
        toggleSidebar={toggleSidebar}
      />
      <FooterContainer
        sidebarState={sidebarState}
      />
    </>
  );
};

export default SidebarContainer;
