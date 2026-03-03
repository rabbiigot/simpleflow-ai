import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from "@tanstack/react-router";
import { AUTH_TOKEN_KEY } from "@/store/auth-store";
import RootLayout from "../components/layout/rootLayout";
const Dashboard = lazyRouteComponent(() => import("@/pages/Dashboard"));
const Tasks = lazyRouteComponent(() => import("@/pages/Tasks"));
const Finance = lazyRouteComponent(() => import("@/pages/Finance"));
const Ananlytics = lazyRouteComponent(() => import("@/pages/Analytics"));
const Automation = lazyRouteComponent(() => import("@/pages/Automation"));
const Workspace = lazyRouteComponent(() => import("@/pages/Workspace"));
const Signup = lazyRouteComponent(() => import("@/pages/Signup"));
const Social = lazyRouteComponent(() => import("@/pages/Social"));
const GetStarted = lazyRouteComponent(() => import("@/pages/GetStarted"));
const Project = lazyRouteComponent(() => import("@/pages/Projects"));
const Insights = lazyRouteComponent(() => import("@/pages/Insights"));
const Timesheet = lazyRouteComponent(() => import("@/pages/Timesheet"));
const Login = lazyRouteComponent(() => import("@/pages/Login"));

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
  component: Ananlytics,
  beforeLoad: requireAuth,
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

const TimeSheetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "time-sheet",
  component: Timesheet,
  beforeLoad: requireAuth,
});

const routeTree = rootRoute.addChildren([
  SignupRoute,
  LoginRoute,
  indexRoute,
  dashboardRoute,
  financeRoute,
  tasksRoute,
  analyticsRoute,
  automationRoute,
  workspaceRoute,
  projectRoute,
  socialRoute,
  getStartedRoute,
  insightsRoute,
  TimeSheetRoute,
]);

const router = createRouter({
  routeTree,
});

export default router;
