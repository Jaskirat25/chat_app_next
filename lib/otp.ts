"use client"
// solve this client server panga

import emailjs from "emailjs-com";
import redis from "./redis";

export async function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(email: string) {
  const otp = await generateOtp();

  try {
    const response = await emailjs.send(
      process.env.NEXT_PUBLIC_SERVICE_ID!,
      process.env.NEXT_PUBLIC_TEMPLATE_ID!,
      { email: email, passcode: otp },
      process.env.NEXT_PUBLIC_EMAILJS_KEY!
    );

    if (response.status === 200) {
     
      return { success: true, otp };
    } else {
      console.log("Response:", response);
      return { success: false, message: "Unexpected response" };
    }
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, message: "Failed to send OTP" };
  }
}
export async function changePassword(email:string){
  try{
    const token=await generateOtp();
    console.log(token)
    await redis.set(token,email);//redis error
   const response = await emailjs.send(
      process.env.NEXT_PUBLIC_SERVICE_ID!,
      process.env.NEXT_PUBLIC_PASSWORD_TEMPLATE_ID!,
      { email: email,link:`${process.env.NEXT_PUBLIC_PASSWORD_URL!}${token}`},
      process.env.NEXT_PUBLIC_EMAILJS_KEY!
    );
    console.log(response);
      if (response.status === 200) {
      console.log("Email sent successfully");
      return { success: true};
    } else {
      console.log("Response:", response);
      return { success: false, message: "Unexpected response" };
    }
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, message: "Failed to send OTP" };
  }}

