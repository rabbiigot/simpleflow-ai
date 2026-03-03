import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROFILE_STORAGE_KEY, useAuthStore } from "@/store/auth-store";
import { useEffect, useMemo, useState } from "react";

type FooterContainerProps = {
  sidebarState?: string;
};

type ProfileSettings = {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
};

const FooterContainer: React.FC<FooterContainerProps> = ({ sidebarState }) => {
  const user = useAuthStore((store) => store.user);
  const clearAuth = useAuthStore((store) => store.clearAuth);
  const [profile, setProfile] = useState<ProfileSettings>({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);

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
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ProfileSettings;
      setProfile(parsed);
    } catch {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }, [user]);

  const initials = useMemo(() => {
    const first = profile.firstName?.[0] ?? "";
    const last = profile.lastName?.[0] ?? "";
    return `${first}${last}`.toUpperCase() || "U";
  }, [profile.firstName, profile.lastName]);

  const handleProfileChange = (field: keyof ProfileSettings, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (profileSaved) {
      setProfileSaved(false);
    }
  };

  const handleSaveProfile = () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setProfileSaved(true);
  };

  const handleLogout = () => {
    clearAuth();
    window.location.replace("/login");
  };

  return (
    <Card
      className={`w-full ${
        sidebarState !== "expanded" ? "p-2" : "p-3"
      } border bg-white text-sm text-gray-500 z-50 pointer-events-auto`}
    >
        {sidebarState !== "expanded" ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[10px] text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Signed in</p>
                <p className="text-sm font-medium text-gray-800">
                  {profile.firstName || profile.lastName
                    ? `${profile.firstName} ${profile.lastName}`.trim()
                    : "User"}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="flex-1 rounded-md border px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                  >
                    Profile Settings
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Profile Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="profile-firstName">First Name</Label>
                      <Input
                        id="profile-firstName"
                        value={profile.firstName}
                        onChange={(event) =>
                          handleProfileChange("firstName", event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="profile-lastName">Last Name</Label>
                      <Input
                        id="profile-lastName"
                        value={profile.lastName}
                        onChange={(event) =>
                          handleProfileChange("lastName", event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="profile-email">Email</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        value={profile.email}
                        onChange={(event) =>
                          handleProfileChange("email", event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="profile-country">Country</Label>
                      <Input
                        id="profile-country"
                        value={profile.country}
                        onChange={(event) =>
                          handleProfileChange("country", event.target.value)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Save Profile
                    </button>
                    {profileSaved && (
                      <p className="text-xs text-green-600">Profile saved.</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
            <p className="text-[11px] text-gray-400">© 2026 SimpleFlow AI</p>
          </div>
        )}
    </Card>
  );
};

export default FooterContainer;
