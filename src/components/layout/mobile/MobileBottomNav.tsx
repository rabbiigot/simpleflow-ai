import { cn } from "@/lib/utils";
import type { NavigationItem } from "@/interface/navigationItems";
import { Link, useLocation } from "@tanstack/react-router";
import loadingGif from "@/assets/loading.gif";

type MobileBottomNavProps = {
  items: NavigationItem[];
  onAiClick: () => void;
  aiActive?: boolean;
};

/**
 * Fixed bottom navigation bar shown only on mobile. The primary destinations
 * sit on either side of a prominent center Flowmo chat button (Analytics,
 * Automation and Campaign live in the profile dropdown).
 */
const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  items,
  onAiClick,
  aiActive,
}) => {
  const { pathname } = useLocation();

  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);

  const renderItem = (item: NavigationItem) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
          isActive
            ? "text-indigo-600 dark:text-blue-400"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <item.icon
          size={22}
          strokeWidth={isActive ? 2 : 1.5}
          className="shrink-0"
        />
        <span className="max-w-full truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch justify-around border-t border-sidebar-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      {left.map(renderItem)}

      {/* Center: Flowmo chat — gradient circle with the Flowmo gif */}
      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={onAiClick}
          aria-label="Open Flowmo AI chat"
          className={cn(
            "-mt-6 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 p-[2.5px] shadow-lg ring-4 ring-card transition-transform active:scale-95",
            aiActive && "scale-95",
          )}
        >
          <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-card">
            <img
              src={loadingGif}
              alt="Flowmo"
              className="h-9 w-9 rounded-full object-cover"
            />
          </span>
        </button>
      </div>

      {right.map(renderItem)}
    </nav>
  );
};

export default MobileBottomNav;
