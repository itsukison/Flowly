'use client';

import React from 'react';
import Image from 'next/image';

const Slideshow = () => {
  return (
    <div className="w-[100px] h-[76px] bg-[#09090B] rounded-3xl overflow-hidden flex-shrink-0 shadow-[12px_12px_20px_-2px_rgba(0,0,0,0.09),6px_6px_10px_-2px_rgba(0,0,0,0.32),3px_3px_5px_-1px_rgba(0,0,0,0.41)]">
      <div className="flex h-full animate-slideshow">
        <Image src="/slideshow-img1-e488bf.png" alt="Design work 1" width={100} height={76} className="w-[100px] h-[76px] object-cover flex-shrink-0" />
        <Image src="/slideshow-img2-3cca27.png" alt="Design work 2" width={100} height={76} className="w-[100px] h-[76px] object-cover flex-shrink-0" />
        <Image src="/slideshow-img3-3b57bc.png" alt="Design work 3" width={100} height={76} className="w-[100px] h-[76px] object-cover flex-shrink-0" />
      </div>
    </div>
  );
};

export default Slideshow;
