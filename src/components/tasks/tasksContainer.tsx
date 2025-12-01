"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textArea";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Filter,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  description: string;
  goalId?: string;
  goalTitle?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  dueDate: string;
  dueTime: string;
  prerequisites: string[];
  estimatedDuration: number; // in minutes
  category: string;
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Complete React tutorial chapter 3",
    description: "Learn about React hooks and state management",
    goalId: "1",
    goalTitle: "Learn React Development",
    priority: "high",
    status: "in-progress",
    dueDate: "2024-03-25",
    dueTime: "14:00",
    prerequisites: ["Complete chapter 2", "Setup development environment"],
    estimatedDuration: 120,
    category: "Learning",
  },
  {
    id: "2",
    title: "30-minute morning workout",
    description:
      "Full body workout routine including cardio and strength training",
    goalId: "2",
    goalTitle: "Morning Exercise Routine",
    priority: "high",
    status: "pending",
    dueDate: "2024-03-25",
    dueTime: "07:00",
    prerequisites: ["Prepare workout clothes", "Set alarm"],
    estimatedDuration: 30,
    category: "Health",
  },
  {
    id: "3",
    title: "Review monthly expenses",
    description: "Analyze spending patterns and identify areas for improvement",
    goalId: "3",
    goalTitle: "Save $5000 Emergency Fund",
    priority: "medium",
    status: "pending",
    dueDate: "2024-03-25",
    dueTime: "20:00",
    prerequisites: ["Gather receipts", "Update expense tracker"],
    estimatedDuration: 45,
    category: "Finance",
  },
  {
    id: "4",
    title: "Practice JavaScript algorithms",
    description: "Solve 3 coding problems on LeetCode",
    goalId: "1",
    goalTitle: "Learn React Development",
    priority: "medium",
    status: "completed",
    dueDate: "2024-03-24",
    dueTime: "16:00",
    prerequisites: ["Review data structures"],
    estimatedDuration: 90,
    category: "Learning",
  },
];

const TasksContainer = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    goalId: "",
    priority: "medium" as const,
    dueDate: "",
    dueTime: "",
    prerequisites: [""],
    estimatedDuration: 60,
    category: "",
  });

  const addPrerequisite = () => {
    setNewTask((prev) => ({
      ...prev,
      prerequisites: [...prev.prerequisites, ""],
    }));
  };

  const updatePrerequisite = (index: number, value: string) => {
    setNewTask((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites.map((req, i) =>
        i === index ? value : req
      ),
    }));
  };

  const removePrerequisite = (index: number) => {
    setNewTask((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index),
    }));
  };

  const createTask = () => {
    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      status: "pending",
      prerequisites: newTask.prerequisites.filter((req) => req.trim() !== ""),
      goalTitle: newTask.goalId ? "Associated Goal" : undefined,
    };
    setTasks((prev) => [...prev, task]);
    setNewTask({
      title: "",
      description: "",
      goalId: "",
      priority: "medium",
      dueDate: "",
      dueTime: "",
      prerequisites: [""],
      estimatedDuration: 60,
      category: "",
    });
    setIsCreateDialogOpen(false);
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "completed" ? "pending" : "completed",
            }
          : task
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "in-progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "pending":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const filterTasksByTab = (tab: string) => {
    const today = new Date().toISOString().split("T")[0];
    switch (tab) {
      case "today":
        return tasks.filter((task) => task.dueDate === today);
      case "upcoming":
        return tasks.filter((task) => task.dueDate > today);
      case "completed":
        return tasks.filter((task) => task.status === "completed");
      case "all":
      default:
        return tasks;
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-balance">Tasks</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Schedule and manage your daily tasks with prerequisites and time
            tracking
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Schedule a new task with prerequisites and time estimates
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* ... existing form content ... */}
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Complete project proposal"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what needs to be done..."
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={createTask} className="flex-1">
                    Create Task
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Task Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filterTasksByTab(activeTab).map((task) => (
            <Card
              key={task.id}
              className={`transition-all ${
                task.status === "completed" ? "opacity-75" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={() => toggleTaskStatus(task.id)}
                    className="mt-1"
                  />

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3
                          className={`font-medium ${
                            task.status === "completed"
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {task.title}
                        </h3>
                        {task.goalTitle && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Target className="h-3 w-3" />
                            <span>{task.goalTitle}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getPriorityColor(task.priority)}
                        >
                          {task.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getStatusColor(task.status)}
                        >
                          {task.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {task.dueTime} ({task.estimatedDuration}min)
                        </span>
                      </div>
                      <Badge variant="secondary">{task.category}</Badge>
                    </div>

                    {task.prerequisites.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Prerequisites
                        </h4>
                        <div className="space-y-1">
                          {task.prerequisites.map((prerequisite, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <CheckCircle className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {prerequisite}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filterTasksByTab(activeTab).length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "today"
                    ? "You don't have any tasks scheduled for today"
                    : activeTab === "completed"
                    ? "No completed tasks yet"
                    : "Create your first task to get started"}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksContainer;
