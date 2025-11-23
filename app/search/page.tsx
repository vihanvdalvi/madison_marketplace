import { EmblaOptionsType } from "embla-carousel";
import EmblaCarousel from "./EmblaCarousel";
export default function SearchPage() {
  const OPTIONS: EmblaOptionsType = { loop: true };
  const SLIDE_COUNT = 20;
  const SLIDES = Array.from(Array(SLIDE_COUNT).keys());
  return (
    <div className="flex flex-col items-center p-20 gap-y-20 w-screen">
      <div className="w-full">
        <h1 className="mb-2 font-bold text-2xl">Electronics</h1>
        <EmblaCarousel slides={SLIDES} options={OPTIONS}></EmblaCarousel>
      </div>
      <div className="w-full">
        <h1 className="mb-2 font-bold text-2xl">Furniture</h1>
        <EmblaCarousel slides={SLIDES} options={OPTIONS}></EmblaCarousel>
      </div>{" "}
      <div className="w-full">
        <h1 className="mb-2 font-bold text-2xl">Clothing</h1>
        <EmblaCarousel slides={SLIDES} options={OPTIONS}></EmblaCarousel>
      </div>{" "}
    </div>
  );
}
