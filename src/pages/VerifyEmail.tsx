import { verifyEmail } from "@/lib/backend-api";
import { Link, useSearch } from "@tanstack/react-router";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function VerifyEmailPage() {
  const { token = "" } = useSearch({ from: "/verify-email" });

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed.");
      });
  }, [token]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-100">
      <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg bg-white/95 p-8 shadow-xl backdrop-blur text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Verifying your email...</h1>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Email Verified!</h1>
              <p className="mb-6 text-sm text-gray-600">{message}</p>
              <Link
                to="/login"
                className="inline-block rounded-md bg-linear-to-r from-blue-600 to-purple-600 px-6 py-2 text-white transition hover:from-blue-700 hover:to-purple-700"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Verification Failed</h1>
              <p className="mb-6 text-sm text-gray-600">{message}</p>
              <Link
                to="/login"
                className="inline-block rounded-md bg-linear-to-r from-blue-600 to-purple-600 px-6 py-2 text-white transition hover:from-blue-700 hover:to-purple-700"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
