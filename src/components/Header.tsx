/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

const Header = React.memo(() => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-150 relative text-center sm:text-left">
    {/* Left Space/Spacer on desktop to balance the right logo */}
    <div className="hidden sm:block w-20"></div>

    {/* Center Title container */}
    <div className="flex-1 flex flex-col items-center justify-center">
      <h1 className="text-lg sm:text-2xl font-black text-[#1e3a8a] tracking-tight uppercase leading-none">
        PNP FOOTAGE REQUEST FORM
      </h1>
      <span className="text-[9px] sm:text-[10px] font-black uppercase text-blue-400 mt-1 tracking-widest">
        Pagbilao Command Center
      </span>
    </div>

    {/* Right Seal Logo */}
    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 z-10">
      <img 
        src="https://raw.githubusercontent.com/251805/etcfile/main/PCCLogo.png" 
        alt="Pagbilao Seal" 
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  </div>
));

export default Header;
