import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  Globe,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TourStep = {
  target: string;
  title: string;
  description: string;
  route?: string;
  search?: Record<string, string>;
  /** Static demo content rendered when the target element doesn't exist */
  demo?: React.ReactNode;
};

type TourItem = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  steps: TourStep[];
};

type PageTourData = {
  pageName: string;
  path: string;
  icon: React.ReactNode;
  overview: string;
  features: string[];
  tours: TourItem[];
};

/* ------------------------------------------------------------------ */
/*  Tour data                                                          */
/* ------------------------------------------------------------------ */

/* ── Static demo content for tours ── */

const DemoPost = () => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-[8px] font-bold text-indigo-600">JD</div>
      <div><p className="text-[10px] font-medium">John Doe</p><p className="text-[8px] text-muted-foreground">2 hours ago</p></div>
    </div>
    <p className="text-[10px] text-foreground">Just shipped the new dashboard redesign! Excited for the team to try it out.</p>
    <div className="flex gap-2 text-[8px] text-muted-foreground">
      <span>👍 3</span><span>❤️ 1</span><span>💬 2 comments</span>
    </div>
  </div>
);

const DemoTaskRow = ({ title, status, color }: { title: string; status: string; color: string }) => (
  <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
    <span className="text-[10px] font-medium">{title}</span>
    <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>{status}</span>
  </div>
);

const DemoMetricCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border p-1.5 text-center">
    <p className="text-sm font-bold text-primary">{value}</p>
    <p className="text-[8px] text-muted-foreground">{label}</p>
  </div>
);

const DemoChannel = ({ name, unread }: { name: string; unread?: number }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-[10px]"># {name}</span>
    {unread && <span className="text-[8px] bg-primary text-primary-foreground rounded-full px-1.5">{unread}</span>}
  </div>
);

const ALL_PAGES: PageTourData[] = [
  {
    pageName: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    overview: "Your central hub for tracking progress, goals, and daily activity.",
    features: ["Summary metrics", "Goal tracking", "Today's tasks", "AI insights"],
    tours: [
      {
        id: "dashboard-overview",
        label: "Dashboard Overview",
        description: "Learn about your dashboard metrics and widgets",
        icon: <LayoutDashboard className="h-4 w-4" />,
        steps: [
          { target: "dashboard-ai-insight", title: "AI Insight", description: "Flowmo analyzes your productivity and gives personalized recommendations — highlights and actionable tips.", route: "/dashboard",
            demo: <div className="space-y-1"><p className="text-[10px] font-medium text-primary">🤖 AI Insight</p><p className="text-[9px]">Team momentum is <b>steady</b>. 12 of 20 tasks completed (60%).</p><p className="text-[9px] text-muted-foreground">• 3 workspaces active • 15.2 hours logged</p></div> },
          { target: "dashboard-summary", title: "Summary Cards", description: "Key metrics at a glance — active workspaces, tasks completed, success rate, and monthly hours tracked.",
            demo: <div className="grid grid-cols-4 gap-1"><DemoMetricCard label="Goals" value="3" /><DemoMetricCard label="Tasks" value="12" /><DemoMetricCard label="Rate" value="60%" /><DemoMetricCard label="Hours" value="15h" /></div> },
          { target: "dashboard-goals", title: "Current Goals", description: "Track progress across your workspaces. Each card shows completion percentage with a progress bar.",
            demo: <div className="space-y-1.5"><div><p className="text-[10px] font-medium">Sprint 1</p><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: "75%" }} /></div><p className="text-[8px] text-muted-foreground">6/8 tasks</p></div><div><p className="text-[10px] font-medium">Marketing</p><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: "40%" }} /></div><p className="text-[8px] text-muted-foreground">4/10 tasks</p></div></div> },
          { target: "dashboard-today", title: "Today's Tasks", description: "Tasks created or due today. Click any task to jump directly to its workspace.",
            demo: <div><DemoTaskRow title="Fix login page" status="In Progress" color="#f59e0b" /><DemoTaskRow title="Update API docs" status="To Do" color="#94a3b8" /><DemoTaskRow title="Deploy v2.1" status="Done" color="#10b981" /></div> },
        ],
      },
    ],
  },
  {
    pageName: "Social Feed",
    path: "/social",
    icon: <Globe className="h-5 w-5" />,
    overview: "Share updates, engage with your team, and stay connected.",
    features: ["Posts & reactions", "Channels", "Comments", "Profile"],
    tours: [
      {
        id: "social-overview",
        label: "Social Feed",
        description: "Post updates and engage with your team",
        icon: <Globe className="h-4 w-4" />,
        steps: [
          { target: "social-channels", title: "Channels", description: "Browse and join channels for focused discussions. Create new channels or switch between feed and chat mode.", route: "/social",
            demo: <div className="space-y-0.5"><DemoChannel name="general" unread={3} /><DemoChannel name="design-team" /><DemoChannel name="engineering" unread={1} /><p className="text-[9px] text-indigo-500 mt-1 cursor-pointer">+ Create Channel</p></div> },
          { target: "social-create-post", title: "Create Post", description: "Share updates with your team. Add text, images, choose visibility, and share to specific channels.",
            demo: <div className="rounded-md border p-2 space-y-1.5"><div className="flex items-center gap-2"><div className="h-5 w-5 rounded-full bg-muted" /><span className="text-[9px] text-muted-foreground">What's on your mind?</span></div><div className="flex gap-1.5 text-[8px] text-muted-foreground"><span>📷 Image</span><span>🌐 Public</span><span>📢 Channel</span></div></div> },
          { target: "social-feed", title: "Social Feed", description: "See posts from your team. React with emojis (like, love, celebrate), leave comments, and share posts.",
            demo: <DemoPost /> },
          { target: "social-profile", title: "Your Profile", description: "View your profile card. Click to see your posts, edit your bio, and manage profile settings.",
            demo: <div className="text-center space-y-1"><div className="h-8 w-8 rounded-full bg-indigo-200 dark:bg-indigo-800 mx-auto flex items-center justify-center text-[10px] font-bold text-indigo-600">YO</div><p className="text-[10px] font-medium">Your Name</p><p className="text-[8px] text-muted-foreground">View profile, posts & bio</p></div> },
        ],
      },
    ],
  },
  {
    pageName: "Workspace",
    path: "/workspace",
    icon: <FolderOpen className="h-5 w-5" />,
    overview: "Organize tasks with boards, gantt charts, calendar, and collaboration.",
    features: ["Kanban & list views", "Gantt chart", "Calendar", "Channel", "Integrations"],
    tours: [
      {
        id: "workspace-full",
        label: "Workspace Tour",
        description: "Complete walkthrough of workspace features",
        icon: <FolderOpen className="h-4 w-4" />,
        steps: [
          // Dashboard tab
          { target: "workspace-tab-dashboard", title: "Dashboard Overview", description: "The Dashboard tab gives you a quick overview of your workspace — key metrics, recent tasks, member activity, and AI-powered insights.",
            route: "/workspace/project/:projectId", search: { tab: "dashboard" },
            demo: <div className="space-y-1.5">
              <div className="flex gap-1 text-[9px] mb-1"><span className="px-2 py-0.5 rounded bg-primary text-primary-foreground">Dashboard</span><span className="px-2 py-0.5 rounded bg-muted">Tasks</span><span className="px-2 py-0.5 rounded bg-muted">Gantt</span><span className="px-2 py-0.5 rounded bg-muted">Channel</span><span className="px-2 py-0.5 rounded bg-muted">Calendar</span></div>
              <div className="grid grid-cols-3 gap-1"><DemoMetricCard label="Total" value="12" /><DemoMetricCard label="Done" value="5" /><DemoMetricCard label="Rate" value="42%" /></div>
              <div><p className="text-[9px] font-medium">Recent Tasks</p><DemoTaskRow title="Fix login" status="In Progress" color="#f59e0b" /><DemoTaskRow title="Deploy" status="Done" color="#10b981" /></div>
            </div> },
          // Tasks tab — Board & List
          { target: "workspace-tab-tasks", title: "Tasks — Board & List View", description: "The Tasks tab shows your kanban board. Drag and drop tasks between columns (To Do, In Progress, Done). Switch to List view for a table layout.",
            route: "/workspace/project/:projectId", search: { tab: "tasks" },
            demo: <div className="space-y-1.5">
              <div className="flex gap-1 text-[9px] mb-1"><span className="px-2 py-0.5 rounded bg-muted">Dashboard</span><span className="px-2 py-0.5 rounded bg-primary text-primary-foreground">Tasks</span><span className="px-2 py-0.5 rounded bg-muted">Gantt</span></div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded border p-1"><p className="text-[8px] font-semibold text-muted-foreground mb-0.5">To Do</p><div className="rounded bg-muted/50 p-1 mb-0.5 text-[8px]">Fix login page</div><div className="rounded bg-muted/50 p-1 text-[8px]">Update docs</div></div>
                <div className="rounded border p-1"><p className="text-[8px] font-semibold text-amber-600 mb-0.5">In Progress</p><div className="rounded bg-amber-50 dark:bg-amber-950/20 p-1 mb-0.5 text-[8px]">Design UI</div></div>
                <div className="rounded border p-1"><p className="text-[8px] font-semibold text-emerald-600 mb-0.5">Done</p><div className="rounded bg-emerald-50 dark:bg-emerald-950/20 p-1 text-[8px]">API setup</div></div>
              </div>
              <div className="flex gap-1"><span className="text-[8px] px-1.5 py-0.5 rounded border">🔲 Board</span><span className="text-[8px] px-1.5 py-0.5 rounded border">☰ List</span></div>
            </div> },
          // Gantt tab
          { target: "workspace-tab-gantt", title: "Gantt Chart", description: "The Gantt tab shows your tasks on a timeline. See task durations, dependencies, and deadlines at a glance. Great for project planning.",
            route: "/workspace/project/:projectId", search: { tab: "gantt" },
            demo: <div className="space-y-1">
              <div className="flex gap-1 text-[9px] mb-1"><span className="px-2 py-0.5 rounded bg-muted">Tasks</span><span className="px-2 py-0.5 rounded bg-primary text-primary-foreground">Gantt</span><span className="px-2 py-0.5 rounded bg-muted">Channel</span></div>
              <div className="space-y-1">
                <div className="flex items-center gap-1"><span className="text-[8px] w-16 truncate">Fix login</span><div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: "60%", marginLeft: "10%" }} /></div></div>
                <div className="flex items-center gap-1"><span className="text-[8px] w-16 truncate">Design UI</span><div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: "40%", marginLeft: "30%" }} /></div></div>
                <div className="flex items-center gap-1"><span className="text-[8px] w-16 truncate">Deploy</span><div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: "20%", marginLeft: "70%" }} /></div></div>
              </div>
            </div> },
          // Channel tab
          { target: "workspace-tab-channel", title: "Channel Chat", description: "Each workspace has its own chat channel. Discuss tasks, share updates, and collaborate in real-time with your team.",
            route: "/workspace/project/:projectId", search: { tab: "channel" },
            demo: <div className="space-y-1">
              <div className="flex gap-1 text-[9px] mb-1"><span className="px-2 py-0.5 rounded bg-muted">Gantt</span><span className="px-2 py-0.5 rounded bg-primary text-primary-foreground">Channel</span><span className="px-2 py-0.5 rounded bg-muted">Calendar</span></div>
              <div className="space-y-1.5">
                <div className="flex gap-1.5 items-start"><div className="h-4 w-4 rounded-full bg-blue-200 shrink-0 mt-0.5" /><div className="rounded-lg bg-muted px-2 py-1 text-[8px]">Hey team, the API is ready for testing!</div></div>
                <div className="flex gap-1.5 items-start justify-end"><div className="rounded-lg bg-indigo-100 dark:bg-indigo-950/30 px-2 py-1 text-[8px]">Great, I'll start the integration</div><div className="h-4 w-4 rounded-full bg-emerald-200 shrink-0 mt-0.5" /></div>
              </div>
            </div> },
          // Calendar tab
          { target: "workspace-tab-calendar", title: "Calendar", description: "View task deadlines and Google Calendar events on a monthly calendar. Click a date to create a task. Sync with Google Calendar for your personal events.",
            route: "/workspace/project/:projectId", search: { tab: "calendar" },
            demo: <div className="space-y-1">
              <div className="flex gap-1 text-[9px] mb-1"><span className="px-2 py-0.5 rounded bg-muted">Channel</span><span className="px-2 py-0.5 rounded bg-primary text-primary-foreground">Calendar</span></div>
              <div className="grid grid-cols-7 gap-px text-[7px] text-center">
                {["S","M","T","W","T","F","S"].map((d,i) => <span key={i} className="font-medium text-muted-foreground py-0.5">{d}</span>)}
                {[null,null,1,2,3,4,5].map((d,i) => <span key={`w1-${i}`} className="py-0.5">{d}</span>)}
                {[6,7,8,9,10,11,12].map((d,i) => <span key={`w2-${i}`} className={`py-0.5 ${d===10?"bg-blue-100 dark:bg-blue-950/30 rounded font-bold text-blue-600":""}`}>{d}{d===10?"📅":""}</span>)}
              </div>
              <div className="flex gap-1 text-[8px]"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-0.5" /> Google Event <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-0.5 ml-1" /> Task</div>
            </div> },
          // Integrations
          { target: "workspace-kebab", title: "GitHub & Google Calendar", description: "Enable GitHub to track PRs and commits. Enable Google Calendar to sync events. Both show in notifications and Flowmo chat.",
            demo: <div className="space-y-1.5">
              <div className="flex items-center justify-between"><div className="flex items-center gap-1.5 text-[9px]"><span>🐙</span><span>GitHub</span></div><span className="text-[8px] text-emerald-600">Enabled</span></div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-1.5 text-[9px]"><span>📅</span><span>Google Calendar</span></div><span className="text-[8px] text-emerald-600">Enabled</span></div>
              <p className="text-[8px] text-muted-foreground">PRs and events appear in Flowmo chat and notifications.</p>
            </div> },
          // Invite
          { target: "workspace-kebab", title: "Invite & Members", description: "Invite team members by email. Manage roles (Admin/Member). View who's in the workspace from the kebab menu.",
            demo: <div className="space-y-1">
              <p className="text-[9px] font-medium">Members (3)</p>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5"><div className="h-4 w-4 rounded-full bg-indigo-200 text-[7px] flex items-center justify-center font-bold">JD</div><span className="text-[9px]">John Doe</span><span className="text-[7px] text-muted-foreground ml-auto">Owner</span></div>
                <div className="flex items-center gap-1.5"><div className="h-4 w-4 rounded-full bg-emerald-200 text-[7px] flex items-center justify-center font-bold">AS</div><span className="text-[9px]">Alice Smith</span><span className="text-[7px] text-muted-foreground ml-auto">Member</span></div>
              </div>
              <p className="text-[8px] text-indigo-500 mt-0.5">+ Invite member</p>
            </div> },
        ],
      },
    ],
  },
  {
    pageName: "Tasks",
    path: "/tasks",
    icon: <ClipboardList className="h-5 w-5" />,
    overview: "View all tasks assigned to you across every workspace.",
    features: ["All tasks view", "Status filters", "Quick-create", "Workspace links"],
    tours: [
      {
        id: "tasks-overview",
        label: "Tasks Overview",
        description: "View and filter your tasks across workspaces",
        icon: <ClipboardList className="h-4 w-4" />,
        steps: [
          { target: "tasks-tabs", title: "Status Filters", description: "Filter tasks by All, Active (pending + in progress), or Completed. Quickly find what needs attention.", route: "/tasks",
            demo: <div className="flex gap-1 text-[9px]"><span className="px-2 py-0.5 rounded bg-primary text-primary-foreground">All (15)</span><span className="px-2 py-0.5 rounded bg-muted">Active (8)</span><span className="px-2 py-0.5 rounded bg-muted">Completed (7)</span></div> },
          { target: "tasks-list", title: "Task List", description: "All tasks assigned to you across every workspace. Click a task row to open it in its workspace.",
            demo: <div><DemoTaskRow title="Fix login page" status="In Progress" color="#f59e0b" /><DemoTaskRow title="Update API docs" status="To Do" color="#94a3b8" /><DemoTaskRow title="Deploy v2.1" status="Done" color="#10b981" /><DemoTaskRow title="Write tests" status="To Do" color="#94a3b8" /></div> },
        ],
      },
    ],
  },
  {
    pageName: "Insights & Reports",
    path: "/insights",
    icon: <BarChart3 className="h-5 w-5" />,
    overview: "Track productivity with charts, metrics, and AI analytics.",
    features: ["Metrics", "Charts", "AI Q&A", "PDF/CSV export"],
    tours: [
      {
        id: "insights-overview",
        label: "Insights Tour",
        description: "Explore analytics, reports, and AI insights",
        icon: <BarChart3 className="h-4 w-4" />,
        steps: [
          { target: "insights-workspace", title: "Workspace Filter", description: "Filter analytics by workspace or view all workspaces combined. Select a time range (7d, 14d, 30d, 90d).", route: "/insights",
            demo: <div className="flex gap-1 text-[9px]"><span className="px-2 py-0.5 rounded-full border">All Workspaces</span><span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground">30d</span></div> },
          { target: "insights-ai", title: "Ask AI", description: "Ask Flowmo about your analytics — e.g. 'What's my productivity trend?' or 'Summarize this week'.",
            demo: <div className="rounded-md border p-1.5 flex items-center gap-1.5"><span className="text-[9px]">✨</span><span className="text-[9px] text-muted-foreground">Ask about your analytics...</span></div> },
          { target: "insights-export", title: "Export Reports", description: "Export your insights as PDF or CSV. Preview before downloading. Reports include metrics, charts data, and AI summaries.",
            demo: <div className="flex gap-1.5 text-[9px]"><span className="px-2 py-0.5 rounded border">📄 PDF</span><span className="px-2 py-0.5 rounded border">📊 CSV</span></div> },
          { target: "insights-charts", title: "Charts & Trends", description: "Productivity trend line, task status breakdown, and time allocation pie chart — all update based on your filters.",
            demo: <div className="grid grid-cols-2 gap-1.5"><div className="rounded-md border p-1.5 text-center"><p className="text-[8px] text-muted-foreground">Productivity</p><p className="text-[10px] font-bold text-primary">📈 75%</p></div><div className="rounded-md border p-1.5 text-center"><p className="text-[8px] text-muted-foreground">Tasks</p><p className="text-[10px] font-bold text-primary">📊 24</p></div></div> },
        ],
      },
    ],
  },
  {
    pageName: "Automation",
    path: "/automation",
    icon: <Zap className="h-5 w-5" />,
    overview: "Automate repetitive workflows with triggers and actions.",
    features: ["Trigger-based automations", "Workflow builder", "Execution history"],
    tours: [
      {
        id: "automation-overview",
        label: "Automation Tour",
        description: "Create and manage workflow automations",
        icon: <Zap className="h-4 w-4" />,
        steps: [
          { target: "automation-tabs", title: "Automation Tabs", description: "My Automations — view and manage existing automations. Create — build new automations with the workflow builder. History — see execution logs.", route: "/automation",
            demo: <div className="flex gap-1 text-[9px]"><span className="px-2 py-0.5 rounded bg-primary text-primary-foreground">My Automations</span><span className="px-2 py-0.5 rounded bg-muted">Create</span><span className="px-2 py-0.5 rounded bg-muted">History</span></div> },
        ],
      },
    ],
  },
  {
    pageName: "Campaign",
    path: "/campaign",
    icon: <Megaphone className="h-5 w-5" />,
    overview: "Create and manage email campaigns with templates and contacts.",
    features: ["Campaigns", "Calendar", "Contacts", "Lists", "Templates"],
    tours: [
      {
        id: "campaign-overview",
        label: "Campaign Tour",
        description: "Manage email campaigns end-to-end",
        icon: <Megaphone className="h-4 w-4" />,
        steps: [
          { target: "campaign-tabs", title: "Campaign Tabs", description: "Campaigns — create and send emails. Calendar — view scheduled campaigns. Contacts — manage recipients. Lists — organize contact groups. Templates — design reusable email templates.", route: "/campaign",
            demo: <div className="flex flex-wrap gap-1 text-[9px]"><span className="px-2 py-0.5 rounded bg-primary text-primary-foreground">Campaigns</span><span className="px-2 py-0.5 rounded bg-muted">Calendar</span><span className="px-2 py-0.5 rounded bg-muted">Contacts</span><span className="px-2 py-0.5 rounded bg-muted">Lists</span><span className="px-2 py-0.5 rounded bg-muted">Templates</span></div> },
        ],
      },
    ],
  },
  {
    pageName: "Flowmo AI",
    path: "/flowmo",
    icon: <MessageSquare className="h-5 w-5" />,
    overview: "Your AI assistant — manage everything with natural language chat.",
    features: ["Quick actions", "Slash commands", "Session history", "File analysis"],
    tours: [
      {
        id: "flowmo-overview",
        label: "Flowmo AI Tour",
        description: "Learn how to use the AI assistant",
        icon: <MessageSquare className="h-4 w-4" />,
        steps: [
          { target: "flowmo-quick-actions", title: "Quick Actions", description: "One-click prompts to create workspaces, list tasks, view dashboard, and more. Great for getting started.",
            demo: <div className="grid grid-cols-2 gap-1 text-[9px]"><span className="px-1.5 py-1 rounded border text-center">📁 Create workspace</span><span className="px-1.5 py-1 rounded border text-center">📋 Show tasks</span><span className="px-1.5 py-1 rounded border text-center">📊 Dashboard</span><span className="px-1.5 py-1 rounded border text-center">✨ Insights</span></div> },
          { target: "flowmo-new-session", title: "New Chat", description: "Start a fresh conversation. Previous chats are saved in history. Shortcut: ⌘K.",
            demo: <div className="flex items-center gap-1.5 text-[9px]"><span className="px-2 py-0.5 rounded bg-muted">+ New Chat</span><span className="text-muted-foreground">⌘K</span></div> },
          { target: "flowmo-history", title: "Chat History", description: "Browse and switch between past conversations. Each session is saved automatically.",
            demo: <div className="space-y-1 text-[9px]"><div className="rounded border px-2 py-1 bg-indigo-50 dark:bg-indigo-950/20">Create sprint tasks</div><div className="rounded border px-2 py-1">Show dashboard overview</div><div className="rounded border px-2 py-1">List workspace members</div></div> },
          { target: "flowmo-workspace", title: "Workspace Context", description: "Select a workspace to give Flowmo context. Commands like 'list tasks' will target the selected workspace.",
            demo: <div className="flex items-center gap-1.5 text-[9px]"><span className="px-2 py-0.5 rounded border">📁 All workspaces ▾</span></div> },
          { target: "flowmo-input", title: "Chat Input", description: "Type messages, attach images for AI analysis, use / for slash commands. Flowmo can create tasks, manage workspaces, and more.",
            demo: <div className="rounded-md border p-1.5 flex items-center gap-1.5 text-[9px]"><span className="text-muted-foreground">📎</span><span className="flex-1 text-muted-foreground">Type a message or /command...</span><span>➤</span></div> },
        ],
      },
    ],
  },
];

export function getFlowmoTour(): TourItem | undefined {
  return ALL_PAGES.find((p) => p.pageName === "Flowmo AI")?.tours[0];
}

export { SpotlightOverlay };

function getPageForPath(pathname: string): PageTourData | null {
  const exact = ALL_PAGES.find((p) => p.path === pathname);
  if (exact) return exact;
  if (pathname.startsWith("/workspace/project/")) return ALL_PAGES.find((p) => p.path === "/workspace") || null;
  if (pathname.startsWith("/social/profile")) return ALL_PAGES.find((p) => p.path === "/social") || null;
  return null;
}

/* ------------------------------------------------------------------ */
/*  Spotlight overlay (rendered via portal)                            */
/* ------------------------------------------------------------------ */

function SpotlightOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
}: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

  const track = useCallback(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect((prev) => {
        if (!prev || Math.abs(prev.x - r.x) > 1 || Math.abs(prev.y - r.y) > 1 || Math.abs(prev.width - r.width) > 1) return r;
        return prev;
      });
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      setRect(null);
    }
    rafRef.current = requestAnimationFrame(track);
  }, [step.target]);

  useEffect(() => {
    let attempts = 0;
    const poll = setInterval(() => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el || attempts > 30) {
        clearInterval(poll);
        rafRef.current = requestAnimationFrame(track);
      }
      attempts++;
    }, 100);
    return () => { clearInterval(poll); cancelAnimationFrame(rafRef.current); };
  }, [step.target, track]);

  const isLast = stepIndex === totalSteps - 1;
  const isFirst = stepIndex === 0;
  const pad = 8;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && <rect x={rect.x - pad} y={rect.y - pad} width={rect.width + pad * 2} height={rect.height + pad * 2} rx="8" fill="black" />}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#tour-mask)" />
        {rect && <rect x={rect.x - pad} y={rect.y - pad} width={rect.width + pad * 2} height={rect.height + pad * 2} rx="8" fill="none" stroke="rgb(99,102,241)" strokeWidth="2" className="animate-pulse" />}
      </svg>
      <div className="absolute inset-0" onClick={onClose} />
      {rect && (
        <div
          className="absolute z-10 w-72 rounded-md border bg-card shadow-xl p-4"
          style={{
            top: (() => {
              const below = rect.bottom + pad + 12;
              const above = rect.top - pad - 12 - 180;
              if (below + 180 < window.innerHeight) return below;
              if (above > 0) return above;
              return Math.max(12, window.innerHeight / 2 - 90);
            })(),
            left: Math.min(Math.max(rect.x, 12), window.innerWidth - 300),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-indigo-500">Step {stepIndex + 1} of {totalSteps}</span>
            <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">Skip</button>
          </div>
          <h4 className="text-sm font-semibold text-foreground mb-1">{step.title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{step.description}</p>
          <div className="flex justify-center gap-1 mb-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-4 bg-indigo-500" : "w-1.5 bg-border"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {!isFirst && <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={onPrev}>Previous</Button>}
            <Button size="sm" className="flex-1 h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={isLast ? onClose : onNext}>{isLast ? "Finish" : "Next"}</Button>
          </div>
        </div>
      )}
      {!rect && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-80 rounded-md border bg-card shadow-xl p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-indigo-500">Step {stepIndex + 1} of {totalSteps}</span>
            <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">Skip</button>
          </div>
          <h4 className="text-sm font-semibold text-foreground mb-1">{step.title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{step.description}</p>
          {step.demo && (
            <div className="my-3 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 text-xs">
              {step.demo}
            </div>
          )}
          <div className="flex justify-center gap-1 mb-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-4 bg-indigo-500" : "w-1.5 bg-border"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {!isFirst && <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={onPrev}>Previous</Button>}
            <Button size="sm" className="flex-1 h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={isLast ? onClose : onNext}>{isLast ? "Finish" : "Next"}</Button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

type Props = {
  onClose: () => void;
  onSwitchToChat?: () => void;
  isPanelVisible?: boolean;
};

export default function TourGuide({ onClose: _onClose, onSwitchToChat: _onSwitchToChat, isPanelVisible: _isPanelVisible = true }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = authUser?.role === "ADMIN";
  const visiblePages = useMemo(() => ALL_PAGES.filter((p) => p.pageName !== "Campaign" || isAdmin), [isAdmin]);
  const currentPage = getPageForPath(pathname);
  const [activeTour, setActiveTour] = useState<TourItem | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedPage, setSelectedPage] = useState<PageTourData | null>(null);

  // For workspace tour: resolve a workspace ID to navigate to
  const workspaceProjectId = pathname.match(/\/workspace\/project\/(\d+)/)?.[1] || null;
  const wsIdRef = useRef<string | null>(workspaceProjectId);
  if (workspaceProjectId) wsIdRef.current = workspaceProjectId;

  const navToStep = (step: TourStep) => {
    if (step.route) {
      const resolvedRoute = wsIdRef.current ? step.route.replace(":projectId", wsIdRef.current) : step.route;
      navigate({ to: resolvedRoute, search: (step.search || {}) as any, replace: true });
    }
  };

  const startTour = async (tour: TourItem) => {
    // For workspace tour, ensure we have a workspace to navigate to
    if (tour.id === "workspace-full" && !wsIdRef.current) {
      try {
        const { getWorkspacesPaged, getCurrentUserId } = await import("@/lib/backend-api");
        const userId = getCurrentUserId() || undefined;
        const res = await getWorkspacesPaged({ userId, pageSize: 1 });
        if (res.items.length > 0) {
          const wsId = res.items[0].id;
          wsIdRef.current = wsId;
          navigate({ to: `/workspace/project/${wsId}`, search: { tab: "dashboard" } as any });
          // Wait for navigation then start
          setTimeout(() => {
            setActiveTour(tour);
            setStepIndex(0);
            setSelectedPage(null);
          }, 600);
          return;
        }
      } catch { /* ignore */ }
    }

    // For Flowmo tour, navigate then dispatch event
    if (tour.id === "flowmo-overview") {
      navigate({ to: "/flowmo" });
      setTimeout(() => window.dispatchEvent(new Event("simpleflow:start-flowmo-tour")), 800);
      return;
    }

    setActiveTour(tour);
    setStepIndex(0);
    setSelectedPage(null);
    if (tour.steps[0]) navToStep(tour.steps[0]);
  };

  const handleNext = () => {
    if (!activeTour) return;
    const nextIdx = stepIndex + 1;
    if (nextIdx >= activeTour.steps.length) { setActiveTour(null); setStepIndex(0); return; }
    navToStep(activeTour.steps[nextIdx]);
    setStepIndex(nextIdx);
  };

  const handlePrev = () => {
    if (!activeTour || stepIndex === 0) return;
    const prevIdx = stepIndex - 1;
    navToStep(activeTour.steps[prevIdx]);
    setStepIndex(prevIdx);
  };

  return (
    <>
      {activeTour && (
        <SpotlightOverlay
          step={activeTour.steps[stepIndex]}
          stepIndex={stepIndex}
          totalSteps={activeTour.steps.length}
          onNext={handleNext}
          onPrev={handlePrev}
          onClose={() => { setActiveTour(null); setStepIndex(0); }}
        />
      )}

      <ScrollArea className="h-full min-h-0">
        <div className="p-3 space-y-3">
          {/* Back button when viewing a page detail */}
          {selectedPage && (
            <button
              type="button"
              onClick={() => setSelectedPage(null)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-1"
            >
              <ArrowLeft className="h-3 w-3" />
              All Pages
            </button>
          )}

          {/* Page detail view */}
          {selectedPage ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600">
                  {selectedPage.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{selectedPage.pageName}</h3>
                  <p className="text-[11px] text-muted-foreground">{selectedPage.overview}</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Features</p>
                <ul className="space-y-1">
                  {selectedPage.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <span className="mt-1 h-1 w-1 rounded-full bg-indigo-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tours */}
              {selectedPage.tours.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Interactive Tours</p>
                  {selectedPage.tours.map((tour) => (
                    <button
                      key={tour.id}
                      type="button"
                      onClick={() => startTour(tour)}
                      className="flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600">
                        {tour.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground">{tour.label}</p>
                        <p className="text-[10px] text-muted-foreground">{tour.steps.length} steps</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Go to page button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={() => {
                  navigate({ to: selectedPage.path });
                  if (selectedPage.tours.length === 1) {
                    setTimeout(() => startTour(selectedPage.tours[0]), 500);
                  }
                }}
              >
                Go to {selectedPage.pageName}
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            /* Page cards grid */
            <>
              {/* Current page highlight */}
              {currentPage && (
                <div className="mb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 px-0.5">
                    Current Page
                  </p>
                  <Card
                    className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors ring-1 ring-indigo-200 dark:ring-indigo-800"
                    onClick={() => {
                      if (currentPage.tours.length > 0) {
                        startTour(currentPage.tours[0]);
                      } else {
                        setSelectedPage(currentPage);
                      }
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600">
                        {currentPage.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">{currentPage.pageName}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{currentPage.overview}</p>
                      </div>
                      {currentPage.tours.length > 0 ? (
                        <span className="text-[10px] text-indigo-500 font-medium shrink-0">Start tour</span>
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* All pages */}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-0.5">
                All Pages
              </p>
              <div className="space-y-1.5">
                {visiblePages.filter((p) => p !== currentPage).map((page) => (
                  <Card
                    key={page.path}
                    className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                    onClick={() => {
                      if (page.tours.length > 0) {
                        navigate({ to: page.path });
                        setTimeout(() => startTour(page.tours[0]), 500);
                      } else {
                        setSelectedPage(page);
                      }
                    }}
                  >
                    <CardContent className="p-2.5 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        {page.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-foreground">{page.pageName}</p>
                        <p className="text-[9px] text-muted-foreground line-clamp-1">{page.overview}</p>
                      </div>
                      {page.tours.length > 0 ? (
                        <span className="text-[9px] text-indigo-500 font-medium shrink-0">{page.tours[0].steps.length} steps</span>
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
