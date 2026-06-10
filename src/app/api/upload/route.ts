import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  const userId = decoded.id as string;

  try {
    console.log("Cloudinary config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "***" : "NOT SET",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "***" : "NOT SET",
    });

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: `chat-app/${userId}`,
          public_id: `${Date.now()}-${file.name.split(".")[0]}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      uploadStream.end(buffer);
    });

    const uploadResult = result as any;

    return NextResponse.json(
      {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        type: uploadResult.resource_type,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
