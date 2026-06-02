import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCurrentUserId, getUserProfile } from "@/lib/backend-api";
import { setTheme } from "@/lib/theme";
import { PROFILE_STORAGE_KEY, useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

type FooterContainerProps = {
  sidebarState?: string;
};

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
};

const FooterContainer: React.FC<FooterContainerProps> = ({ sidebarState }) => {
  const navigate = useNavigate();
  const user = useAuthStore((store) => store.user);
  const clearAuth = useAuthStore((store) => store.clearAuth);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        const parsed = JSON.parse(raw) as ProfileData;
        setProfile(parsed);
      } catch {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    }

    // Fetch profile from API to get the avatar URL
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

  const handleLogout = () => {
    clearAuth();
    setTheme("light");
    window.location.replace("/login");
  };

  return (
    <>
    <Card
      className={`w-full ${
        sidebarState !== "expanded" ? "p-2" : "p-3"
      } border bg-card text-sm text-muted-foreground z-50 pointer-events-auto`}
    >
      {sidebarState !== "expanded" ? (
          <div className="flex flex-col items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={profile.avatarUrl} />
            <AvatarFallback className="text-[10px] font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="text-[10px] text-blue-600 hover:underline"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Signed in</p>
              <p className="text-sm font-medium text-foreground">
                {profile.firstName || profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`.trim()
                  : "User"}
              </p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile.avatarUrl} />
              <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/social/profile", search: { tab: "user-info" } })}
              className="flex-1 rounded-md border border-border px-2 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              Profile Settings
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="rounded-md border border-blue-200 px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
            >
              Logout
            </button>
          </div>
          <p className="text-[11px] text-gray-400">© 2026 SimpleFlow AI</p>
        </div>
      )}
    </Card>

    <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Logout</DialogTitle>
          <DialogDescription>
            Are you sure you want to logout?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setShowLogoutConfirm(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default FooterContainer;
