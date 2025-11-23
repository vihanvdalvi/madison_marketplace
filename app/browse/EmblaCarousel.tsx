"use client";

import React from "react";
import { EmblaOptionsType } from "embla-carousel";
import { DotButton, useDotButton } from "./EmblaCarouselDotButton";
import {
  PrevButton,
  NextButton,
  usePrevNextButtons,
} from "./EmblaCarouselArrowButtons";
import useEmblaCarousel from "embla-carousel-react";
import { CldImage } from "next-cloudinary";
import Link from "next/dist/client/link";

type PropType = {
  slides: {
    id: any;
    picture: any;
    width: any;
    height: any;
    caption: any;
    description: any;
    price: any;
  }[];
  options?: EmblaOptionsType;
};

const EmblaCarousel: React.FC<PropType> = (props) => {
  const { slides, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <section className="w-full items-center mb-0">
      <div className="w-full" ref={emblaRef}>
        {/* counter the slide horizontal padding so slides align flush on mobile */}
        <div className="flex -ml-4 backface-hidden touch-pan-y">
          {slides.map((data) => (
            <Link
              key={data.id}
              href={`/listings/${data.id.replace("madison-marketplace/", "")}`}
            >
              <div className="flex flex-col flex-none w-full md:w-[150px] lg:w-[200px] px-4 md:px-2 transform-gpu transition hover:scale-105">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl overflow-hidden shadow-md border border-white/20">
                  <div className="relative w-full h-40 bg-gradient-to-br from-white/50 to-white/30">
                    <CldImage
                      src={data.picture}
                      width={data.width}
                      height={data.height}
                      alt={data.description}
                      quality={"auto"}
                      sizes={"25vw"}
                      format="auto"
                      rawTransformations={["ar_1,c_crop"]}
                      className="w-full h-full object-cover rounded-t-xl"
                    />
                    <div className="absolute left-3 bottom-3 bg-white/70 text-sm font-semibold text-gray-900 px-3 py-1 rounded-full shadow">
                      {data.price ? `$${data.price}` : "—"}
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {data.description
                        .split(" ")
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        )
                        .join(" ")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {data.caption}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-1 hidden md:flex items-center justify-between">
        <div className="flex gap-3">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>

        <div className="hidden items-center md:flex">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              selected={index === selectedIndex}
              onClick={() => onDotButtonClick(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EmblaCarousel;
