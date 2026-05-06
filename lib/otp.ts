"use client";

import emailjs from "emailjs-com";

export async function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(email: string) {
  const otp = await generateOtp();

  try {
    const response = await emailjs.send(
      process.env.NEXT_PUBLIC_SERVICE_ID!,
      process.env.NEXT_PUBLIC_TEMPLATE_ID!,
      { email, passcode: otp },
      process.env.NEXT_PUBLIC_EMAILJS_KEY!,
    );

    if (response.status === 200) {
      return { success: true, otp };
    }

    console.log("Response:", response);
    return { success: false, message: "Unexpected response" };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, message: "Failed to send OTP" };
  }
}

export async function saveOtpData(data: {
  username: string;
  email: string;
  password: string;
  otp: { success: boolean; otp?: string };
}) {
  try {
    const response = await fetch("/api/save-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      return {
        success: false,
        message: body?.error || body?.message || "Failed to save OTP data",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to save OTP data:", error);
    return { success: false, message: "Failed to save OTP data" };
  }
}

export async function changePassword(email: string) {
  try {
    const response = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || "Failed to create reset token",
      };
    }

    const token = data.token;
    const emailResponse = await emailjs.send(
      process.env.NEXT_PUBLIC_SERVICE_ID!,
      process.env.NEXT_PUBLIC_PASSWORD_TEMPLATE_ID!,
      {
        email,
        link: `${process.env.NEXT_PUBLIC_PASSWORD_URL!}${token}`,
      },
      process.env.NEXT_PUBLIC_EMAILJS_KEY!,
    );

    if (emailResponse.status === 200) {
      return { success: true };
    }

    return {
      success: false,
      message: "Unexpected response when sending reset email",
    };
  } catch (error) {
    console.error("Password reset email failed:", error);
    return { success: false, message: "Failed to send password reset email" };
  }
}
