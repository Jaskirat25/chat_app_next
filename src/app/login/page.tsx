"use client";
import React, { useState, useEffect } from "react";
import api from "../../../lib/axios";
import { redirect } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { changePassword } from "../../../lib/otp";
import { isValidEmail } from "../../../lib/email-check";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotPassword, setForgot] = useState(true);

  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) {
      return;
    }
    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleForgetPassword = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setLoading(true);
    e.preventDefault();
    try {
      if (isValidEmail(email)) {
        const response = await changePassword(email);
        if (response.success) {
          setTimer(30); // Start countdown
          toast.success(`Link sent to ${email} successfully`);
        }
      }
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/login", { email, password });

      if (res.status === 201) {
        toast.success("Login successful!");
        setTimeout(() => redirect("/"), 1000);
      } else {
        toast.error(res.data.message);
      }
    } catch (error: unknown) {
      toast.error("Something went wrong!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 relative overflow-hidden">
      <Toaster />

      {/* Background Circle */}
      <div className="absolute top-[-150px] left-[-200px] w-[1300px] h-[1100px] bg-teal-400 rounded-full"></div>

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-lg p-10">
        {!forgotPassword && (
          <button className="flex" onClick={() => setForgot(true)}>
            <img
              className="w-20 h-10 -ml-7 mb-1.5 -mt-5"
              src="/arrow-left.svg"
              alt=""
            />
          </button>
        )}

        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          {forgotPassword ? "Sign in" : "Verify email"}
        </h2>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="e.g jas@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 pl-3 focus:border-teal-500 focus:ring-1 focus:ring-teal-400 outline-none transition"
              />
              <span className="absolute left-3 top-3.5 text-gray-400">
                <i className="fa-regular fa-envelope"></i>
              </span>
            </div>
          </div>

          {forgotPassword ? (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-10 focus:border-teal-500 focus:ring-1 focus:ring-teal-400 outline-none transition"
                />
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <i className="fa-solid fa-lock"></i>
                </span>
              </div>
              <div className="text-right mt-2">
                <button
                  onClick={() => {
                    setForgot(false);
                    setTimer(0);
                  }}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          ) : null}

          {forgotPassword ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg shadow-md transition-all ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          ) : (
            <button
              onClick={handleForgetPassword}
              disabled={loading || timer > 0}
              className={`w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg shadow-md transition-all ${
                loading || timer > 0 ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading
                ? "Sending email..."
                : timer > 0
                  ? `Sent (${timer}s)`
                  : "Send"}
            </button>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Don’t have an account?{" "}
            <button
              onClick={() => redirect("/register")}
              className="text-teal-600 font-semibold hover:text-teal-700 transition"
            >
              Sign up →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
