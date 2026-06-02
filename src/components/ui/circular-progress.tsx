import { cn } from "@/lib/utils";

type CircularProgressProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  progressClassName?: string;
  showLabel?: boolean;
  labelClassName?: string;
};

export function CircularProgress({
  value,
  size = 44,
  strokeWidth = 6,
  className,
  trackClassName,
  progressClassName,
  showLabel = true,
  labelClassName,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-label={`Progress ${clamped}%`}
      role="img"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={cn("text-gray-200", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={cn("text-indigo-500", progressClassName)}
        />
      </svg>
      {showLabel && (
        <span
          className={cn(
            "absolute text-[10px] font-semibold text-gray-800 dark:text-gray-100",
            labelClassName,
          )}
        >
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
