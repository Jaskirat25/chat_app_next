"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { saveOtpData, sendOtp } from "../../../lib/otp";
import { isValidEmail } from "../../../lib/email-check";
import Hash from "../../../lib/hash";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!username) {
        toast.error("Username is required");
        setLoading(false);
        return;
      }
      if (!password) {
        toast.error("Password is required");
        setLoading(false);
        return;
      }
      if (!isValidEmail(email)) {
        toast.error("Enter a valid email");
        setLoading(false);
        return;
      }

      const hashedPassword = await Hash(password);
      const otp = await sendOtp(email);

      if (!otp.success) {
        toast.error(otp.message || "Failed to send OTP.");
        setLoading(false);
        return;
      }

      const saveResult = await saveOtpData({
        username,
        email,
        password: hashedPassword,
        otp,
      });

      if (!saveResult.success) {
        toast.error(saveResult.message || "Failed to save OTP data.");
        setLoading(false);
        return;
      }

      const query = encodeURIComponent(email);
      toast.success("OTP sent to your email!");
      setTimeout(
        () => router.push(`/email-verification?message=${query}`),
        1000,
      );
    } catch (error: unknown) {
      toast.error("Something went wrong!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg relative overflow-hidden p-4">
      <Toaster />

      <div className="relative z-10 w-full max-w-md bg-app-sidebar rounded-2xl shadow-2xl border border-app-dark p-8 sm:p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-app-text-bright mb-2">
            Create an account
          </h2>
          <p className="text-app-text-muted">
            Sign up to get started
          </p>
        </div>

        <div className="space-y-5">
          {/* Username */}
          <div>
            <label className="text-sm font-bold text-app-text-muted uppercase tracking-wide mb-2 block">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. jassi"
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-app-input text-app-text-bright border border-transparent rounded-lg py-3 px-4 focus:border-app-brand focus:ring-1 focus:ring-app-brand outline-none transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-bold text-app-text-muted uppercase tracking-wide mb-2 block">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-app-input text-app-text-bright border border-transparent rounded-lg py-3 px-4 focus:border-app-brand focus:ring-1 focus:ring-app-brand outline-none transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-bold text-app-text-muted uppercase tracking-wide mb-2 block">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-app-input text-app-text-bright border border-transparent rounded-lg py-3 px-4 focus:border-app-brand focus:ring-1 focus:ring-app-brand outline-none transition"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full bg-app-brand hover:bg-app-brand-hover text-white font-semibold py-3 rounded-lg shadow-md transition-all mt-6 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating Account..." : "Continue"}
          </button>
        </div>

        {/* Redirect */}
        <div className="text-left mt-4">
          <p className="text-app-text-muted text-sm">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-app-brand font-semibold hover:underline transition"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
