import SidebarContainer from "@/components/layout/sidebar/sidebarContainer";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useMemo, useState } from "react";
import FlowmoAssistantContainer from "./AI/flowmoAssistantContainer";
import HeaderContainer from "./header/headerContainer";
import PlanLimitModal from "./PlanLimitModal";

const AiPanelContext = createContext<"expanded" | "collapsed">("collapsed");
export const useAiPanelState = () => useContext(AiPanelContext);

const RootLayout = () => {
  const [sidebarState, setSidebarState] = useState<"expanded" | "collapsed">(
    "expanded",
  );
  const [aiState, setAiState] = useState<"expanded" | "collapsed">("collapsed");
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const routerState = useRouterState();
  const isNotFound = routerState.statusCode === 404 ||
    routerState.matches?.some((m) => (m as any).notFoundError != null);

  const KNOWN_PATHS = [
    "/", "/dashboard", "/social", "/finance", "/tasks",
    "/automation", "/workspace", "/insights", "/analytics",
    "/campaign", "/flowmo",
    "/sign-up", "/login", "/get-started", "/verify-email",
    "/admin",
  ];
  const isKnownPath = KNOWN_PATHS.some(
    (p) => pathname === p || pathname.startsWith("/workspace/project/") || pathname.startsWith("/social/profile") || pathname.startsWith("/profile/settings"),
  );

  const loggingPages = useMemo(() => {
    return (
      pathname === "/sign-up" ||
      pathname === "/login" ||
      pathname === "/get-started" ||
      pathname === "/verify-email" ||
      pathname === "/admin" ||
      isNotFound ||
      !isKnownPath
    );
  }, [pathname, isNotFound, isKnownPath]);

  const isFlowmoPage = pathname === "/flowmo";

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
              className={`fixed flex flex-col z-40 left-0 transition-[width] duration-300 ease-in-out ${
                sidebarState !== "expanded" ? "w-19" : "w-65"
              } h-screen`}
            >
              <HeaderContainer sidebarState={sidebarState} />
              <div className="relative flex-1">
                <SidebarContainer
                  sidebarState={sidebarState}
                  toggleSidebar={toggleSidebar}
                />
              </div>
            </div>
            <div
              className={` z-30 w-full transition-all duration-300 ease-in-out ${
                sidebarState !== "expanded" ? "pl-19 " : "pl-65 "
              } ${isFlowmoPage ? "pr-0" : aiState !== "expanded" ? "pr-20" : "pr-100"}`}
              style={{ height: "calc(100vh)" }}
            >
              <AiPanelContext.Provider value={aiState}>
                <div className="@container/main relative h-full w-full overflow-y-auto bg-background">
                  <Outlet />
                </div>
              </AiPanelContext.Provider>
            </div>
            {!isFlowmoPage && (
              <div className="relative flex-1 ">
                <FlowmoAssistantContainer aiState={aiState} toggleAI={toggleAI} />
              </div>
            )}
          </div>
          <PlanLimitModal />
        </>
      )}
    </>
  );
};

export default RootLayout;
