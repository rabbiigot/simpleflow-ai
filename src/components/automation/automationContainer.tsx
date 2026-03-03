"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit2,
  Play,
  Plus,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  frequency: string;
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
}

const mockAutomations: Automation[] = [
  {
    id: "1",
    name: "Daily Morning Standup",
    trigger: "Time-based",
    action: "Create daily tasks at 6:00 AM",
    frequency: "Every day",
    isActive: true,
    lastRun: "Today at 6:00 AM",
    nextRun: "Tomorrow at 6:00 AM",
  },
  {
    id: "2",
    name: "Weekly Progress Report",
    trigger: "Schedule-based",
    action: "Generate weekly analytics report",
    frequency: "Every Monday",
    isActive: true,
    lastRun: "Mon at 9:00 AM",
    nextRun: "Next Monday at 9:00 AM",
  },
  {
    id: "3",
    name: "Expense Reminder",
    trigger: "Event-based",
    action: "Send expense tracking reminder",
    frequency: "Every Friday",
    isActive: false,
    lastRun: "Fri, Nov 1 at 5:00 PM",
    nextRun: "Disabled",
  },
];

const mockTriggers = [
  { id: "time", label: "Time-based", description: "Execute at specific times" },
  {
    id: "event",
    label: "Event-based",
    description: "Execute when an event occurs",
  },
  {
    id: "schedule",
    label: "Schedule-based",
    description: "Execute on recurring dates",
  },
  {
    id: "goal",
    label: "Goal-based",
    description: "Execute based on goal progress",
  },
];

const mockActions = [
  "Create daily tasks",
  "Send notification reminder",
  "Generate report",
  "Update task status",
  "Log financial transaction",
  "Calculate metrics",
  "Archive completed items",
];

const mockFrequencies = [
  "Every day",
  "Every weekday",
  "Every weekend",
  "Every week",
  "Every Monday",
  "Every Tuesday",
  "Every Wednesday",
  "Every Thursday",
  "Every Friday",
  "Every month",
  "Custom",
];

export default function AutomationContainer() {
  const [automations, setAutomations] = useState<Automation[]>(mockAutomations);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    trigger: "",
    action: "",
    frequency: "",
  });

  const handleCreateAutomation = () => {
    if (
      formData.name &&
      formData.trigger &&
      formData.action &&
      formData.frequency
    ) {
      const newAutomation: Automation = {
        id: String(automations.length + 1),
        name: formData.name,
        trigger: formData.trigger,
        action: formData.action,
        frequency: formData.frequency,
        isActive: true,
        lastRun: "Just now",
        nextRun: "In 24 hours",
      };
      setAutomations([...automations, newAutomation]);
      setFormData({ name: "", trigger: "", action: "", frequency: "" });
      setIsCreateDialogOpen(false);
    }
  };

  const handleToggleAutomation = (id: string) => {
    setAutomations(
      automations.map((automation) =>
        automation.id === id
          ? { ...automation, isActive: !automation.isActive }
          : automation,
      ),
    );
  };

  const handleDeleteAutomation = (id: string) => {
    setAutomations(automations.filter((automation) => automation.id !== id));
  };

  const activeCount = automations.filter((a) => a.isActive).length;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Automations</h1>
        </div>
        <p className="text-muted-foreground text-pretty">
          Automate your daily routines and tasks to save time and stay
          consistent with your goals.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 mb-8 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Automations
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {automations.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeCount} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Automations
            </CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Running smoothly</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">12h</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Automations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Active Automations Tab */}
        <TabsContent value="active" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Automations</h2>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Automation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Automation</DialogTitle>
                  <DialogDescription>
                    Set up a new automation to streamline your workflow.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="automation-name">Automation Name</Label>
                    <Input
                      id="automation-name"
                      placeholder="e.g., Daily Morning Tasks"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trigger">Trigger Type</Label>
                    <Select
                      value={formData.trigger}
                      onValueChange={(value) =>
                        setFormData({ ...formData, trigger: value })
                      }
                    >
                      <SelectTrigger id="trigger">
                        <SelectValue placeholder="Select trigger type" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTriggers.map((trigger) => (
                          <SelectItem key={trigger.id} value={trigger.label}>
                            {trigger.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="action">Action</Label>
                    <Select
                      value={formData.action}
                      onValueChange={(value) =>
                        setFormData({ ...formData, action: value })
                      }
                    >
                      <SelectTrigger id="action">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockActions.map((action) => (
                          <SelectItem key={action} value={action}>
                            {action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, frequency: value })
                      }
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockFrequencies.map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {freq}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleCreateAutomation} className="w-full">
                    Create Automation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {automations.length === 0 ? (
            <Card className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                No automations yet. Create one to get started!
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {automations.map((automation) => (
                <Card
                  key={automation.id}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            {automation.name}
                          </h3>
                          <Badge
                            variant={
                              automation.isActive ? "default" : "secondary"
                            }
                          >
                            {automation.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Trigger:</span>{" "}
                          {automation.trigger}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Action:</span>{" "}
                          {automation.action}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Frequency:</span>{" "}
                          {automation.frequency}
                        </p>
                        <div className="flex flex-col gap-1 pt-2 text-xs text-muted-foreground">
                          {automation.lastRun && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3" />
                              Last run: {automation.lastRun}
                            </div>
                          )}
                          {automation.nextRun && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              Next run: {automation.nextRun}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Switch
                          checked={automation.isActive}
                          onCheckedChange={() =>
                            handleToggleAutomation(automation.id)
                          }
                          className="h-6 w-11"
                        />
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAutomation(automation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <h2 className="text-xl font-semibold">Automation Templates</h2>
          <p className="text-muted-foreground mb-4">
            Choose from pre-built templates to quickly set up common
            automations.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                name: "Daily Standup",
                description: "Create daily tasks every morning",
                icon: Clock,
              },
              {
                name: "Weekly Review",
                description: "Generate progress report every week",
                icon: TrendingUp,
              },
              {
                name: "Expense Tracker",
                description: "Remind to log expenses on Fridays",
                icon: AlertCircle,
              },
              {
                name: "Goal Progress",
                description: "Update goal metrics automatically",
                icon: CheckCircle,
              },
            ].map((template) => {
              const IconComponent = template.icon;
              return (
                <Card
                  key={template.name}
                  className="hover:border-primary/50 cursor-pointer transition-colors"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <Button
                          size="sm"
                          className="mt-3 bg-transparent"
                          variant="outline"
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <h2 className="text-xl font-semibold">Automation History</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  {
                    action: "Daily Morning Standup executed successfully",
                    time: "Today at 6:00 AM",
                    status: "success",
                  },
                  {
                    action: "Weekly Progress Report generated",
                    time: "Mon at 9:00 AM",
                    status: "success",
                  },
                  {
                    action: "Expense Reminder skipped (automation disabled)",
                    time: "Last Friday at 5:00 PM",
                    status: "warning",
                  },
                  {
                    action: "Goal Progress update completed",
                    time: "Nov 4 at 11:30 AM",
                    status: "success",
                  },
                ].map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 pb-4 border-b last:border-b-0"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        entry.status === "success"
                          ? "bg-green-500/10"
                          : "bg-yellow-500/10"
                      }`}
                    >
                      {entry.status === "success" ? (
                        <CheckCircle
                          className={`h-5 w-5 ${
                            entry.status === "success"
                              ? "text-green-500"
                              : "text-yellow-500"
                          }`}
                        />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
