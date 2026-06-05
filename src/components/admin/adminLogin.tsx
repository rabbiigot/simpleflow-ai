import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import sfLogo from "@/assets/chatgptlogosf.png";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3000";

type Props = {
  onLogin: (token: string) => void;
};

export function AdminLogin({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validate = () => {
    const errs: { username?: string; password?: string } = {};
    if (!username.trim()) errs.username = "Username is required.";
    if (!password) errs.password = "Password is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      const first = errors.username || errors.password || "Please check the form.";
      toast.error(first);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message || "Invalid credentials");
        return;
      }

      toast.success("Admin access granted.");
      onLogin(data.token);
    } catch {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        {/* Left panel — form */}
        <div className="w-full bg-white px-6 py-10 shadow-md sm:px-10 lg:w-[30%] lg:shadow-xl lg:px-10 lg:py-12 overflow-y-auto flex flex-col">
          <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center">
            <div className="relative mb-6 flex flex-col items-center justify-center">
              <div className="absolute -top-40 pointer-events-none">
                <img
                  src={sfLogo}
                  alt="Simpleflow"
                  className="h-60 w-auto"
                  loading="lazy"
                />
              </div>
              <h2 className="mt-2 text-center text-xl font-bold text-gray-800">
                Admin Access
              </h2>
              <p className="mt-1 text-center text-sm text-gray-500">
                Enter admin credentials to continue
              </p>
            </div>
            <form
              className="space-y-6"
              noValidate
              onSubmit={handleSubmit}
            >
              <div>
                <Label htmlFor="username" className="text-gray-700">
                  Username
                </Label>
                <Input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrors((p) => ({ ...p, username: undefined })); }}
                  autoComplete="off"
                  className={cn(
                    "mt-1 h-10 bg-white py-2 text-[16px] sm:text-sm",
                    errors.username
                      ? "border-red-500 shadow-sm shadow-red-200/60 focus-visible:border-red-500 focus-visible:ring-red-300/50"
                      : "border-indigo-200 shadow-none focus-visible:border-indigo-500 focus-visible:ring-indigo-200/50",
                  )}
                  placeholder="Enter admin username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-700">{errors.username}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    autoComplete="off"
                    className={cn(
                      "mt-1 h-10 bg-white py-2 pr-10 text-[16px] sm:text-sm",
                      errors.password
                        ? "border-red-500 shadow-sm shadow-red-200/60 focus-visible:border-red-500 focus-visible:ring-red-300/50"
                        : "border-indigo-200 shadow-none focus-visible:border-indigo-500 focus-visible:ring-indigo-200/50",
                    )}
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer mt-0.5"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-700">{errors.password}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-linear-to-r from-blue-600 to-purple-600 px-4 py-2 text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>

        {/* Right panel — decorative */}
        <div className="relative hidden flex-1 items-center justify-center overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600" />
          <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-white/12 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-white/12 blur-3xl" />

          <div className="relative flex flex-col items-center justify-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <div className="pointer-events-none max-w-md text-center text-white">
              <div className="text-3xl font-semibold leading-tight">
                SimpleFlow
                <br />
                Admin Panel
              </div>
              <div className="mt-3 text-lg text-white/80">
                Manage users, roles, and feature access.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
