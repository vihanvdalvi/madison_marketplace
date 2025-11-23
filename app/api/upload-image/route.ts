import { NextRequest, NextResponse } from "next/server";
import { db } from "../../helpers/firebase";
import { Timestamp } from "firebase-admin/firestore";
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
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
    const { image, tags, price, pickup_location, userEmail } =
      (await request.json()) as {
        image: string;
        tags: Tags;
        price?: number | null;
        pickup_location?: string;
        userEmail: string | null;
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
    if (userEmail != null) contextParts.push(`userEmail=${userEmail}`);
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
      const utcDateString = data.created_at; // e.g., "2023-10-05T12:34:56Z"
      const createdAt = new Date(utcDateString);

      const firebaseStamp = Timestamp.fromDate(createdAt);

      await db
        .collection("price-directory")
        .doc(data.public_id.toString().replace("madison-marketplace/", ""))
        .set({
          price: price ?? null,
          pickup_location: pickup_location ?? null,
          created_at: firebaseStamp,
          categories: tags.description,
          main_category: tags.main_category,
          userEmail: userEmail,
          sold: false,
        });

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
