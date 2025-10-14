import Hash from "../../../../lib/hash";
import { Prisma } from "../../../../lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
//add rate limiter
//email verification
export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();
    
    if (!password) {
      throw new Error("password is required");
    }
    const hashedPassword = await Hash(password);

    const user = await Prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET!
    );

    const response = NextResponse.json(
      { message: "User Created", user: { id: user.id, email: user.email } },
      { status: 201 }
    );

    response.cookies.set({
      name: "auth-token",
      value: token,
      maxAge: 60 * 60 * 7 * 24,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return response;

  } catch (error) {
    if (error instanceof Error)
      return NextResponse.json({ error: error.message });
    throw new Error("error in registration");
}
}