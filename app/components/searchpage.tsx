"use client";

import React from "react";
import MarketplaceSearch from "./searchbar";

export default function SearchPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-4">Search</h1>
      <MarketplaceSearch />
    </div>
  );
}
