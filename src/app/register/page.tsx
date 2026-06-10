"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { saveOtpData, sendOtp } from "../../../lib/otp";
import { isValidEmail } from "../../../lib/email-check";
import Hash from "../../../lib/hash";
import { Eye, EyeOff, LockKeyhole, Mail, MessageCircle, User } from "lucide-react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#04060d] px-4 py-10 text-white">
      <Toaster position="top-center" />

      {/* Decorative gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(96,165,250,0.16),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_52%_86%,rgba(79,70,229,0.13),transparent_34%),linear-gradient(180deg,#08111f_0%,#04060d_58%,#02030a_100%)]" />
      <div className="pointer-events-none absolute left-[12%] top-[22%] h-28 w-28 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[18%] right-[14%] h-36 w-36 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/40 to-transparent" />

      <section className="panel-enter relative z-10 w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-white/[0.07] text-violet-200 shadow-[0_0_34px_rgba(139,92,246,0.18)] backdrop-blur-md">
            <MessageCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-normal">
            <span className="text-white">Quick</span>
            <span className="bg-gradient-to-r from-violet-200 to-blue-200 bg-clip-text text-transparent">
              Chat
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Real-time. Connected. Limitless.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.36),0_0_44px_rgba(99,102,241,0.12)] backdrop-blur-xl sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-normal text-white">
              Create an account
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Sign up to get started
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="username"
                  type="text"
                  value={username}
                  placeholder="e.g. jassi"
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.07] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-violet-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-violet-400/10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.07] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-violet-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-violet-400/10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.07] py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-violet-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-violet-400/10"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 rounded-lg p-1.5 text-slate-500 transition-colors -translate-y-1/2 hover:text-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`mt-2 w-full rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(99,102,241,0.32)] focus:outline-none focus:ring-4 focus:ring-violet-300/25 ${
                loading ? "cursor-not-allowed opacity-70 hover:translate-y-0" : ""
              }`}
            >
              {loading ? "Creating Account..." : "Continue"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-semibold text-violet-200 transition-colors hover:text-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-300/40 focus:ring-offset-2 focus:ring-offset-[#070b12]"
            >
              Log In
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
