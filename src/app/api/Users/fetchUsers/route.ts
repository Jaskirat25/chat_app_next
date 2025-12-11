import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const {user_id}=await request.json();
    
    const userWithFriends = await Prisma.user.findFirst({
      where: { id: user_id },
      include: {
        friendshipsA: {
          include: { userB: true }
        },
        friendshipsB: {
          include: { userA: true }
        }
      }
    });
  
    
    if(userWithFriends){
  const friends = [
    ...userWithFriends?.friendshipsA.map(f => f.userB),
    ...userWithFriends?.friendshipsB.map(f => f.userA)
  ];
  return NextResponse.json({data:friends , status:200});
}
else {
  return NextResponse.json({ message: "User not found" }, { status: 404 });
}

  }catch(error){
    return NextResponse.json({message:error})
  }
}
