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
    <div className="flex flex-col h-full w-full md:w-1/2">
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/30 overflow-hidden animate-fade-in">
        <div className="w-full flex items-center justify-center">
          <CldImage
            src={imageData.id}
            width={imageData.width}
            height={imageData.height}
            alt={imageData.caption}
            quality={"auto"}
            sizes={"50vw"}
            format="auto"
            rawTransformations={["ar_1,c_crop"]}
            className="max-w-full md:w-[500px] rounded-lg object-cover shadow-inner"
          />
        </div>
      </div>
    </div>
  );
}
