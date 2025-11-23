import { getDataFromId } from "@/app/helpers/get-image-data";
import PicInfoPage from "./pic-info";

export default async function ListingPage({
  params,
}: {
  params: { id: String };
}) {
  let id = (await params).id;
  let imageData: {
    id: any;
    picture: any;
    width: any;
    height: any;
    caption: any;
    description: any;
    price: any;
  } = await getDataFromId(id.toString());

  if (imageData.id == "image not found") {
    return;
  }

  return (
    <div className="flex flex-col mt-10 md:flex-row h-full w-screen gap-y-10 justify-center items-center text-center md:text-start md:m-20 md:gap-x-10">
      <PicInfoPage imageData={imageData} />
      <div className="flex flex-col md:px-20 h-full w-screen md:w-full md:pr-40 justify-center items-center">
        <div className="text-3xl w-full md:text-4xl text-black font-bold self-start">
          {imageData.description
            .split(" ")
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ")}
        </div>
        <div className="text-2xl md:text-3xl px-5 md:px-0 font-semibold text-gray-800 mb-2">
          {imageData.caption}
        </div>
        <div className="text-2xl md:text-3xl font-semibold text-center my-10">
          USER INFO PLACEHOLDER
        </div>
        <button>
          <div className="text-3xl md:text-4xl p-6 px-8 bg-[#C41E3A] rounded-2xl mt-5 md:mt-20 hover:bg-[#9E1A2D] text-black font-bold transition-colors duration-300 w-fit text-center">
            BUY FOR{" "}
            {imageData.price ? `$${imageData.price}` : "Price not available"}
          </div>
        </button>
      </div>
    </div>
  );
}
