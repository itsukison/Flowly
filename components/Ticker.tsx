'use client';

import React from 'react';

const tickerItems = ['Strategy', 'UI/UX', 'Prototyping', 'Animation', 'Research', 'Design systems'];

const Ticker = () => {
  return (
    <div className="w-[100px] h-[76px] bg-[#262626] rounded-3xl overflow-hidden shadow-[12px_12px_20px_-2px_rgba(0,0,0,0.09),6px_6px_10px_-2px_rgba(0,0,0,0.32)] flex items-center justify-center flex-shrink-0">
      <div className="flex flex-col items-center gap-2 animate-ticker">
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <span key={index} className="text-[11px] text-white whitespace-nowrap px-2 py-1">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
