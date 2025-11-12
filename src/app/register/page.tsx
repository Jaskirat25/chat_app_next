"use client";
import { useState } from "react";
import api from "../../../lib/axios";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { sendOtp } from "../../../lib/otp";
import redis from "../../../lib/redis";
import Hash from "../../../lib/hash";
import { isValidEmail } from "../../../lib/email-check";

export default function Login() {
  const [username, setUsername] = useState("");
  // unique username function to add
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let hashedPassword;
    try {
      if (password) {
        hashedPassword = await Hash(password);
      } else toast.error("Password is required");
      if (isValidEmail(email)) {
        const otp=await sendOtp(email);
        const data = {
          username,
          email,
          password: hashedPassword,
          otp
        };
        await redis.set(`otp${email}`, data);
        const query = encodeURIComponent(email);
        router.push(`/email-verification?message=${query}`);
      } else toast.error("enter a valid email");
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.error("Unknown error", error);
      }
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Toaster />
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Register
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username...."
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={() => router.push("/login")}
              className="text-blue-400"
            >
              Login ➡️
            </button>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-500 p-3 text-white transition hover:bg-blue-600 focus:outline-none"
            onClick={handleSubmit}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
