import SidebarContainer from "@/components/layout/sidebar/sidebarContainer";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import FlowmoAssistantContainer from "./AI/flowmoAssistantContainer";
import HeaderContainer from "./header/headerContainer";
import PlanLimitModal from "./PlanLimitModal";
import MobileTopBar from "./mobile/MobileTopBar";
import MobileBottomNav from "./mobile/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { navigationSidebarItems } from "@/constants/navigation/sidebar";
import type { NavigationItem } from "@/interface/navigationItems";

// Primary destinations surfaced in the mobile bottom nav, split around the
// center Flowmo button. Analytics/Automation/Campaign live in the profile
// dropdown; Flowmo is the center button.
const MOBILE_BOTTOM_NAV: NavigationItem[] = ["/dashboard", "/social", "/workspace", "/tasks"]
  .map((href) => navigationSidebarItems.find((i) => i.href === href))
  .filter((i): i is NavigationItem => Boolean(i));

const AiPanelContext = createContext<"expanded" | "collapsed">("collapsed");
export const useAiPanelState = () => useContext(AiPanelContext);

const RootLayout = () => {
  const [sidebarState, setSidebarState] = useState<"expanded" | "collapsed">(
    "expanded",
  );
  const [aiState, setAiState] = useState<"expanded" | "collapsed">("collapsed");
  const [aiInitialView, setAiInitialView] = useState<"chat" | "notifications">("chat");
  const [mobileUnread, setMobileUnread] = useState(0);
  const isMobile = useIsMobile();
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

  // Collapse the AI sheet when switching to desktop so it doesn't linger open.
  useEffect(() => {
    if (!isMobile) setAiState("collapsed");
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
  };

  const toggleAI = () => {
    setAiState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
  };

  // Open the Flowmo bottom sheet straight to a given view (chat / notifications).
  const openAiTo = (view: "chat" | "notifications") => {
    setAiInitialView(view);
    setAiState("expanded");
  };

  if (loggingPages) {
    return <Outlet />;
  }

  // ── Mobile layout ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
          <MobileTopBar
            onNotifClick={() => openAiTo("notifications")}
            onAiClick={() => openAiTo("chat")}
            unreadCount={mobileUnread}
          />

          <AiPanelContext.Provider value={aiState}>
            <main
              className="@container/main relative flex-1 overflow-y-auto bg-background pt-14 pb-[calc(4rem+env(safe-area-inset-bottom))]"
            >
              <Outlet />
            </main>
          </AiPanelContext.Provider>

          {!isFlowmoPage && (
            <MobileBottomNav
              items={MOBILE_BOTTOM_NAV}
              onAiClick={() => openAiTo("chat")}
              aiActive={aiState === "expanded"}
            />
          )}
        </div>

        {/* Flowmo AI — renders as a drag-up bottom sheet on mobile */}
        <FlowmoAssistantContainer
          aiState={aiState}
          toggleAI={toggleAI}
          isMobile
          initialView={aiInitialView}
          onUnreadCountChange={setMobileUnread}
        />

        <PlanLimitModal />
      </>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────
  return (
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
  );
};

export default RootLayout;
