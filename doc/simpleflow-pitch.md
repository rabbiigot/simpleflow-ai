# SimpleFlow - Product Pitch

## The Problem

Today, teams juggle between five, six, sometimes ten different tools — one for tasks, another for chat, another for time tracking, another for social updates, and yet another for analytics. Every switch between tools is lost context, lost time, and lost focus. And none of these tools actually talk to each other intelligently.

## The Solution: SimpleFlow

SimpleFlow is built on one simple idea — everything your team needs to work should live in one place, and it should be smart enough to work for you.

---

## Core Features

### Workspaces and Tasks

At the core, you have fully customizable workspaces with Kanban boards, custom columns, custom fields, labels, assignees, file attachments, and comments. You can create a workspace from scratch, spin one up from a template, or just tell our AI to do it.

- Kanban board with drag-and-drop task management
- Custom columns and statuses per workspace
- Custom fields (text, number, date, select, dropdown)
- Task assignees, comments, and file attachments (S3 storage)
- Bulk task creation
- Workspace templates (CRM high-level, CRM detailed)
- Member management with role-based access (Admin, Member)

### Flowmo - AI Assistant

Flowmo is our built-in AI assistant that understands natural language. You can say "create a workspace called Q1 Sprint with tasks: fix login bug, update docs, deploy v2" and it just does it. No clicking through menus. No forms.

- 70+ AI-powered actions across all platform features
- Natural language understanding for messy, casual inputs
- Image analysis to auto-generate tasks from screenshots, wireframes, and photos
- Multi-turn conversations with session persistence
- Workspace-aware context — knows which workspace you're working in
- Confirmation workflows for sensitive actions (execute/cancel)
- Slash command menu for quick access to all actions
- AI-powered analytics summaries on demand

### Real-Time Chat and Social

SimpleFlow has built-in chat channels with threads, reactions, and file sharing. But we go further with a social feed — posts, comments, reactions, and private networks.

- Chat channels with roles, threads, and media sharing
- Social feed with posts, comments, and 7 reaction types
- Private networks for teams and groups
- Share posts to channels
- Channel invites with status tracking
- Real-time message delivery via WebSockets

### Time Tracking and HR

Clock in, clock out, request leave, track overtime — all built in. Managers can approve leave requests, and the system tracks hours automatically. Time data feeds directly into analytics.

- Clock in/out with shift tracking
- Overtime recording with approval workflow
- Leave requests (sick, vacation, other) with status management
- Holiday calendar
- Expected clock-out and shift duration tracking

### Automations

Think Zapier, but native. Set up triggers and actions and let the system handle the rest. No code required.

**Triggers:**
- Task completed
- Task moved
- Task created
- Post created
- Clock in
- Clock out

**Actions:**
- Send email
- Create post
- Create task
- Move task

**Features:**
- Create, list, update, delete automations
- Test automations with dry-run mode
- Toggle active/inactive
- Execution logs with duration and error tracking

### Analytics and Insights

Real-time dashboards show your completion rates, productivity trends, time allocation, and weekly reports.

- Overview metrics: active goals, tasks completed, success rate, monthly hours
- Productivity trend charts (daily, weekly)
- Task status breakdown by column
- Time allocation across workspaces
- Weekly report generation
- Workspace-specific filtering
- AI-powered analytics summaries via Flowmo
- PDF and CSV export with preview

---

## Technical Capabilities

### AI Orchestration Engine

- Dual LLM support with fallback (OpenAI + Anthropic Claude)
- Automatic tool calling with 70+ registered tools
- Confirmation workflows for destructive operations
- Session-based chat with persistent message history
- Dry-run mode for testing actions
- Batch execution with stop-on-error support
- Heuristic fallback when LLM fails

### RAG (Retrieval-Augmented Generation)

- Vector embeddings via OpenAI text-embedding-3-small (1536 dimensions)
- Semantic search across all platform data
- Document sources: workspaces, tasks, custom fields, posts, comments, shifts, overtime, leave requests
- Async embedding job queue with retry logic
- Workspace-scoped context retrieval

### Real-Time Communication

- WebSocket gateways for chat and AI event streaming
- Socket.io integration for real-time message delivery
- AI event streaming: planning, thinking, executing status updates
- Frontend cache invalidation events

### Data and Storage

- PostgreSQL with pgvector extension for embeddings
- S3-compatible file storage for attachments and media
- Prisma ORM with 18+ data models
- JSON-based flexible custom fields and metadata

### Authentication and Security

- JWT-based token authentication
- Email verification with token flow
- Password hashing
- Refresh tokens
- User roles and workspace-level permissions
- Unique workspace name enforcement

---

## What Makes SimpleFlow Different

1. **AI-Native** — Flowmo isn't a bolt-on chatbot. It's deeply integrated with every feature. It understands your workspaces, your tasks, your team, and your history through semantic search powered by RAG.

2. **Truly Unified** — Tasks, chat, social, time tracking, automations, and analytics — all in one platform, all sharing context. When you complete a task, your dashboard updates, your automation fires, and your team sees the progress in real time.

3. **Built for How People Actually Work** — Messy messages, casual commands, quick inputs — Flowmo handles all of it. You don't need to learn syntax. You just talk.

---

## The Vision

We believe the future of work isn't about more tools — it's about smarter ones. SimpleFlow is where your team plans, communicates, tracks, automates, and grows — all powered by AI that gets better the more you use it.

---

## Pitch Script

> Good [morning/afternoon], everyone.
>
> Let me introduce you to SimpleFlow — a unified workspace platform that brings project management, team collaboration, and AI-powered productivity into one seamless experience.
>
> Today, teams juggle between five, six, sometimes ten different tools — one for tasks, another for chat, another for time tracking, another for social updates, and yet another for analytics. Every switch between tools is lost context, lost time, and lost focus. And none of these tools actually talk to each other intelligently.
>
> SimpleFlow is built on one simple idea — everything your team needs to work should live in one place, and it should be smart enough to work for you.
>
> At the core, you have fully customizable workspaces with Kanban boards, custom columns, custom fields, labels, assignees, file attachments, and comments. You can create a workspace from scratch, spin one up from a template, or — and this is where it gets interesting — just tell our AI to do it.
>
> Meet Flowmo — our built-in AI assistant that understands natural language. You can say "create a workspace called Q1 Sprint with tasks: fix login bug, update docs, deploy v2" — and it just does it. No clicking through menus. No forms. You can move tasks, assign people, complete work, pull up analytics — all through a conversation. Flowmo supports over 70 actions, image-based task generation, multi-turn conversations, and workspace-aware context. It even asks for confirmation before taking sensitive actions.
>
> SimpleFlow has built-in chat channels with threads, reactions, and file sharing. But we go further with a social feed — posts, comments, reactions, and private networks. Your team can share updates, celebrate wins, and stay connected without leaving the platform.
>
> Clock in, clock out, request leave, track overtime — all built in. Managers can approve leave requests, and the system tracks hours automatically. Your team's time data feeds directly into analytics.
>
> Think Zapier, but native. When a task is completed, automatically post an update to a channel. When someone clocks in, create a daily task. Set up triggers and actions and let the system handle the rest. No code required.
>
> Real-time dashboards show your completion rates, productivity trends, time allocation across workspaces, and weekly reports. Filter by workspace, filter by time period, and ask Flowmo "how is my sprint doing?" — and it generates a structured summary on the spot. You can preview and export reports as real PDFs or CSVs.
>
> What makes SimpleFlow different? One — it's AI-native. Flowmo isn't a bolt-on chatbot. It's deeply integrated with every feature through semantic search powered by RAG. Two — it's truly unified. Tasks, chat, social, time tracking, automations, and analytics — all sharing context, all updating in real time through WebSockets. Three — it's built for how people actually work. Messy messages, casual commands, quick inputs — Flowmo handles all of it.
>
> We believe the future of work isn't about more tools — it's about smarter ones. SimpleFlow is where your team plans, communicates, tracks, automates, and grows — all powered by AI that gets better the more you use it.
>
> We'd love to show you a live demo. Thank you.
