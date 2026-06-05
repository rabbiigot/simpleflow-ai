import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { tab } = useSearch({ strict: false });
  useEffect(() => {
    navigate({ to: "/social/profile", search: { tab: tab || "user-info" }, replace: true });
  }, [navigate, tab]);
  return null;
};

export default ProfileSettingsPage;
