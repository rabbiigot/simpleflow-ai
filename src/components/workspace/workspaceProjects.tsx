"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useParams } from "@tanstack/react-router";
import {
  BookMarked,
  CalendarClock,
  CalendarPlus,
  CalendarSearch,
  Ellipsis,
  Expand,
  Filter,
  PaintBucket,
  Pen,
  SquareKanban,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Calendar } from "../ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/* =====================
   Types
===================== */
type Task = {
  id: string;
  title: string;
  description: string;
  date_created?: string;
  date_due?: string;
};

type TasksByColumn = Record<string, Task[]>;

/* =====================
   Columns
===================== */
const COLUMNS = ["Not Yet Started", "In Progress", "Completed", "Archived"];

/* =====================
   Task Card (Shared)
===================== */
function TaskCard({
  task,
  dragging = false,
}: {
  task: Task;
  dragging?: boolean;
}) {
  return (
    <Card
      className={`p-2 rounded-sm bg-white ${
        dragging ? "ring-1 ring-blue-500" : ""
      }`}
    >
      <div className="flex-1 flex flex-col justify-between gap-2">
        <div className="text-sm truncate justify-between w-full flex items-center">
          {task.title}
          <span className="cursor-pointer hover:bg-gray-100 transition-all rounded-sm p-1">
            <Expand className="h-4 w-4" />
          </span>
        </div>
        <div className="text-xs text-muted-foreground  bg-blue-50 p-2 rounded-sm w-full">
          <p>
            Description:{" "}
            {task.description.length > 70
              ? task.description.slice(0, 70) + "..."
              : task.description}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          {task.date_created && (
            <span className="text-xs text-muted-foreground flex">
              <CalendarPlus className="h-4 w-4 mr-1" />
              <p>Created: {new Date(task.date_created).toLocaleDateString()}</p>
            </span>
          )}
          {task.date_due && (
            <span className="text-xs text-muted-foreground flex">
              <CalendarClock className="h-4 w-4 mr-1" />
              <p>Due: {new Date(task.date_due).toLocaleDateString()}</p>
            </span>
          )}
        </div>
        <hr />
        <div className="flex justify-end gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Filter className="h-4 w-4 mr-2" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuCheckboxItem checked>
                Not Yet Started
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>In Progress</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Completed</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Archived</DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Clear Filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" className="p-0 m-0 cursor-pointer">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* =====================
   Sortable Task
===================== */
function SortableTask({ task }: { task: Task }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <TaskCard task={task} />
    </div>
  );
}

/* =====================
   Droppable Column
===================== */
function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`w-full rounded-md h-full py-2 px-3 overflow-auto transition-colors ${
        isOver ? "border-2 mt-2 border-blue-500 bg-blue-50" : ""
      }`}
      data-column={id}
    >
      {children}
    </div>
  );
}

/* =====================
   Main Kanban
===================== */
export default function WorkspaceKanban() {
  const params = useParams({ strict: false });
  let projectId = params.projectId;
  const [projectInfo, setProjectInfo] = useState<any>(null);
  // const [projectId, setProjectId] = useState<string | null>(null);
  useEffect(() => {
    console.log("Current Params:", params);
    projectId = params.projectId;
    console.log("Project ID:", projectId);
    // setProjectId(params.projectId || null);
  }, [params]);

  const [tasksByColumn, setTasksByColumn] = useState<TasksByColumn>({
    "Not Yet Started": [
      {
        id: "1",
        title: "Complete React tutorial",
        description:
          "Learn the basics of React including components, state, and props.",
        date_created: "2024-06-01",
        date_due: "2024-06-10",
      },
      {
        id: "2",
        title: "Complete React tutorial",
        description:
          "Learn the basics of React including components, state, and props.",
        date_created: "2024-06-01",
        date_due: "2024-06-10",
      },
      {
        id: "3",
        title: "Practice hooks",
        description:
          "Get comfortable with useState, useEffect, and custom hooks.",
        date_created: "2024-06-05",
        date_due: "2024-06-15",
      },
    ],
    "In Progress": [
      {
        id: "4",
        title: "Build Kanban board",
        description:
          "Create a drag-and-drop Kanban board using React and dnd-kit.",
        date_created: "2024-06-03",
        date_due: "2024-06-12",
      },
    ],
    Completed: [],
    Archived: [],
  });

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  /* ---------- Drag Start ---------- */
  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;

    for (const col of COLUMNS) {
      const task = tasksByColumn[col].find((t) => t.id === id);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  };
  const lastDropColumnRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastDropColumnRef.current) return;

    requestAnimationFrame(() => {
      const container = document.querySelector(
        `[data-column="${lastDropColumnRef.current}"]`,
      ) as HTMLElement | null;

      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }

      lastDropColumnRef.current = null;
    });
  }, [tasksByColumn]);

  /* ---------- Drag End ---------- */
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    console.log("Drag End Event:", { active, over });
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setTasksByColumn((prev) => {
      let sourceCol: string | null = null;
      let task: Task | null = null;

      for (const col of COLUMNS) {
        const found = prev[col].find((t) => t.id === activeId);
        if (found) {
          sourceCol = col;
          task = found;
          break;
        }
      }

      if (!sourceCol || !task) return prev;

      const destinationCol = COLUMNS.includes(overId)
        ? overId
        : COLUMNS.find((col) => prev[col].some((t) => t.id === overId));

      if (!destinationCol || destinationCol === sourceCol) return prev;

      // ✅ remember where we dropped
      lastDropColumnRef.current = destinationCol;

      return {
        ...prev,
        [sourceCol]: prev[sourceCol].filter((t) => t.id !== activeId),
        [destinationCol]: [...prev[destinationCol], task],
      };
    });
  };

  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <>
      <div className="p-3">
        <h1 className="text-3xl font-bold text-balance">Projects</h1>
        <p className="text-muted-foreground my-2 text-pretty">
          Set and track your goals with daily routine recommendations
        </p>
        <hr className="mt-2 mb-2 border-gray-200" />
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
        <hr className="mt-2 border-gray-200" />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <div className="flex gap-4 h-[77vh] px-3 pb-3 mb-2">
          {COLUMNS.map((col) => (
            <div
              key={col}
              className="w-[300px] shrink-0 p-0 m-0 rounded-sm bg-gray-50 border"
            >
              <div className="border-b px-2 pt-2 pb-1 font-semibold uppercase text-sm flex justify-between">
                {col}
                <span
                  className="ml-2 text-xs text-muted-foreground cursor-pointer"
                  onClick={() => alert("Column options coming soon!")}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Ellipsis />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="text-xs text-accent-foreground"
                    >
                      <DropdownMenuItem>
                        <Pen className="h-2 w-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <SquareKanban className="h-2 w-2" />
                        Show Custom Fields
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <PaintBucket />
                        Color Palette
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Reset</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </span>
              </div>

              <div className="h-[70vh] transition-all duration-200">
                <DroppableColumn id={col}>
                  <SortableContext
                    items={tasksByColumn[col].map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2 h-full p-px ">
                      {tasksByColumn[col].map((task) => (
                        <div className="hover:bg-linear-to-r p-px hover:from-blue-500 hover:to-purple-500 hover:scale-y-[1.010] rounded-sm transition-transform">
                          <SortableTask key={task.id} task={task} />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              </div>
            </div>
          ))}
        </div>

        {/* 🔥 Floating Drag Preview */}
        <DragOverlay adjustScale={false}>
          {activeTask ? (
            <div className="w-full">
              <TaskCard task={activeTask} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
