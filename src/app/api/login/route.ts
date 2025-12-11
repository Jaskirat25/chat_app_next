import bcrypt from "bcryptjs";
import { Prisma } from "../../../../lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!password) {
      throw new Error("password is required");
    }
    
    const user = await Prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      return NextResponse.json({ message: "Need to register first!!" });
    }
    
  
    const pass = await bcrypt.compare(password, user.password);
    if (!pass) {
      return NextResponse.json({ message: "wrong password" });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.NEXT_PUBLIC_JWT_SECRET!
    );

    const response = NextResponse.json(
      { message: "User Logged in", user: { id: user.id, email: user.email } },
      { status: 201 }
    );

    response.cookies.set({
      name: "auth-token",
      value: token,
      maxAge: 60 * 60 * 7 * 24,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error) {
    if (error instanceof Error)
      return NextResponse.json({ error: error.message });
    throw new Error("error in login");
  }
}
