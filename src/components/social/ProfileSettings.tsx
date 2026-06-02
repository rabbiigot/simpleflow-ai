import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textArea";
import githubIcon from "@/assets/github.svg";
import {
  changePassword,
  disconnectGitHub,
  disconnectGoogleCalendar,
  disableGitHubRepo,
  enableGitHubRepo,
  getCurrentUserId,
  getGitHubAuthUrl,
  getGitHubStatus,
  getGoogleCalendarAuthUrl,
  getGoogleCalendarStatus,
  getUserProfile,
  listGitHubRepos,
  syncGoogleCalendar,
  updateUserProfile,
  uploadProfileImage,
  type GitHubRepoItem,
  type GitHubStatus,
  type GoogleCalendarStatus,
  type UserProfile,
} from "@/lib/backend-api";
import { getStoredTheme, setTheme, type AppTheme } from "@/lib/theme";
import { PROFILE_STORAGE_KEY, useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Camera,
  Eye,
  EyeOff,
  Globe,
  ImagePlus,
  KeyRound,
  Link2,
  Loader2,
  Moon,
  Plug,
  RefreshCw,
  Settings,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type SettingsTab = "user-info" | "password" | "general" | "integrations" | "privacy";

type NavSection = {
  label: string;
  items: { id: SettingsTab; label: string; icon: React.ReactNode }[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Account",
    items: [
      { id: "user-info", label: "User Information", icon: <User className="h-4 w-4" /> },
      { id: "password", label: "Password", icon: <KeyRound className="h-4 w-4" /> },
    ],
  },
  {
    label: "Preferences",
    items: [
      { id: "general", label: "General", icon: <Settings className="h-4 w-4" /> },
      { id: "integrations", label: "Integrations", icon: <Plug className="h-4 w-4" /> },
    ],
  },
  {
    label: "Security",
    items: [
      { id: "privacy", label: "Privacy", icon: <Shield className="h-4 w-4" /> },
    ],
  },
];

export { NAV_SECTIONS, type SettingsTab };

export default function ProfileSettings({ embedded, initialTab }: { embedded?: boolean; initialTab?: SettingsTab } = {}) {
  const navigate = useNavigate();
  const authUser = useAuthStore((store) => store.user);
  const currentUserId = authUser?.id != null ? String(authUser.id) : getCurrentUserId();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || "user-info");
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Password form state
  const [currentPasswordVal, setCurrentPasswordVal] = useState("");
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [confirmPasswordVal, setConfirmPasswordVal] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // General settings
  const [themeState, setThemeState] = useState<AppTheme>(() => getStoredTheme());
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);

  // Integrations state
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null);
  const [calendarStatus, setCalendarStatus] = useState<GoogleCalendarStatus | null>(null);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [showRepos, setShowRepos] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GitHubRepoItem[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [togglingRepo, setTogglingRepo] = useState<string | null>(null);

  // Image upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const displayName = useMemo(() => {
    if (!profileData) return "User";
    return [profileData.firstName, profileData.lastName].filter(Boolean).join(" ") || "User";
  }, [profileData]);

  const initials = useMemo(() => {
    const first = profileData?.firstName?.[0] || "";
    const last = profileData?.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  }, [profileData]);

  const avatarSrc = profileData?.avatarUrl || "/placeholder.svg";
  const coverSrc = profileData?.coverUrl || "";

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setIsCoverLoaded(false);
  }, [coverSrc]);

  // Load profile
  useEffect(() => {
    if (!currentUserId) return;
    setIsLoadingProfile(true);
    getUserProfile(currentUserId)
      .then((data) => {
        setProfileData(data);
        setEditFirstName(data.firstName || "");
        setEditLastName(data.lastName || "");
        setEditBio(data.bio || "");
        try {
          const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { country?: string };
            setEditCountry(parsed.country || "");
          }
        } catch { /* no-op */ }
      })
      .catch(() => { })
      .finally(() => setIsLoadingProfile(false));
  }, [currentUserId]);

  // Load integration statuses when tab is active
  useEffect(() => {
    if (activeTab !== "integrations" || !currentUserId) return;
    setIsLoadingIntegrations(true);
    Promise.all([
      getGitHubStatus(currentUserId).catch(() => ({ connected: false }) as GitHubStatus),
      getGoogleCalendarStatus(currentUserId).catch(() => ({ connected: false }) as GoogleCalendarStatus),
    ])
      .then(([gh, gc]) => {
        setGithubStatus(gh);
        setCalendarStatus(gc);
      })
      .finally(() => setIsLoadingIntegrations(false));
  }, [activeTab, currentUserId]);

  const handleConnectGitHub = async () => {
    if (!currentUserId) return;
    try {
      const { url } = await getGitHubAuthUrl(currentUserId);
      window.location.href = url;
    } catch {
      toast.error("Failed to start GitHub connection");
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!currentUserId) return;
    try {
      await disconnectGitHub(currentUserId);
      setGithubStatus({ connected: false });
      setShowRepos(false);
      setGithubRepos([]);
      toast.success("GitHub disconnected");
    } catch {
      toast.error("Failed to disconnect GitHub");
    }
  };

  const handleManageRepos = async () => {
    if (!currentUserId) return;
    if (showRepos) {
      setShowRepos(false);
      return;
    }
    setIsLoadingRepos(true);
    setShowRepos(true);
    try {
      const repos = await listGitHubRepos(currentUserId);
      setGithubRepos(repos);
    } catch {
      toast.error("Failed to load repos");
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleToggleRepo = async (repo: GitHubRepoItem) => {
    if (!currentUserId) return;
    setTogglingRepo(repo.fullName);
    try {
      if (repo.enabled) {
        await disableGitHubRepo(currentUserId, repo.fullName);
      } else {
        await enableGitHubRepo(currentUserId, repo.fullName);
      }
      setGithubRepos((prev) =>
        prev.map((r) =>
          r.fullName === repo.fullName ? { ...r, enabled: !r.enabled } : r,
        ),
      );
    } catch {
      toast.error(`Failed to ${repo.enabled ? "disable" : "enable"} ${repo.name}`);
    } finally {
      setTogglingRepo(null);
    }
  };

  const handleConnectCalendar = async () => {
    if (!currentUserId) return;
    try {
      const { url } = await getGoogleCalendarAuthUrl(currentUserId);
      window.location.href = url;
    } catch {
      toast.error("Failed to start Google Calendar connection");
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!currentUserId) return;
    try {
      await disconnectGoogleCalendar(currentUserId);
      setCalendarStatus({ connected: false });
      toast.success("Google Calendar disconnected");
    } catch {
      toast.error("Failed to disconnect Google Calendar");
    }
  };

  const handleSyncCalendar = async () => {
    if (!currentUserId) return;
    setIsSyncingCalendar(true);
    try {
      const result = await syncGoogleCalendar(currentUserId);
      toast.success(`Synced ${result.synced} events`);
      setCalendarStatus((prev) => prev ? { ...prev, lastSyncAt: new Date().toISOString() } : prev);
    } catch {
      toast.error("Failed to sync calendar");
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleUploadImage = async (
    event: ChangeEvent<HTMLInputElement>,
    type: "avatar" | "cover",
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUserId) return;

    const setter = type === "avatar" ? setIsUploadingAvatar : setIsUploadingCover;
    setter(true);

    try {
      const updated = await uploadProfileImage(currentUserId, file, type);
      setProfileData(updated);
      toast.success(`${type === "avatar" ? "Profile picture" : "Cover photo"} updated`);
    } catch {
      toast.error(`Failed to upload ${type === "avatar" ? "profile picture" : "cover photo"}`);
    } finally {
      setter(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUserId) return;
    setIsSaving(true);
    try {
      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          email: profileData?.email || "",
          country: editCountry,
          avatarUrl: profileData?.avatarUrl || "",
          coverUrl: profileData?.coverUrl || "",
          bio: editBio,
        }),
      );

      const updated = await updateUserProfile(currentUserId, {
        firstName: editFirstName.trim() || undefined,
        lastName: editLastName.trim() || undefined,
        bio: editBio.trim() || undefined,
      });
      setProfileData(updated);
      toast.success("Profile saved successfully");
    } catch {
      toast.error("Profile saved locally. Server sync unavailable right now.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUserId) return;

    if (!currentPasswordVal.trim()) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPasswordVal.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPasswordVal !== confirmPasswordVal) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentUserId, currentPasswordVal, newPasswordVal);
      toast.success("Password changed successfully");
      setCurrentPasswordVal("");
      setNewPasswordVal("");
      setConfirmPasswordVal("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleThemeToggle = useCallback((checked: boolean) => {
    const next: AppTheme = checked ? "dark" : "light";
    setThemeState(next);
    setTheme(next);
  }, []);

  if (isLoadingProfile && !embedded) {
    return (
      <div className="page-shell">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "w-full" : "page-shell"}>
      {!embedded && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/social/profile" })}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
            <p className="section-label !mb-0">Profile Settings</p>
          </div>

      {/* Profile header card with cover + avatar */}
      <Card className="overflow-hidden rounded-md shadow-sm p-0 mb-6">
        <div
          className={`relative h-36 sm:h-44 bg-cover bg-center ${coverSrc ? "" : "bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5"}`}
          style={coverSrc && isCoverLoaded ? { backgroundImage: `url(${coverSrc})` } : undefined}
        >
          {coverSrc && !isCoverLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {coverSrc && (
            <img
              src={coverSrc}
              alt=""
              className="hidden"
              onLoad={() => setIsCoverLoaded(true)}
            />
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUploadImage(e, "cover")}
          />
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-3 right-3 gap-2 bg-white text-black hover:bg-white/90"
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
          >
            <ImagePlus className="h-4 w-4" />
            {isUploadingCover ? "Uploading..." : coverSrc ? "Change Cover" : "Add Cover Photo"}
          </Button>
        </div>
        <div className="relative px-6 pb-4">
          <div className="absolute -top-10 left-6">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                <AvatarImage src={avatarSrc} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUploadImage(e, "avatar")}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
          <div className="pt-12">
            <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
            {profileData?.email && (
              <p className="text-sm text-muted-foreground">{profileData.email}</p>
            )}
          </div>
        </div>
      </Card>
        </>
      )}

      {/* Settings layout: side nav + content */}
      <div className={embedded ? "w-full" : "flex gap-6 flex-col md:flex-row"}>
        {/* Left side navigation */}
        {!embedded && (
        <nav className="w-full md:w-64 shrink-0">
          <Card className="rounded-md shadow-sm p-0">
            <div className="flex flex-col p-2">
              {NAV_SECTIONS.map((section, sectionIdx) => (
                <div key={section.label}>
                  {sectionIdx > 0 && <div className="mx-2 my-2 border-t border-border" />}
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {section.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                          activeTab === item.id
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </nav>
        )}

        {/* Right content panel */}
        <div className="flex-1 min-w-0">
          {/* User Information Tab */}
          {activeTab === "user-info" && (
            <Card className="rounded-md shadow-sm">
              <CardContent className="space-y-5 pt-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">User Information</h3>
                  <p className="text-sm text-muted-foreground">Update your personal details and public profile.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData?.email || ""}
                      disabled
                      className="opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profileData?.email?.split("@")[0] || ""}
                      disabled
                      className="opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">Derived from your email.</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="country">Country / Address</Label>
                    <Input
                      id="country"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      placeholder="Enter your country or address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Share a little about yourself. This will be visible on your profile.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={() => void handleSaveProfile()} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (profileData) {
                        setEditFirstName(profileData.firstName || "");
                        setEditLastName(profileData.lastName || "");
                        setEditBio(profileData.bio || "");
                      }
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <Card className="rounded-md shadow-sm">
              <CardContent className="space-y-5 pt-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Change Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your current password to verify your identity, then set a new password.
                  </p>
                </div>

                <div className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPasswordVal}
                        onChange={(e) => setCurrentPasswordVal(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPasswordVal}
                        onChange={(e) => setNewPasswordVal(e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPasswordVal}
                        onChange={(e) => setConfirmPasswordVal(e.target.value)}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPasswordVal && newPasswordVal !== confirmPasswordVal && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={() => void handleChangePassword()}
                    disabled={
                      isChangingPassword ||
                      !currentPasswordVal ||
                      !newPasswordVal ||
                      newPasswordVal !== confirmPasswordVal
                    }
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentPasswordVal("");
                      setNewPasswordVal("");
                      setConfirmPasswordVal("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <Card className="rounded-md shadow-sm">
                <CardContent className="space-y-5 pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Appearance</h3>
                    <p className="text-sm text-muted-foreground">Customize how SimpleFlow looks for you.</p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        {themeState === "dark" ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Dark Mode</p>
                        <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
                      </div>
                    </div>
                    <Switch
                      checked={themeState === "dark"}
                      onCheckedChange={handleThemeToggle}
                      aria-label="Toggle dark mode"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-md shadow-sm">
                <CardContent className="space-y-5 pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Notifications</h3>
                    <p className="text-sm text-muted-foreground">Manage how you receive notifications.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Email Notifications</p>
                        <p className="text-xs text-muted-foreground">Receive email updates about activity</p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                        aria-label="Toggle email notifications"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Activity Status</p>
                        <p className="text-xs text-muted-foreground">Show when you are active on SimpleFlow</p>
                      </div>
                      <Switch
                        checked={activityStatus}
                        onCheckedChange={setActivityStatus}
                        aria-label="Toggle activity status"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-md shadow-sm">
                <CardContent className="space-y-5 pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Language & Region</h3>
                    <p className="text-sm text-muted-foreground">Set your preferred language and regional settings.</p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Language</p>
                        <p className="text-xs text-muted-foreground">English (US)</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === "integrations" && (
            <div className="space-y-6">
              <Card className="rounded-md shadow-sm">
                <CardContent className="space-y-5 pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Connected Services</h3>
                    <p className="text-sm text-muted-foreground">Connect external services to enhance Flowmo AI.</p>
                  </div>

                  {isLoadingIntegrations ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* GitHub */}
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black">
                              <img src={githubIcon} alt="GitHub" className="h-5 w-5 invert" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">GitHub</p>
                              {githubStatus?.connected ? (
                                <p className="text-xs text-muted-foreground">
                                  Connected as <span className="font-medium">@{githubStatus.githubUsername}</span>
                                  {githubStatus.activeRepos && githubStatus.activeRepos.length > 0 && (
                                    <> &middot; {githubStatus.activeRepos.length} repo{githubStatus.activeRepos.length !== 1 ? "s" : ""} enabled</>
                                  )}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  See commits, PRs, and issues in Flowmo. Auto-link to tasks.
                                </p>
                              )}
                            </div>
                          </div>
                          {githubStatus?.connected ? (
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => void handleManageRepos()}>
                                {showRepos ? "Hide Repos" : "Manage Repos"}
                              </Button>
                              <Button variant="outline" size="sm" onClick={handleDisconnectGitHub}>
                                Disconnect
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={handleConnectGitHub} className="gap-1.5">
                              <Link2 className="h-3.5 w-3.5" />
                              Connect
                            </Button>
                          )}
                        </div>

                        {/* Repo list */}
                        {showRepos && githubStatus?.connected && (
                          <div className="mt-4 border-t pt-4">
                            {isLoadingRepos ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-xs text-muted-foreground">Loading repos...</span>
                              </div>
                            ) : githubRepos.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">No repos found</p>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {githubRepos.map((repo) => (
                                  <div
                                    key={repo.fullName}
                                    className="flex items-center justify-between rounded-md border px-3 py-2"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-foreground truncate">{repo.fullName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {repo.private ? "Private" : "Public"}
                                        {repo.language && <> &middot; {repo.language}</>}
                                      </p>
                                    </div>
                                    <Switch
                                      checked={repo.enabled}
                                      disabled={togglingRepo === repo.fullName}
                                      onCheckedChange={() => void handleToggleRepo(repo)}
                                      aria-label={`Toggle ${repo.name}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Google Calendar */}
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">Google Calendar</p>
                              {calendarStatus?.connected ? (
                                <p className="text-xs text-muted-foreground">
                                  Connected as <span className="font-medium">{calendarStatus.googleEmail}</span>
                                  {calendarStatus.lastSyncAt && (
                                    <> &middot; Last sync: {new Date(calendarStatus.lastSyncAt).toLocaleTimeString()}</>
                                  )}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Flowmo sees your schedule, warns about conflicts, and preps for meetings.
                                </p>
                              )}
                            </div>
                          </div>
                          {calendarStatus?.connected ? (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void handleSyncCalendar()}
                                disabled={isSyncingCalendar}
                                className="gap-1.5"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${isSyncingCalendar ? "animate-spin" : ""}`} />
                                {isSyncingCalendar ? "Syncing..." : "Sync Now"}
                              </Button>
                              <Button variant="outline" size="sm" onClick={handleDisconnectCalendar}>
                                Disconnect
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={handleConnectCalendar} className="gap-1.5">
                              <Link2 className="h-3.5 w-3.5" />
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-md shadow-sm">
                <CardContent className="space-y-3 pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground">More integrations on the way.</p>
                  </div>
                  <div className="space-y-2">
                    {["Slack", "Jira", "ClickUp", "Notion"].map((name) => (
                      <div key={name} className="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-50">
                        <p className="text-sm text-muted-foreground">{name}</p>
                        <span className="text-xs text-muted-foreground">Coming Soon</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <Card className="rounded-md shadow-sm">
                <CardContent className="space-y-5 pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Privacy Settings</h3>
                    <p className="text-sm text-muted-foreground">Control who can see your information and activity.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Profile Visibility</p>
                        <p className="text-xs text-muted-foreground">Allow other users to view your profile</p>
                      </div>
                      <Switch defaultChecked aria-label="Toggle profile visibility" />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Show Posts on Feed</p>
                        <p className="text-xs text-muted-foreground">Allow your posts to appear on the social feed</p>
                      </div>
                      <Switch defaultChecked aria-label="Toggle posts on feed" />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Show Email on Profile</p>
                        <p className="text-xs text-muted-foreground">Display your email address on your public profile</p>
                      </div>
                      <Switch aria-label="Toggle email visibility" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-md shadow-sm">
                <CardContent className="space-y-5 pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Account</h3>
                    <p className="text-sm text-muted-foreground">Manage your account settings.</p>
                  </div>

                  <div className="rounded-lg border border-destructive/20 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-destructive">Deactivate Account</p>
                        <p className="text-xs text-muted-foreground">
                          Temporarily disable your account. You can reactivate it later.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10" disabled>
                        Deactivate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
