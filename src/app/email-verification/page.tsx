"use client";
import React, { useState } from "react";
import OTPInput from "react-otp-input";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import api from "../../../lib/axios";

const page = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const router = useRouter();
  const mail = params.get("message");
  const handleVerify = async () => {
    setLoading(true);
    try {
      // resend timer
      const data = await api.post("/api/email-verification", {
        email: mail,
        otp,
      });
      if (data.status == 200) {
        try {
          const user = await api.post("/api/register", data.data.data);
          if (user.status == 200) {
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
      // Add resend logic here
      alert("OTP resent to your email");
    } catch (error) {
      console.error("Resend failed:", error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-300 to-blue-500">
      <div className="w-full max-w-sm p-8 flex flex-col gap-6 justify-center items-center bg-white rounded-xl shadow-lg">
        <h1 className="font-bold text-3xl text-gray-800">
          Account Verification
        </h1>
        <p className="text-gray-600 text-sm">
          Enter the 6-digit code sent to your email
        </p>
        <OTPInput
          inputStyle={
            "text-black border-2 border-gray-300 rounded-lg w-12 h-12"
          }
          containerStyle={"text-3xl p-2 gap-2 flex justify-center"}
          placeholder="000000"
          value={otp}
          onChange={setOtp}
          numInputs={6}
          renderSeparator={<span></span>}
          renderInput={(props) => <input {...props} />}
        />
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 rounded-lg p-3 text-white font-semibold transition duration-200"
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>
        <button
          onClick={handleResend}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition duration-200"
        >
          Resend Code
        </button>
      </div>
    </div>
  );
};

export default Page;

// const page = () => {
//   const [otp,setOtp] = useState("");
//   const handleSend = async () => {
//     const generatedOtp= await redis.get("otp");

//   };
//    return (
//     <div className="flex justify-center items-center h-screen bg-blue-300 z-20 shadow-black shadow-2xl ">
//      <div className="w-1/4 h-1/2 flex flex-col gap-7 justify-center items-center bg-zinc-200 rounded-lg">
//       <h1 className="font-bold text-2xl">Account Verification</h1>
//       <h1>ENTER OTP</h1>
//     <OTPInput
//       inputStyle={"text-black border-none"}
//       containerStyle={"text-3xl p-2 rounded-lg bg-zinc-300"}
//       placeholder="000000"
//       value={otp}
//       onChange={setOtp}
//       numInputs={6}
//       renderSeparator={<span></span>}
//       renderInput={(props) => <input {...props} />}
//       />
//       <button className="bg-emerald-600 rounded-lg p-3 text-white ">Verify Code</button>
//       <button className="text-blue-400 " >Resend Code</button>
//       </div>
//       </div>
//   );
// };

// export default page;
