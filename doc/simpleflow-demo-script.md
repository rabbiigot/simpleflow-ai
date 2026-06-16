# Simpleflow-AI Demo Script

**Duration:** ~5 minutes
**Audience:** Stakeholders / potential users
**Prerequisite:** App running locally (`npm run dev`), logged-in user with sample data

---

## 1. Dashboard Overview (~30s)

**[Open the Dashboard page]**

> "So this is Simpleflow — an AI-powered productivity platform that brings together task management, team collaboration, and intelligent automation all in one place."

**[Point to the summary cards at the top]**

> "Right when you log in, you get a full overview of your work — your total tasks, goals progress, success rate, and hours tracked. Everything at a glance."

**[Point to the AI insight card]**

> "And this here is an AI-generated insight. Simpleflow analyzes your activity and surfaces recommendations — like telling you which tasks are overdue or where your team is bottlenecked."

**[Scroll to the productivity trend chart]**

> "Down here we have a 30-day productivity trend. You can see your task completion rate over time, so you always know if your team is on track or falling behind."

---

## 2. Workspace & Task Management (~1 min)

**[Navigate to Workspaces, click on an existing workspace like "Q4 Planning"]**

> "Now let's look at how we organize actual work. Everything lives inside workspaces. Think of a workspace as a project board for your team."

**[Show the Kanban board with columns]**

> "Each workspace has a Kanban board with customizable columns — To Do, In Progress, Done, or whatever stages make sense for your workflow."

**[Drag a task from one column to another]**

> "Moving tasks is as simple as drag and drop. When I move this task to 'In Progress,' the status updates in real time for everyone on the team."

**[Click into a task card to open the detail view]**

> "Inside each task, you've got everything you need — a description, assignees, custom fields, comments for discussion, and file attachments. It's all in one place so nobody has to switch between tools."

**[Scroll to show the GitHub section if visible]**

> "And if your workspace is linked to a GitHub repo, pull requests and commits show up right here on the task. Your code and your project board stay in sync."

---

## 3. Flowmo — The AI Assistant (~1.5 min)

**[Open the Flowmo chat panel]**

> "Now this is where it gets really interesting. Meet Flowmo — our built-in AI assistant. Instead of clicking through menus, you can just tell it what you want in plain English."

**[Type: "Create a workspace called Product Launch with columns: Backlog, Design, Dev, QA, Done"]**

> "Let me show you. I'll ask Flowmo to create an entire workspace for me — 'Create a workspace called Product Launch with columns: Backlog, Design, Dev, QA, Done.'"

**[Wait for the confirmation dialog to appear]**

> "Notice it doesn't just execute blindly. Flowmo shows you exactly what it's about to do and asks for confirmation. You're always in control."

**[Click Approve/Confirm]**

> "I'll confirm — and just like that, the workspace is created with all five columns ready to go."

**[Type: "Add a task 'Design landing page' to the Backlog column"]**

> "Now I'll add a task — 'Add a task called Design landing page to the Backlog column.' And there it is, created instantly through natural language."

**[Type "/" to show the slash command menu]**

> "Flowmo also supports slash commands for quick access — tasks, automations, calendar, GitHub, social posts — you can control almost every feature from this chat."

**[Click on session history]**

> "All your conversations with Flowmo are saved. You can go back to any previous session, pick up where you left off, or review what actions were taken."

**[Optional: drag an image or document into the chat]**

> "You can even upload images or documents — Flowmo will analyze them and extract information for you."

---

## 4. Automation Builder (~45s)

**[Navigate to the Automations page]**

> "Next up — automations. This is how you eliminate repetitive work. Instead of manually doing the same thing every time, you set up a rule once and let Simpleflow handle it."

**[Open an existing automation or click Create]**

> "Let me show you how simple it is. We pick a trigger — say, 'When a task moves to Done.' Then we add a condition — 'Only if the priority is HIGH.' And finally, the action — 'Send an email notification.'"

**[Point to the trigger, condition, and action sections]**

> "Trigger, condition, action — that's all there is to it. No code required."

**[Toggle the automation on]**

> "I'll flip it on — and now it's live. Every time a high-priority task gets completed, the team gets notified automatically."

**[Click Test]**

> "You can also test it with one click to make sure everything works before it goes live."

**[Open the automation logs]**

> "And all executions are logged here, so you have a full audit trail of what ran and when."

---

## 5. Real-Time Chat & Social Feed (~45s)

**[Navigate to Chat, open a channel]**

> "Simpleflow also has built-in real-time chat so your team doesn't need a separate messaging tool."

**[Type and send a message]**

> "Messages show up instantly — no refresh needed. Everything runs on WebSockets so it's truly real-time."

**[Click on a reaction icon, show a threaded reply]**

> "You've got emoji reactions, threaded replies, and media attachments — all the essentials for team communication."

**[Switch to the Social Feed page]**

> "And then we have the Social Feed — think of it as your team's internal timeline. People can share updates, celebrate wins, and stay connected."

**[Show a post with reactions and comments]**

> "Posts support reactions — Like, Love, Celebrate — plus comments and replies. It keeps the team culture alive, especially for remote teams."

**[Create a quick post: "Shipped the new automation feature!" and add a Celebrate reaction]**

> "Let me drop a quick update — 'Shipped the new automation feature!' — and give it a Celebrate. The whole team sees it right away."

---

## 6. Integrations (~30s)

**[Navigate to the Integrations or Settings page, show GitHub panel]**

> "Finally, Simpleflow connects with tools your team already uses. Here's our GitHub integration — you can link repositories, track pull requests, and see commit activity without leaving the platform."

**[Show Google Calendar section]**

> "Same with Google Calendar — your schedule syncs directly into Simpleflow. You can see today's meetings and upcoming events right from the dashboard."

**[Point back toward the Flowmo chat]**

> "And the best part — these integrations feed into Flowmo too. You can ask the AI things like 'What PRs are open?' or 'What's on my calendar today?' and get answers instantly."

---

## Closing (~15s)

> "So that's Simpleflow — workspace management, AI-driven task creation, workflow automation, real-time collaboration, and integrations — all in one platform. And everything you saw the AI do can also be done through the UI, giving teams the flexibility to work however they prefer. Thanks for watching."

---

## Tips for the Demo

- Keep Flowmo interactions short and impressive — the AI confirmation flow is the "wow" moment
- Have sample data pre-loaded so screens aren't empty
- If anything takes time to load, narrate while waiting ("Under the hood, this is streaming via WebSocket...")
- Speak naturally — the quotes above are guides, not scripts to memorize word-for-word
- Pause briefly after each Flowmo action so the audience can absorb what just happened
