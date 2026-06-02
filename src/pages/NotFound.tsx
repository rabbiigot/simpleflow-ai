import { Link } from "@tanstack/react-router";
import logoOnly from "@/assets/logoOnly.png";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md text-center space-y-6 px-6">
        <img
          src={logoOnly}
          alt="SimpleFlow"
          className="mx-auto h-12 w-12 opacity-40"
        />
        <div>
          <h1 className="text-7xl font-bold text-foreground/20">404</h1>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Page not found
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
