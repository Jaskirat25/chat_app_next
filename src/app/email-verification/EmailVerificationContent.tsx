"use client";

import React, { useState } from "react";
import OTPInput from "react-otp-input";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import api from "../../../lib/axios";

export default function EmailVerificationContent() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const params = useSearchParams();
  const router = useRouter();
  const mail = params.get("message");

  const handleVerify = async () => {
    setLoading(true);
    try {
      const data = await api.post("/api/email-verification", {
        email: mail,
        otp,
      });

      if (data.status === 200) {
        try {
          const user = await api.post("/api/register", data.data.data);

          if (user.status === 200) {
            toast.success("verification successful");
            router.push("/");
          } else {
            toast.error("registration failed");
          }
        } catch (error) {
          if (error instanceof Error) {
            toast.error(error.message);
            console.log(error.message);
          }
        }
      } else {
        toast.error("Invalid OTP");
      }
    } catch (error) {
      console.error("Verification failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      alert("OTP resent to your email");
    } catch (error) {
      console.error("Resend failed:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg relative overflow-hidden p-4">
      <div className="relative z-10 w-full max-w-md bg-app-sidebar rounded-2xl shadow-2xl border border-app-dark p-8 sm:p-10 flex flex-col items-center">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-app-text-bright mb-2">
            Verify Email
          </h2>
          <p className="text-app-text-muted text-sm">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        <OTPInput
          inputStyle="text-app-text-bright bg-app-input border border-transparent focus:border-app-brand focus:ring-1 focus:ring-app-brand outline-none rounded-lg w-12 h-12 sm:w-14 sm:h-14 mx-1 transition-all"
          containerStyle="flex justify-center mb-6 w-full"
          value={otp}
          onChange={setOtp}
          numInputs={6}
          renderSeparator={<span></span>}
          renderInput={(props) => <input {...props} />}
        />

        <button
          onClick={handleVerify}
          disabled={loading || otp.length < 6}
          className={`w-full bg-app-brand hover:bg-app-brand-hover text-white font-semibold py-3 rounded-lg shadow-md transition-all ${
            loading || otp.length < 6 ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        <div className="text-center mt-6">
          <p className="text-app-text-muted text-sm">
            Didn't receive code?{" "}
            <button
              onClick={handleResend}
              className="text-app-brand font-semibold hover:underline transition"
            >
              Resend
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}