/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

const Header = React.memo(() => (
  <div className="flex justify-between items-center mb-8 relative">
    {/* Left Space for alignment */}
    <div className="w-24"></div>

    {/* Center Text */}
    <h1 className="text-2xl font-bold text-[#1e3a8a] absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
      PNP FOOTAGE REQUEST FORM
    </h1>

    {/* Right Seal Logo */}
    <div className="w-24 h-24 z-10">
      <img 
        src="https://raw.githubusercontent.com/251805/sirpacheck/main/pag%20logo.png" 
        alt="Pagbilao Seal" 
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  </div>
));

export default Header;
