"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textArea";
import { Link, useParams } from "@tanstack/react-router";
import {
  BookMarked,
  CalendarCheck,
  CalendarSearch,
  CheckCircle,
  Clock,
  Edit,
  Filter,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Calendar } from "../ui/calendar";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  progress: number;
  status: "active" | "completed" | "paused";
  dailyTasks: string[];
}

const mockGoals: Goal[] = [
  {
    id: "1",
    title: "Learn React Development",
    description:
      "Master React fundamentals and build 3 projects to become job-ready",
    category: "Career",
    targetDate: "2024-06-30",
    progress: 75,
    status: "active",
    dailyTasks: [
      "Complete 1 React tutorial chapter",
      "Practice coding for 2 hours",
      "Review previous concepts",
    ],
  },
  {
    id: "2",
    title: "Morning Exercise Routine",
    description:
      "Establish a consistent 30-minute morning workout routine for better health",
    category: "Health",
    targetDate: "2024-04-15",
    progress: 60,
    status: "active",
    dailyTasks: [
      "30-minute workout",
      "Drink 2 glasses of water",
      "Stretch for 10 minutes",
    ],
  },
  {
    id: "3",
    title: "Save $5000 Emergency Fund",
    description: "Build an emergency fund by saving $500 per month",
    category: "Finance",
    targetDate: "2024-12-31",
    progress: 40,
    status: "active",
    dailyTasks: ["Track daily expenses", "Save $16.67 daily", "Review budget"],
  },
];

const WorkspaceContainer = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const params = useParams({ strict: false });
  const projectId = params.projectId as string | undefined;
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "",
    targetDate: "",
    dailyTasks: [""],
    otherCategory: "",
  });

  useEffect(() => {
    console.log("Selected projectId:", params);
  }, [projectId]);

  const addDailyTask = () => {
    setNewGoal((prev) => ({
      ...prev,
      dailyTasks: [...prev.dailyTasks, ""],
    }));
  };

  const updateDailyTask = (index: number, value: string) => {
    setNewGoal((prev) => ({
      ...prev,
      dailyTasks: prev.dailyTasks.map((task, i) =>
        i === index ? value : task,
      ),
    }));
  };

  const removeDailyTask = (index: number) => {
    setNewGoal((prev) => ({
      ...prev,
      dailyTasks: prev.dailyTasks.filter((_, i) => i !== index),
    }));
  };

  const createGoal = () => {
    const goal: Goal = {
      id: Date.now().toString(),
      ...newGoal,
      progress: 0,
      status: "active",
      dailyTasks: newGoal.dailyTasks.filter((task) => task.trim() !== ""),
    };
    setGoals((prev) => [...prev, goal]);

    console.log(goal);
    setNewGoal({
      title: "",
      description: "",
      category: "",
      targetDate: "",
      dailyTasks: [""],
      otherCategory: "",
    });
    setIsCreateDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary text-primary-foreground";
      case "completed":
        return "bg-green-500 text-white";
      case "paused":
        return "bg-yellow-500 text-white";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Career":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Health":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Finance":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Personal":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-balance">Workspace</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Set and track your goals with daily routine recommendations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-7 bg-blue-500 cursor-pointer hover:bg-blue-600 text-white">
              <Plus className="h-4 w-4" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set up a new goal with daily tasks to help you achieve it
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Learn Python Programming"
                  value={newGoal.title}
                  onChange={(e) =>
                    setNewGoal((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your goal and what success looks like..."
                  value={newGoal.description}
                  onChange={(e) =>
                    setNewGoal((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newGoal.category}
                    onValueChange={(value) =>
                      setNewGoal((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Career">Career</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newGoal.category === "Others" && (
                  <div className="space-y-2">
                    <Label htmlFor="otherCategory">
                      Please specify category
                    </Label>
                    <Input
                      placeholder="e.g. Marketing"
                      id="otherCategory"
                      value={newGoal.otherCategory}
                      onChange={(e) =>
                        setNewGoal((prev) => ({
                          ...prev,
                          otherCategory: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) =>
                      setNewGoal((prev) => ({
                        ...prev,
                        targetDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Daily Tasks</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDailyTask}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                </div>

                <div className="space-y-2">
                  {newGoal.dailyTasks.map((task, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Daily task ${index + 1}`}
                        value={task}
                        onChange={(e) => updateDailyTask(index, e.target.value)}
                      />
                      {newGoal.dailyTasks.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDailyTask(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={createGoal}
                  className="flex-1 bg-linear-to-r from-blue-500 to-blue-500 cursor-pointer hover:from-blue-500 hover:to-purple-500 text-white hover:scale-y-102 hover:scale-x-101 transition-all duration-300"
                >
                  Create Goal
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
      <hr className="mb-2 border-gray-200" />
      <div className="flex flex-row gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Status
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuCheckboxItem checked>
              In Progress
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem>Completed</DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem>Overdue</DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem>Clear Filters</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <BookMarked className="h-4 w-4 mr-2" />
              Priority
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuCheckboxItem checked>Low</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Normal</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>High</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Clear Filters</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <CalendarSearch className="h-4 w-4 mr-2" />
              Date
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-full">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              captionLayout="dropdown"
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <hr className="mt-2 mb-3 border-gray-200" />
      {/* Goals Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <Link
            to="/workspace/project/$projectId"
            params={{ projectId: goal.id }}
          >
            <Card
              onClick={() => {}}
              key={goal.id}
              className="flex flex-col h-full m-0 p-0 rounded-lg
            border border-transparent
            bg-origin-border
            bg-clip-padding
            hover:bg-linear-to-r
            hover:from-blue-500
            hover:to-purple-500 hover:transform hover:cursor-pointer hover:scale-105 hover:shadow-lg transition-all"
            >
              <div className="m-px rounded-md py-10 flex flex-col flex-1 bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg leading-tight">
                        {goal.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getCategoryColor(goal.category)}
                        >
                          {goal.category}
                        </Badge>
                        <Badge className={getStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <CardDescription className="text-sm">
                    {goal.description}
                  </CardDescription>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <Progress
                      value={goal.progress}
                      className="h-2 [&>div]:bg-indigo-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarCheck className="h-4 w-4" />
                    <span>
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Daily Tasks
                    </h4>
                    <div className="space-y-1">
                      {goal.dailyTasks.slice(0, 3).map((task, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{task}</span>
                        </div>
                      ))}
                      {goal.dailyTasks.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{goal.dailyTasks.length - 3} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {goals.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first goal to start tracking your progress
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkspaceContainer;
