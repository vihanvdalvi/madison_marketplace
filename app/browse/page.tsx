import { EmblaOptionsType } from "embla-carousel";
import EmblaCarousel from "./EmblaCarousel";
import { getData } from "../helpers/get-image-data";
export default async function SearchPage() {
  const OPTIONS: EmblaOptionsType = { loop: true };

  const electronicsData = await getData(["electronics"]);
  const furnitureData = await getData(["furniture", "lighting"]);
  const clothingData = await getData(["clothing"]);
  const otherData = await getData(
    ["electronics", "furniture", "clothing", "lighting"],
    true
  );

  let electronicsComponent = (
    <p className="text-gray-500">No electronics found.</p>
  );

  let furnitureComponent = <p className="text-gray-500">No furniture found.</p>;

  let clothingComponent = <p className="text-gray-500">No clothing found.</p>;
  let otherComponent = <p className="text-gray-500">No items found.</p>;

  if (electronicsData.length !== 0) {
    electronicsComponent = (
      <EmblaCarousel slides={electronicsData} options={OPTIONS}></EmblaCarousel>
    );
  }

  if (furnitureData.length !== 0) {
    furnitureComponent = (
      <EmblaCarousel slides={furnitureData} options={OPTIONS}></EmblaCarousel>
    );
  }

  if (clothingData.length !== 0) {
    clothingComponent = (
      <EmblaCarousel slides={clothingData} options={OPTIONS}></EmblaCarousel>
    );
  }

  if (otherData.length !== 0) {
    otherComponent = (
      <EmblaCarousel slides={otherData} options={OPTIONS}></EmblaCarousel>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="searchBar"></div>
      <div className="flex flex-col items-center p-4 md:p-20 gap-y-10 md:gap-y-14 w-screen">
        <div className="w-full">
          <h1 className="mb-2 font-bold text-2xl">Electronics</h1>
          {electronicsComponent}
        </div>
        <div className="w-full">
          <h1 className="mb-2 font-bold text-2xl">Furniture</h1>
          {furnitureComponent}
        </div>
        <div className="w-full">
          <h1 className="mb-2 font-bold text-2xl">Clothing</h1>
          {clothingComponent}
        </div>
        <div className="w-full mb-10">
          <h1 className="mb-2 font-bold text-2xl">Other</h1>
          {otherComponent}
        </div>
      </div>
    </div>
  );
}
