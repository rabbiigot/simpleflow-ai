import SidebarContainer from "@/components/layout/sidebar/sidebarContainer";
import { Outlet, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import FlowmoAssistantContainer from "./AI/flowmoAssistantContainer";
import HeaderContainer from "./header/headerContainer";

const RootLayout = () => {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const [sidebarState, setSidebarState] = useState<"expanded" | "collapsed">(
    "expanded"
  );
  const [aiState, setAiState] = useState<"expanded" | "collapsed">("collapsed");
  const [loggingPages, setLoggingPages] = useState<boolean>(false);

  useEffect(() => {
    if (pathname === "/sign-up" || pathname === "/get-started") {
      setLoggingPages(true);
    } else {
      setLoggingPages(false);
    }
  }, [pathname, loggingPages]);

  const toggleSidebar = () => {
    setSidebarState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
  };

  const toggleAI = () => {
    setAiState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
  };

  return (
    <>
      {loggingPages ? (
        <>
          <Outlet />
        </>
      ) : (
        <>
          <div className="z-0 w-full h-screen overflow-hidden ">
            <div
              className={`fixed flex flex-col z-40 left-0 ${
                sidebarState !== "expanded" ? "w-19" : "w-62"
              } h-screen`}
            >
              <HeaderContainer sidebarState={sidebarState} />
              <div className="relative flex-1 -mt-3 ">
                <SidebarContainer
                  sidebarState={sidebarState}
                  toggleSidebar={toggleSidebar}
                />
              </div>
            </div>
            <div
              className={`relative z-30 w-full transition-all  ${
                sidebarState !== "expanded" ? "pl-22 " : "pl-65 "
              } ${aiState !== "expanded" ? "pr-22" : "pr-100"}`}
              style={{ height: "calc(100vh)" }}
            >
              <div className="relative overflow-y-auto w-full h-full">
                <Outlet />
              </div>
            </div>
            <div className="relative flex-1 ">
              <FlowmoAssistantContainer aiState={aiState} toggleAI={toggleAI} />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default RootLayout;
