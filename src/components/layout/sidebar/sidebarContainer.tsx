import { Card } from "@/components/ui/card";
import { navigationSidebarItems } from "@/constants/navigation/sidebar";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
      <Card className="flex flex-col rounded-none h-full grow gap-y-5 bg-sidebar px-3 pb-4">
        {/* <CardHeader title="Sidebar" /> */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1 p-1">
            {navigationSidebarItems.map((item, index) => {
              const isActive = currentPathname === item.href;

              return (
                <li key={index}>
                  <Link
                    to={item.href}
                    className={cn(
                      isActive
                        ? "bg-orange-500 text-white"
                        : "text-sidebar-foreground hover:bg-gray-200 hover:text-sidebar-accent-foreground",
                      "group flex items-center gap-x-2 rounded-md p-2 text-sm font-medium transition-colors duration-200"
                    )}
                  >
                    <item.icon className="shrink-0" />

                    {/* Keep the text in DOM but fade/slide it */}
                    <span
                      className={cn(
                        "whitespace-nowrap overflow-hidden transition-all duration-300",
                        sidebarState !== "expanded"
                          ? "opacity-100 ml-2 w-auto"
                          : "opacity-0 w-0"
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
      <div className="sticky bottom-0 bg-sidebar pb-2">
        <SidebarButton
          sidebarState={sidebarState}
          toggleSidebar={toggleSidebar}
        />
      </div>
    </>
  );
};

export default SidebarContainer;
