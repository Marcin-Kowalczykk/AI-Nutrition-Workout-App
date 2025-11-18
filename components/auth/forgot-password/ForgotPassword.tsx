"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get the current URL for redirect
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error sending reset email"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-8 border p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Check your email</h1>
        <p className="mb-4 text-gray-600">
          We&apos;ve sent a password reset link to <strong>{email}</strong>
        </p>
        <p className="mb-4 text-sm text-gray-500">
          Please check your email and click on the link to reset your password.
        </p>
        <Link
          href="/login"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          ← Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 border p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      <p className="mb-4 text-gray-600">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-1 font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
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
          {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;
