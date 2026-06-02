import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/social/profile", search: { tab: "user-info" }, replace: true });
  }, [navigate]);
  return null;
};

export default ProfileSettingsPage;
