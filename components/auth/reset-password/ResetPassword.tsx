"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is authenticated (Supabase handles tokens automatically)
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        // If there's no user and no tokens in URL, show error
        // But if user exists, they can reset password (Supabase already processed the tokens)
        if (!user && !authError) {
          // Check if we have tokens in URL (they might be processed by Supabase)
          const searchParams = new URLSearchParams(window.location.search);
          const hasTokens =
            searchParams.has("access_token") ||
            searchParams.has("refresh_token");

          if (!hasTokens) {
            setError(
              "Invalid or expired reset link. Please request a new one."
            );
          }
        }
      } catch (err) {
        console.error("Error checking auth:", err);
      } finally {
        setLoadingCheck(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  if (loadingCheck) {
    return (
      <div className="max-w-md mx-auto mt-8 border p-6 rounded-lg shadow-md">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-8 border p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Password Reset Successful</h1>
        <p className="mb-4 text-gray-600">
          Your password has been successfully reset. Redirecting to login...
        </p>
        <Link
          href="/login"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Go to Login →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 border p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <p className="mb-4 text-gray-600">Enter your new password below.</p>

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <label htmlFor="password" className="block mb-1 font-medium">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new password"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block mb-1 font-medium">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm new password"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-blue-600 transition-colors"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-blue-500 hover:text-blue-700 underline"
          >
            ← Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
