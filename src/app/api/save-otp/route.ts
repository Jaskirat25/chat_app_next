import { NextRequest, NextResponse } from "next/server";
import redis from "../../../../lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, otp } = body;

    if (!username || !email || !password || !otp || !otp.success || !otp.otp) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const key = `otp${email}`;
    const data = { username, email, password, otp };

    await redis.set(key, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save OTP error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
