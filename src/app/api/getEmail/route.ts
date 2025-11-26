import { NextRequest, NextResponse } from "next/server";
import redis from "../../../../lib/redis";

export async function POST(req:NextRequest){
    try {
    
        const {token}=await req.json();
        
        if(token){
            const email=await redis.get(`${token}`);
            if(email){
                return NextResponse.json({status:200,email});
            }else {
                return NextResponse.error();
            }
        }else{
            return NextResponse.json({message:"no token found"});
        }
        
    } catch (error) {
        if(error instanceof Error){
            console.log(error);
            return NextResponse.json({message:error.message})
        }
    }

}