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
      <div className="w-full overflow-clip" ref={emblaRef}>
        {/* counter the slide horizontal padding so slides align flush on mobile */}
        <div className="flex -mx-4 md:-ml-4 backface-hidden touch-pan-y">
          {slides.map((data) => (
            <div
              className="flex flex-col flex-none w-full px-4 md:w-[150px] lg:w-[200px] overflow-hidden"
              key={data.id}
            >
              <CldImage
                src={data.picture}
                width={data.width}
                height={data.height}
                alt={data.description}
                quality={"auto"}
                sizes={"25vw"}
                format="auto"
                rawTransformations={["ar_1,c_crop"]}
                className="md:aspect-auto w-full block min-h-0 object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
              />
              <div className="flex flex-col w-full h-fit">
                <div className="md:aspect-auto pt-2 w-full text-lg font-semibold text-gray-700">
                  {data.description
                    .split(" ")
                    .map(
                      (word: string) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ")}
                </div>
                <div className="text-md text-gray-500">
                  {data.price ? `$${data.price}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 hidden md:flex items-center justify-between">
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
