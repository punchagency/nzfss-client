import React from "react";

const SledDog = () => {
  return (
    <div className="w-full flex justify-center items-center flex-col gap-y-[24px] py-[60px] lg:py-[144px] px-4 lg:px-[48px]">
      <div className="w-full lg:w-[70vw] flex flex-col items-center">
        <h3 className="text-[32px] sm:text-[42px] lg:text-[4.3750vw] font-[700]  mb-[24px] text-center">
          Sled dog racing in New Zealand
        </h3>

        <div className="flex flex-col text-[#4F4F4F] w-[82%] gap-y-[24px]">
          <p className="text-[16px] sm:text-[18px] lg:text-[1.25vw]  font-[400] leading-[1.5] lg:leading-[1.749vw] text-center">
            The NZFSS is the governing body under which all associated clubs come
            together in a Federation. The NZFSS provides a structured constitution and rule set
            for events as well as a point and Championship award programme.
          </p>

          <p className="text-[16px] sm:text-[18px] lg:text-[1.25vw]  font-[400] leading-[1.5] lg:leading-[1.749vw] text-center">
            Dog powered sports is an Autumn and Winter sport and in New Zealand,
            we are fortunate to enjoy training and races in both Dryland and Snow.
            Traditionally, arctic breeds like the Siberian Husky or Alaskan
            Malamute have been associated with Dog Powered Sport. Over the last 20
            years, a continuing shift towards all dog breeds participating has
            been seen and it makes our sport more inclusive.
          </p>
        </div>
      </div>

      <div className="w-full pt-[30px] lg:pt-[54px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-x-[26px]">
          <div>
            <video 
              src="/videos/ld.mp4"
              autoPlay 
              muted 
              loop 
              playsInline
              controls
              className="w-full lg:w-[46.875vw] aspect-video lg:h-[26.042vw] rounded-lg lg:rounded-[1.25vw] bg-transparent object-cover"
            />
          </div>
          <div className="mt-4 lg:mt-0">
            <video 
              src="/videos/rd.mp4"
              autoPlay 
              muted 
              loop 
              playsInline
              controls
              className="w-full lg:w-[46.875vw] aspect-video lg:h-[26.042vw] rounded-lg lg:rounded-[1.25vw] bg-transparent object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SledDog;
