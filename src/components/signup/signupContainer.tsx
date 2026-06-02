import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES, type Country } from "@/constants/countries";
import { resendVerification, signUp } from "@/lib/backend-api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Eye, EyeOff, Loader2, Mail, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .email("Please enter a valid email address."),
    phoneNumber: z.string().trim().optional().or(z.literal("")),
    country: z.string().trim().min(1, "Country is required."),
    address: z.string().trim().optional().or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signupSchema>;

const inputBase =
  "h-10 bg-white py-2 text-[16px] sm:text-sm border-gray-300 shadow-none focus-visible:border-indigo-500 focus-visible:ring-indigo-200/50";
const inputError =
  "h-10 bg-white py-2 text-[16px] sm:text-sm border-red-500 shadow-sm shadow-red-200/60 focus-visible:border-red-500 focus-visible:ring-red-300/50";

const SignupContainer = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((store) => store.setAuth);
  const clearAuth = useAuthStore((store) => store.clearAuth);

  const emailFromUrl = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("email") || ""
    : "";

  const [signupDone, setSignupDone] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [dialCode, setDialCode] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: emailFromUrl,
      phoneNumber: "",
      country: "",
      address: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dial.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setDialCode(country.dial);
    setValue("country", country.name, { shouldValidate: true });
    setShowCountryDropdown(false);
    setCountrySearch("");
  };

  const onSubmit = async (values: SignUpFormValues) => {
    const fullPhone = values.phoneNumber?.trim()
      ? `${dialCode}${values.phoneNumber.trim().replace(/^0+/, "")}`
      : undefined;

    try {
      const response = await signUp({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: fullPhone,
        country: values.country,
        address: values.address?.trim() || undefined,
        password: values.password,
      });

      toast.success(response.message || "Account created. Check your email.");
      clearAuth();
      setSignupEmail(values.email);
      setSignupDone(true);
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create account.",
      );
    }
  };

  if (signupDone) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600" />
        <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-lg bg-white/95 p-8 shadow-xl backdrop-blur text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <Mail className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Check your email</h1>
            <p className="mb-1 text-sm text-gray-600">
              We've sent a verification link to
            </p>
            <p className="mb-6 text-sm font-semibold text-gray-900">{signupEmail}</p>
            <p className="mb-6 text-sm text-gray-500">
              Click the link in the email to verify your account, then come back and log in.
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full rounded-md bg-linear-to-r from-blue-600 to-purple-600 px-4 py-2 text-center text-white transition hover:from-blue-700 hover:to-purple-700"
              >
                Go to Login
              </Link>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await resendVerification(signupEmail);
                    toast.success("Verification email resent.");
                  } catch {
                    toast.error("Failed to resend. Try again later.");
                  }
                }}
                className="w-full text-sm text-indigo-600 hover:underline"
              >
                Didn't receive it? Resend verification email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-100">
      <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600" />
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/15 blur-2xl" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-lg bg-white/95 p-8 shadow-xl backdrop-blur">
          <div className="relative mb-6 mt-10 flex flex-col items-center justify-center">
            <div className="absolute -top-35">
              <img
                src="/src/assets/chatgptlogosf.png"
                alt="Simpleflow"
                className="h-60 w-auto"
                loading="lazy"
              />
            </div>
          </div>

          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Create Your Simpleflow Account
          </h1>
          <p className="mb-6 text-center text-sm text-gray-600">
            Fill in your details to get started.
          </p>

          <form
            className="grid gap-4 md:grid-cols-2"
            noValidate
            onSubmit={handleSubmit(onSubmit, (formErrors) => {
              const first =
                formErrors.firstName?.message ||
                formErrors.lastName?.message ||
                formErrors.email?.message ||
                formErrors.country?.message ||
                formErrors.password?.message ||
                formErrors.confirmPassword?.message ||
                "Please check the form and try again.";
              toast.error(first);
            })}
          >
            <div>
              <Label htmlFor="firstName" className="mb-1 text-gray-700">
                First Name
              </Label>
              <Input
                id="firstName"
                {...register("firstName")}
                aria-invalid={Boolean(errors.firstName)}
                className={cn(errors.firstName ? inputError : inputBase)}
                placeholder="John"
              />
              {errors.firstName?.message && (
                <p className="mt-1 text-sm text-red-700">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName" className="mb-1 text-gray-700">
                Last Name
              </Label>
              <Input
                id="lastName"
                {...register("lastName")}
                aria-invalid={Boolean(errors.lastName)}
                className={cn(errors.lastName ? inputError : inputBase)}
                placeholder="Doe"
              />
              {errors.lastName?.message && (
                <p className="mt-1 text-sm text-red-700">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="email" className="mb-1 text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                aria-invalid={Boolean(errors.email)}
                className={cn(
                  errors.email ? inputError : inputBase,
                  emailFromUrl && "opacity-60 cursor-not-allowed",
                )}
                placeholder="john@example.com"
                readOnly={!!emailFromUrl}
              />
              {errors.email?.message && (
                <p className="mt-1 text-sm text-red-700">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Country selector */}
            <div className="relative" ref={dropdownRef}>
              <Label htmlFor="country" className="mb-1 text-gray-700">
                Country
              </Label>
              <input type="hidden" {...register("country")} />
              <button
                type="button"
                onClick={() => setShowCountryDropdown((prev) => !prev)}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm",
                  errors.country
                    ? "border-red-500 shadow-sm shadow-red-200/60"
                    : "border-gray-300 bg-white",
                )}
              >
                {selectedCountry ? (
                  <span className="flex items-center gap-2">
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.name}</span>
                    <span className="text-gray-400">{selectedCountry.dial}</span>
                  </span>
                ) : (
                  <span className="text-gray-400">Select country</span>
                )}
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {showCountryDropdown && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search country..."
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCountries.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-gray-400">
                        No countries found
                      </div>
                    ) : (
                      filteredCountries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => handleSelectCountry(country)}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50",
                            selectedCountry?.code === country.code && "bg-indigo-50 font-medium",
                          )}
                        >
                          <span>{country.flag}</span>
                          <span className="flex-1">{country.name}</span>
                          <span className="text-gray-400">{country.dial}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {errors.country?.message && (
                <p className="mt-1 text-sm text-red-700">
                  {errors.country.message}
                </p>
              )}
            </div>

            {/* Phone number with dial code */}
            <div>
              <Label htmlFor="phoneNumber" className="mb-1 text-gray-700">
                Phone Number
              </Label>
              <div className="flex">
                {selectedCountry && (
                <div className="flex h-10 items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span>{selectedCountry.flag}</span>
                    <span>{dialCode}</span>
                  </span>
                </div>
              )}
                <Input
                  id="phoneNumber"
                  {...register("phoneNumber")}
                  className={cn(inputBase, selectedCountry && "rounded-l-none")}
                  placeholder={selectedCountry ? "9123456789" : "Phone number"}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address" className="mb-1 text-gray-700">
                Address
              </Label>
              <Input
                id="address"
                {...register("address")}
                className={cn(inputBase)}
                placeholder="Street, City, Province"
              />
            </div>

            <div>
              <Label htmlFor="password" className="mb-1 text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  aria-invalid={Boolean(errors.password)}
                  className={cn(errors.password ? inputError : inputBase, "pr-10")}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="mt-1 text-sm text-red-700">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="mb-1 text-gray-700">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  className={cn(errors.confirmPassword ? inputError : inputBase, "pr-10")}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword?.message && (
                <p className="mt-1 text-sm text-red-700">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2 mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-linear-to-r from-blue-600 to-purple-600 px-4 py-2 text-white transition hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creating account..." : "Sign Up"}
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupContainer;
