"use client";

import { Suspense } from "react";
import EmailVerificationContent from "./EmailVerificationContent";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <EmailVerificationContent />
    </Suspense>
  );
}
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
