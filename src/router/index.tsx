import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from "@tanstack/react-router";
import RootLayout from "../components/layout/rootLayout";

const Dashboard = lazyRouteComponent(() => import("@/pages/Dashboard"));
const Tasks = lazyRouteComponent(() => import("@/pages/Tasks"));
const Finance = lazyRouteComponent(() => import("@/pages/Finance"));
const Ananlytics = lazyRouteComponent(() => import("@/pages/Analytics"));
const Automation = lazyRouteComponent(() => import("@/pages/Automation"));
const Workspace = lazyRouteComponent(() => import("@/pages/Workspace"));
const Signup = lazyRouteComponent(() => import("@/pages/Signup"));

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "dashboard",
  component: Dashboard,
});

const financeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "finance",
  component: Finance,
});

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "tasks",
  component: Tasks,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "analytics",
  component: Ananlytics,
});

const automationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "automation",
  component: Automation,
});

const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "workspace",
  component: Workspace,
});

const SignupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "sign-up",
  component: Signup,
});

const routeTree = rootRoute.addChildren([
  SignupRoute,
  indexRoute,
  dashboardRoute,
  financeRoute,
  tasksRoute,
  analyticsRoute,
  automationRoute,
  workspaceRoute,
]);

const router = createRouter({
  routeTree,
});

export default router;
