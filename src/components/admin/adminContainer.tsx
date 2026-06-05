import { useCallback, useEffect, useState } from "react";
import { AdminLogin } from "./adminLogin";
import { AdminDashboard } from "./adminDashboard";

const ADMIN_TOKEN_KEY = "simpleflow_admin_token";

export default function AdminContainer() {
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) setAdminToken(stored);
  }, []);

  const handleLogin = useCallback((token: string) => {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    setAdminToken(token);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken(null);
  }, []);

  if (!adminToken) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard token={adminToken} onLogout={handleLogout} />;
}
