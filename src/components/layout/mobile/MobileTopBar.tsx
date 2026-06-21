import { useEffect, useMemo, useState } from "react";
import { BarChart3, Bell, LogOut, Megaphone, Settings, Workflow } from "lucide-react";
import logoOnly from "@/assets/logoOnly.png";
import nameLogo from "@/assets/namelogo.png";
import nameLogoWhite from "@/assets/namelogo-white.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUserId, getUserProfile } from "@/lib/backend-api";
import { usePlanEntitlements } from "@/hooks/use-plan-entitlements";
import { setTheme } from "@/lib/theme";
import { PROFILE_STORAGE_KEY, useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";

type MobileTopBarProps = {
  onNotifClick: () => void;
  onAiClick: () => void;
  unreadCount?: number;
};

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
};

/**
 * Compact fixed top app bar shown only on mobile.
 * Left: logo + wordmark with an animated "running light" gradient — tapping it
 * opens Flowmo chat (the light stops while the chat is open).
 * Right: notifications + profile avatar dropdown.
 */
const MobileTopBar: React.FC<MobileTopBarProps> = ({
  onNotifClick,
  onAiClick,
  unreadCount = 0,
}) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAdmin = user?.role === "ADMIN";
  const featureFlags = user?.featureFlags;
  const entitlements = usePlanEntitlements();

  const [isDark, setIsDark] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
      }));
    }
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      try {
        setProfile(JSON.parse(raw) as ProfileData);
      } catch {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    }
    const userId = user?.id != null ? String(user.id) : getCurrentUserId();
    if (userId) {
      getUserProfile(userId)
        .then((data) => {
          setProfile((prev) => ({
            ...prev,
            firstName: data.firstName || prev.firstName,
            lastName: data.lastName || prev.lastName,
            email: data.email || prev.email,
            avatarUrl: data.avatarUrl || undefined,
          }));
        })
        .catch(() => { /* silent */ });
    }
  }, [user]);

  const initials = useMemo(() => {
    const first = profile.firstName?.[0] ?? "";
    const last = profile.lastName?.[0] ?? "";
    return `${first}${last}`.toUpperCase() || "U";
  }, [profile.firstName, profile.lastName]);

  // Mirror the sidebar's entitlement gating for the two action shortcuts.
  const showAutomation =
    isAdmin || (entitlements ? entitlements.maxAutomations !== 0 : false);
  const showCampaign =
    isAdmin ||
    featureFlags?.campaign === true ||
    (entitlements ? entitlements.emailCampaigns : false);

  const handleLogout = () => {
    clearAuth();
    setTheme("light");
    window.location.replace("/login");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-card px-3 md:hidden">
      {/* Left: logo + wordmark — opens Flowmo chat */}
      <button
        type="button"
        onClick={onAiClick}
        aria-label="Open Flowmo AI chat"
        className="flex items-center gap-2 focus:outline-none"
      >
        <img src={logoOnly} alt="Logo" className="h-9 w-auto" />
        <img
          src={isDark ? nameLogoWhite : nameLogo}
          alt="Simpleflow"
          className="h-6 w-auto"
        />
      </button>

      {/* Right: notifications + profile avatar dropdown */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onNotifClick}
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-muted focus:outline-none"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback className="text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {`${profile.firstName} ${profile.lastName}`.trim() || "User"}
              </span>
              {profile.email && (
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {profile.email}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                navigate({ to: "/social/profile", search: { tab: "user-info" } })
              }
            >
              <Settings className="h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/insights" })}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </DropdownMenuItem>
            {showAutomation && (
              <DropdownMenuItem onClick={() => navigate({ to: "/automation" })}>
                <Workflow className="h-4 w-4" />
                Automation
              </DropdownMenuItem>
            )}
            {showCampaign && (
              <DropdownMenuItem onClick={() => navigate({ to: "/campaign" })}>
                <Megaphone className="h-4 w-4" />
                Campaign
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default MobileTopBar;
