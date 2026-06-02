import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl, login } from "@/lib/backend-api";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AUTH_TOKEN_KEY, useAuthStore } from "@/store/auth-store";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import loginBg from "/src/assets/login-bg.png";
import googleIcon from "@/assets/google.png";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((store) => store.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  // Handle Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "success") {
      const token = params.get("token");
      const userStr = params.get("user");
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setAuth({ token, user });
          toast.success("Successfully signed in with Google.");
          void navigate({ to: "/dashboard" });
          return;
        } catch { /* ignore */ }
      }
    } else if (params.get("google") === "error") {
      toast.error(params.get("message") || "Google sign-in failed.");
    }
  }, [setAuth, navigate]);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      void navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await login({
        email: values.email,
        password: values.password,
      });
      setAuth({
        token: response.token,
        user: response.user,
      });
      toast.success("Successfully logged in.");
      void navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.",
      );
    }
  };

  const handleGoogleSignIn = () => {
    // Backend should implement OAuth at this endpoint.
    window.location.href = `${getApiBaseUrl()}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <div className="w-full bg-white px-6 py-10 shadow-md sm:px-10 lg:w-[30%] lg:shadow-xl lg:px-10 lg:py-12 overflow-y-auto flex flex-col">
          <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center">
            <div className="relative mb-6 flex flex-col items-center justify-center">
              <div className="absolute -top-40">
                <img
                  src="/src/assets/chatgptlogosf.png"
                  alt="Simpleflow"
                  className="h-60 w-auto"
                  loading="lazy"
                />
              </div>
              <h2 className="mt-2 text-center text-xl font-bold text-gray-800">
                Login to Your Account
              </h2>
            </div>
            <form
              className="space-y-6"
              noValidate
              onSubmit={handleSubmit(onSubmit, (formErrors) => {
                const first =
                  formErrors.email?.message ||
                  formErrors.password?.message ||
                  "Please check the form and try again.";
                toast.error(first);
              })}
            >
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center gap-2"
              >
                <img
                  src={googleIcon}
                  alt=""
                  className="h-5 w-5"
                  aria-hidden="true"
                  loading="lazy"
                />
                <span className="text-sm font-medium">
                  Continue with Google
                </span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">or</span>
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-700">
                  Email Address
                </Label>
                <Input
                  type="email"
                  id="email"
                  {...register("email")}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={cn(
                    "mt-1 h-10 bg-white py-2 text-[16px] sm:text-sm",
                    errors.email
                      ? "border-red-500 shadow-sm shadow-red-200/60 focus-visible:border-red-500 focus-visible:ring-red-300/50"
                      : "border-indigo-200 shadow-none focus-visible:border-indigo-500 focus-visible:ring-indigo-200/50",
                  )}
                  placeholder="Enter your email"
                />
                {errors.email?.message && (
                  <p id="email-error" className="mt-1 text-sm text-red-700">
                    {errors.email.message}
                  </p>
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
                    {...register("password")}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={cn(
                      "mt-1 h-10 bg-white py-2 pr-10 text-[16px] sm:text-sm",
                      errors.password
                        ? "border-red-500 shadow-sm shadow-red-200/60 focus-visible:border-red-500 focus-visible:ring-red-300/50"
                        : "border-indigo-200 shadow-none focus-visible:border-indigo-500 focus-visible:ring-indigo-200/50",
                    )}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer mt-0.5"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password?.message && (
                  <p
                    id="password-error"
                    className="mt-1 text-sm text-red-700"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-linear-to-r from-blue-600 to-purple-600 px-4 py-2 text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/sign-up"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>

        <div className="relative hidden flex-1 items-center justify-center overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600" />
          <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-white/12 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-white/12 blur-3xl" />

          <div className="relative h-full w-full p-10">
            <div className="flex h-full flex-col justify-between">
              <div className="flex flex-1 items-center justify-center">
                <img
                  src={loginBg}
                  alt="Kanban preview"
                  className="max-h-[82vh] w-auto max-w-[900px] rounded-2xl shadow-2xl ring-1 ring-white/15"
                  loading="lazy"
                />
              </div>

              <div className="pointer-events-none max-w-md text-white">
                <div className="text-3xl font-semibold leading-tight">
                  Streamline
                  <br />
                  your tasks and
                </div>
                <div className="mt-2 text-lg text-white/90">
                  make the flow smooth and simple.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
