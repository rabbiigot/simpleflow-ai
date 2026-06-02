import { useRouter } from "@tanstack/react-router";
import { Bot } from "lucide-react";

export function RouteErrorComponent({ error }: { error: Error }) {
  const router = useRouter();
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-transparent border-2 border-red-400 flex items-center justify-center">
            <Bot className="w-10 h-10 text-red-400" strokeWidth={1.5} />
          </div>
        </div>
        <div className="text-xl font-semibold text-foreground">Something went wrong</div>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => router.invalidate()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function RoutePendingComponent() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}
