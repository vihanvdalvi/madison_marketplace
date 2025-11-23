import { NextRequest, NextResponse } from "next/server";

const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET!;

interface Tags {
  main_category: string;
  specific_item: string;
  color: string;
  material: string;
  description: string;
  price?: string | number;
  pickup_location?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { image, tags, price, pickup_location } = (await request.json()) as {
      image: string;
      tags: Tags;
      price?: number | null;
      pickup_location?: string;
    };

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      return NextResponse.json(
        { error: "Cloudinary credentials not configured" },
        { status: 500 }
      );
    }

    const base64Response = await fetch(`data:image/jpeg;base64,${image}`);
    const blob = await base64Response.blob();

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    // Build context string (Cloudinary supports key=value pairs separated by '|')
    const contextParts = [
      `alt=${tags.specific_item}`,
      `caption=${tags.description}`,
    ];
    if (pickup_location != null)
      contextParts.push(`pickup_location=${pickup_location}`);
    if (price !== undefined && price !== null)
      contextParts.push(`price=${price}`);
    formData.append("context", contextParts.join("|"));

    // Build tags string; include price and pickup_location as tags if provided
    const tagParts = [tags.main_category, tags.color, tags.material];
    // include pickup_location if provided
    if (pickup_location != null) tagParts.push(pickup_location);
    if (price !== undefined && price !== null) tagParts.push(String(price));
    formData.append("tags", tagParts.filter(Boolean).join(","));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      return NextResponse.json({
        url: data.secure_url,
        publicId: data.public_id,
      });
    } else {
      throw new Error("Upload failed");
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
