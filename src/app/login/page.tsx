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
    <div className="flex min-h-screen items-center justify-center bg-app-bg relative overflow-hidden p-4">
      <Toaster />

      <div className="relative z-10 w-full max-w-md bg-app-sidebar rounded-2xl shadow-2xl border border-app-dark p-8 sm:p-10">
        {!forgotPassword && (
          <button className="flex items-center text-app-text-muted hover:text-app-text transition-colors mb-6" onClick={() => setForgot(true)}>
            <i className="fa-solid fa-arrow-left mr-2"></i> Back
          </button>
        )}

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-app-text-bright mb-2">
            {forgotPassword ? "Welcome back!" : "Verify email"}
          </h2>
          <p className="text-app-text-muted">
            {forgotPassword ? "We're so excited to see you again!" : "Check your email for the recovery link"}
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-bold text-app-text-muted uppercase tracking-wide mb-2 block">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="e.g jas@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-app-input text-app-text-bright border border-transparent rounded-lg py-3 px-4 focus:border-app-brand focus:ring-1 focus:ring-app-brand outline-none transition"
              />
            </div>
          </div>

          {forgotPassword ? (
            <div>
              <label className="text-sm font-bold text-app-text-muted uppercase tracking-wide mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-app-input text-app-text-bright border border-transparent rounded-lg py-3 px-4 focus:border-app-brand focus:ring-1 focus:ring-app-brand outline-none transition"
                />
              </div>
              <div className="text-left mt-2">
                <button
                  onClick={() => {
                    setForgot(false);
                    setTimer(0);
                  }}
                  className="text-sm text-app-brand hover:underline font-medium"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          ) : null}

          {forgotPassword ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full bg-app-brand hover:bg-app-brand-hover text-white font-semibold py-3 rounded-lg shadow-md transition-all mt-6 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing in..." : "Log In"}
            </button>
          ) : (
            <button
              onClick={handleForgetPassword}
              disabled={loading || timer > 0}
              className={`w-full bg-app-brand hover:bg-app-brand-hover text-white font-semibold py-3 rounded-lg shadow-md transition-all mt-6 ${
                loading || timer > 0 ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading
                ? "Sending email..."
                : timer > 0
                  ? `Sent (${timer}s)`
                  : "Send Reset Link"}
            </button>
          )}
        </div>

        <div className="text-left mt-4">
          <p className="text-app-text-muted text-sm">
            Need an account?{" "}
            <button
              onClick={() => redirect("/register")}
              className="text-app-brand font-semibold hover:underline transition"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
