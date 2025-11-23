"use client";

import { CldImage } from "next-cloudinary";

export default function PicInfoPage({
  imageData,
}: {
  imageData: {
    id: any;
    picture: any;
    width: any;
    height: any;
    caption: any;
    description: any;
    price: any;
  };
}) {
  return (
    <div className="flex flex-col h-full w-1/2 border-6 rounded-2xl">
      <CldImage
        src={imageData.id}
        width={imageData.width}
        height={imageData.height}
        alt={imageData.caption}
        quality={"auto"}
        sizes={"50vw"}
        format="auto"
        rawTransformations={["ar_1,c_crop"]}
        className="w-[500px] rounded-lg object-cover"
      ></CldImage>
    </div>
  );
}
