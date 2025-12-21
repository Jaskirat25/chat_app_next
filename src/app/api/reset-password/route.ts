import { NextRequest, NextResponse } from "next/server";
import redis from "../../../../lib/redis";
import  prisma  from "../../../../lib/prisma";
import { isValidEmail } from "../../../../lib/email-check";
import Hash from "../../../../lib/hash";

export async function POST(req: NextRequest) {
 try{
        const { token, password } = await req.json();
        const email=(await redis.get(`${token}`) )as string;
        if (!password) {
            return NextResponse.json({ message: "password not found", status: 400 });
  }
  if (!email) {
    return NextResponse.json({ message: "email not found", status: 400 });
  }
  const hashedPassword = await Hash(password);
  if (isValidEmail(email)) {
    const res = await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        password: hashedPassword,
      },
    });
    if(res){
        await redis.del(`${token}`);
        return NextResponse.json({message:"Password changed successfully",status:200})
    }else return NextResponse.error();
}
}
catch(error){
console.log(error)
    return NextResponse.json({message:error})
}
}
