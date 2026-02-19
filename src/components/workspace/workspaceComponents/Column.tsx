import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";

type Task = {
  id: string;
  title: string;
};

export default function Column({
  column,
  tasks,
}: {
  column: string;
  tasks: Task[];
}) {
  return (
    <div className="w-72 bg-white rounded-md border flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 font-semibold text-sm border-b">
        {column}
      </div>

      {/* Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-4 scroll-smooth">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2 p-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
