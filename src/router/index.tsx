import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  NotFoundRoute,
  redirect,
} from "@tanstack/react-router";
import NotFound from "@/pages/NotFound";
import { AUTH_TOKEN_KEY } from "@/store/auth-store";
import RootLayout from "../components/layout/rootLayout";
import {
  RouteErrorComponent,
  RoutePendingComponent,
} from "@/components/ui/error-boundary";
const Dashboard = lazyRouteComponent(() => import("@/pages/Dashboard"));
const Tasks = lazyRouteComponent(() => import("@/pages/Tasks"));
const Finance = lazyRouteComponent(() => import("@/pages/Finance"));
const Automation = lazyRouteComponent(() => import("@/pages/Automation"));
const Workspace = lazyRouteComponent(() => import("@/pages/Workspace"));
const Signup = lazyRouteComponent(() => import("@/pages/Signup"));
const Social = lazyRouteComponent(() => import("@/pages/Social"));
const SocialProfile = lazyRouteComponent(() => import("@/pages/SocialProfile"));
const ProfileSettingsPage = lazyRouteComponent(() => import("@/pages/ProfileSettingsPage"));
const GetStarted = lazyRouteComponent(() => import("@/pages/GetStarted"));
const Project = lazyRouteComponent(() => import("@/pages/Projects"));
const Insights = lazyRouteComponent(() => import("@/pages/Insights"));
const Login = lazyRouteComponent(() => import("@/pages/Login"));
const VerifyEmail = lazyRouteComponent(() => import("@/pages/VerifyEmail"));
const Campaign = lazyRouteComponent(() => import("@/pages/Campaign"));
const FlowmoChat = lazyRouteComponent(() => import("@/pages/FlowmoChat"));
const AdminPage = lazyRouteComponent(() => import("@/pages/AdminPage"));

const requireAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    throw redirect({ to: "/login" });
  }
};

const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: RouteErrorComponent,
  pendingComponent: RoutePendingComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
  beforeLoad: requireAuth,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "dashboard",
  component: Dashboard,
  beforeLoad: requireAuth,
});

const socialRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "social",
  component: Social,
  beforeLoad: requireAuth,
});

const socialProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "social/profile",
  component: SocialProfile,
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || undefined,
  }),
});

const socialUserProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "social/profile/$userId",
  component: SocialProfile,
  beforeLoad: requireAuth,
});

const profileSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "profile/settings",
  component: ProfileSettingsPage,
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || undefined,
    connected: (search.connected as string) || undefined,
  }),
});

const getStartedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "get-started",
  component: GetStarted,
});

const financeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "finance",
  component: Finance,
  beforeLoad: requireAuth,
});

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "tasks",
  component: Tasks,
  beforeLoad: requireAuth,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "analytics",
  beforeLoad: () => {
    throw redirect({ to: "/insights" });
  },
});

const automationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "automation",
  component: Automation,
  beforeLoad: requireAuth,
});

const insightsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "insights",
  component: Insights,
  beforeLoad: requireAuth,
});

const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "workspace",
  component: Workspace,
  beforeLoad: requireAuth,
});

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "workspace/project/$projectId",
  component: Project,
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (["dashboard", "tasks", "gantt", "channel", "calendar"].includes(search.tab as string)
      ? search.tab
      : "dashboard") as "dashboard" | "tasks" | "gantt" | "channel" | "calendar",
  }),
});

const SignupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "sign-up",
  component: Signup,
});

const LoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "login",
  component: Login,
});

const VerifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "verify-email",
  component: VerifyEmail,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
});

const campaignRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "campaign",
  component: Campaign,
  beforeLoad: requireAuth,
});

const flowmoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "flowmo",
  component: FlowmoChat,
  beforeLoad: requireAuth,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  SignupRoute,
  LoginRoute,
  VerifyEmailRoute,
  indexRoute,
  dashboardRoute,
  financeRoute,
  tasksRoute,
  analyticsRoute,
  automationRoute,
  workspaceRoute,
  projectRoute,
  socialRoute,
  socialProfileRoute,
  socialUserProfileRoute,
  profileSettingsRoute,
  getStartedRoute,
  insightsRoute,
  campaignRoute,
  flowmoRoute,
  adminRoute,
]);

const notFoundRoute = new NotFoundRoute({
  getParentRoute: () => rootRoute,
  component: NotFound,
});

const router = createRouter({
  routeTree,
  notFoundRoute,
});

export default router;
