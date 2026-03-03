import { signUp } from "@/lib/backend-api";
import { useAuthStore } from "@/store/auth-store";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChangeEvent, FormEvent, useState } from "react";

type SignUpForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  address: string;
  password: string;
  confirmPassword: string;
};

const initialForm: SignUpForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  country: "",
  address: "",
  password: "",
  confirmPassword: "",
};

const SignupContainer = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<SignUpForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const setAuth = useAuthStore((store) => store.setAuth);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await signUp({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        country: form.country.trim(),
        address: form.address.trim() || undefined,
        password: form.password,
      });

      setAuth({
        token: response.token,
        user: response.user,
      });

      setSuccessMessage(response.message || "Signup successful.");
      setForm(initialForm);

      setTimeout(() => {
        void navigate({ to: "/dashboard" });
      }, 800);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Create Your Simpleflow Account
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Fill in your details to get started.
        </p>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              required
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="John"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              required
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Doe"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              required
              name="country"
              value={form.country}
              onChange={onChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Philippines"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={onChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="+63..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              name="address"
              value={form.address}
              onChange={onChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Street, City, Province"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              required
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              required
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Re-enter password"
            />
          </div>

          {(errorMessage || successMessage) && (
            <div className="md:col-span-2">
              {errorMessage && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              )}
              {successMessage && (
                <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {successMessage}
                </p>
              )}
            </div>
          )}

          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
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
  );
};

export default SignupContainer;
