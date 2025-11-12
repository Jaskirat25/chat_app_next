import redis from "../../../../lib/redis";
import { NextRequest, NextResponse } from 'next/server';
type redis_otp={
    username:string,
    email:string,
    password:string,
    otp:{
        success:boolean,
        otp:string
    }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }
    let key=`otp${email}`;
    const storedOtp:redis_otp|null = await redis.get(key);
    
     if (!storedOtp) {
    return NextResponse.json({ error: 'OTP not found or expired' }, { status: 404 });
     }
    if (storedOtp.otp.otp === otp) {
      await redis.set(`isVerified:${email}`, 'true');
      
      return NextResponse.json({ message: 'Verification successful',data:storedOtp }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}