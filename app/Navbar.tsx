"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-[#EDE8D0] backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex flex-row items-center gap-6">
            <Link
              href="/browse"
              className="text-3xl h-full items-center inline-flex mb-[5px] font-bold leading-none"
            >
              Madison Marketplace
            </Link>
            <nav className="hidden md:flex items-center gap-6 h-16">
              <Link
                href="/browse"
                className="inline-flex items-center h-full text-lg leading-none text-gray-700 hover:text-gray-900"
              >
                Browse
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center h-full text-lg leading-none text-gray-700 hover:text-gray-900"
              >
                Sell
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 ">
            <div className="hidden md:flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 h-16">
                <Link
                  href="/login"
                  className="text-sm leading-none text-gray-700 hover:text-gray-900"
                >
                  Sign in
                </Link>
              </div>
            </div>

            <button
              className="md:hidden p-2 rounded-md text-gray-600"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-[#EDE8D0]">
          <div className="px-4 py-3 space-y-2">
            <Link href="/search" className="block text-gray-700">
              Browse
            </Link>
            <Link href="/sell" className="block text-gray-700">
              Sell
            </Link>
            <Link href="/about" className="block text-gray-700">
              About
            </Link>
            <Link href="/signin" className="block text-gray-700">
              Sign in
            </Link>
            <Link href="/signup" className="block text-gray-700">
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
