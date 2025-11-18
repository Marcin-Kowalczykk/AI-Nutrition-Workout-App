"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ProfileSettings = () => {
  const [fullName, setFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [initialFullName, setInitialFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoadingData(true);

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setUserEmail(user.email || "");

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error loading profile:", profileError);
        }

        const profileFullName = profile?.full_name || "";
        setFullName(profileFullName);
        setInitialFullName(profileFullName);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Failed to load user data");
      } finally {
        setLoadingData(false);
      }
    };

    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not found");
      }

      // Update profile if full name changed
      if (fullName !== initialFullName) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: fullName })
          .eq("id", user.id);

        if (profileError) throw profileError;
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword.length < 6) {
          throw new Error("New password must be at least 6 characters long");
        }

        if (newPassword !== confirmPassword) {
          throw new Error("New passwords do not match");
        }

        // Update password in Supabase Auth
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) throw passwordError;
      }

      setSuccess("Profile updated successfully!");

      // Update initialFullName if full name was changed
      if (fullName !== initialFullName) {
        setInitialFullName(fullName);
      }

      // Clear password fields
      setNewPassword("");
      setConfirmPassword("");

      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="max-w-md mx-auto mt-8 border p-6 rounded-lg shadow-md">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 border p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        {/* Email (read-only) */}
        <div>
          <label htmlFor="email" className="block mb-1 font-medium ">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={userEmail}
            disabled
            className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block mb-1 font-medium">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your full name"
          />
        </div>

        {/* Password Section */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-3">Change Password</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block mb-1 font-medium">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty to keep current password"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            {newPassword && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block mb-1 font-medium"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (fullName === initialFullName && !newPassword)}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-blue-600 transition-colors"
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>
      <div className="mb-4 bg-gray-100 p-2 rounded-lg text-center mt-2">
        <Link
          href="/main-page"
          className=" hover:text-blue-700 transition-colors cursor-pointer text-black"
        >
          ← Back to Main Page
        </Link>
      </div>
    </div>
  );
};

export default ProfileSettings;
