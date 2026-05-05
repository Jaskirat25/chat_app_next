"use client";
import { useState } from "react";
import api from "../../../lib/axios";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { sendOtp } from "../../../lib/otp";
import redis from "../../../lib/redis";
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
      const data = { username, email, password: hashedPassword, otp };

      await redis.set(`otp${email}`, data);
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
    <div className="flex min-h-screen items-center justify-center bg-gray-200 relative overflow-hidden">
      <Toaster />

      {/* Background Circles */}
      <div className="absolute top-[-150px] left-[-600px] w-[1300px] h-[1100px] bg-teal-400 rounded-full"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[700px] h-[700px] bg-teal-300 rounded-full opacity-70"></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-lg p-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Create Account
        </h2>
        <p className="text-gray-600 mb-6">Sign up to get started</p>

        <div className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="e.g. jassi"
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:border-teal-500 focus:ring-1 focus:ring-teal-400 outline-none transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:border-teal-500 focus:ring-1 focus:ring-teal-400 outline-none transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:border-teal-500 focus:ring-1 focus:ring-teal-400 outline-none transition"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg shadow-md transition-all ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          {/* Redirect */}
          <div className="text-center mt-4">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-teal-600 font-semibold hover:text-teal-700 transition"
              >
                Login →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
