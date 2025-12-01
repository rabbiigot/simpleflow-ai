import HeaderContainer from "@/components/layout/header/headerContainer";
import SidebarContainer from "@/components/layout/sidebar/sidebarContainer";
import { Outlet } from "@tanstack/react-router";
import { useState } from "react";

const RootLayout = () => {
  const [sidebarState, setSidebarState] = useState<"expanded" | "collapsed">(
    "expanded"
  );

  const toggleSidebar = () => {
    setSidebarState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-gray-100">
      <HeaderContainer />
      <div
        className={`flex flex-col fixed top-[70px] z-40 left-0 transition-all ${
          sidebarState !== "expanded" ? "w-62" : "w-19"
        } h-screen`}
      >
        <SidebarContainer
          sidebarState={sidebarState}
          toggleSidebar={toggleSidebar}
        />
      </div>
      <div
        className={`fixed top-[60px] z-0 w-full transition-all py-3 pr-3 ${
          sidebarState !== "expanded" ? "pl-65" : "pl-22"
        }`}
        style={{ height: "calc(100vh - 50px)" }}
      >
        <div className="relative overflow-y-auto w-full h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default RootLayout;
