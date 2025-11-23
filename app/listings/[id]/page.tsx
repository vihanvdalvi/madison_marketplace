import { getDataFromId } from "@/app/helpers/get-image-data";
import PicInfoPage from "./pic-info";
import Payments from "@/app/payment/page";
import PriceTrends from "@/app/listings/[id]/price-trends";
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
    userEmail: any;
  } = await getDataFromId(id.toString());

  if (imageData.id == "image not found") {
    return;
  }

  return (
    <>
      <div className="flex flex-col mt-10 md:flex-row h-full w-full gap-y-8 justify-center items-center text-center md:text-start md:m-12 md:gap-x-10 px-4">
        <PicInfoPage imageData={imageData} />

        <div className="flex-1 flex flex-col md:px-8 h-full w-full md:w-1/2 md:pr-12 justify-center items-center">
          <div className="w-full bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30 animate-fade-in overflow-visible">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
              {imageData.description
                .split(" ")
                .map(
                  (word: string) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ")}
            </h1>

            <div className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
              {imageData.caption}
            </div>

            {imageData.userEmail && (
              <div className="text-sm text-gray-600 mb-6">
                Seller:{" "}
                <span className="font-medium text-gray-800">
                  {imageData.userEmail}
                </span>
              </div>
            )}

            <div className="mt-2 w-full flex justify-center">
              <div className="w-full max-w-md">
                <Payments itemId={imageData.id} price={imageData.price} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 px-4 py-4 max-w-5xl mx-auto">
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
          <PriceTrends
            category={imageData.description || imageData.caption || ""}
          />
        </div>
      </div>
    </>
  );
}
