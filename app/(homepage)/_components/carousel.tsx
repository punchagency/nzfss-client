import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function CarouselSize() {
  return (
    <div>
       <Carousel
      opts={{
        align: "center",
      }}
      className="w-full h-auto max-w-[1726px] max-h-[666px]"
    >
      <CarouselContent className="gap-x-6 flex w-full">
        {Array.from({ length: 11 }).map((_, index) => (
          <CarouselItem key={index} className="md:basis-1/2 xl:basis-1/3">
            <div className="">
              <Card className=" w-full 3xl:xl:w-[500px] flex  h-[666px] max-w-[559px]">
                <CardContent className=" h-full w-full overflow-hidden">
                  <div className="h-[331px] w-full bg-red-500">

                  </div>

                  <div className="flex flex-1 w-full ">
                    hello
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
    </div>
   
  )
}
