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

type PropType = {
  slides: number[];
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
    <section className="w-full items-center">
      <div className="overflow-hidden" ref={emblaRef}>
        {/* counter the slide padding (pl-4) so first slide aligns flush */}
        <div className="flex -ml-4 backface-hidden touch-pan-y">
          {slides.map((index) => (
            <div
              className="flex-none w-full md:w-1/2 lg:w-1/3 pl-4"
              key={index}
            >
              <div className="aspect-square md:aspect-auto md:h-76 w-full flex items-center justify-center bg-gray-100 rounded-lg shadow-sm text-4xl font-semibold text-gray-700">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 hidden md:flex items-center justify-between">
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
