import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";

type Task = {
  id: string;
  title: string;
};

export default function TaskCard({
  task,
  isOverlay = false,
}: {
  task: Task;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    transition: {
      duration: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        "bg-card rounded-md border p-3 text-sm cursor-grab",
        "hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-purple-500/5",
        isDragging && "opacity-40",
        isOverlay && "shadow-xl scale-[1.02]",
      )}
    >
      {task.title}
    </div>
  );
}
