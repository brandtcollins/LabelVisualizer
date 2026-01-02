"use client";
import Image from "next/image";
import { LabelSize } from "@/types";

interface LabelSizeSelectorProps {
  selected: LabelSize;
  onChange: (size: LabelSize) => void;
}

export default function LabelSizeSelector({
  selected,
  onChange,
}: LabelSizeSelectorProps) {
  const labelSizes = [
    {
      size: "3x2" as LabelSize,
      title: '3" × 2"',
      description: "Rectangle - Horizontal",
    },
    {
      size: "4x6" as LabelSize,
      title: '4" × 6"',
      description: "Rectangle - Vertical",
    },
  ];

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Label</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {labelSizes.map((label) => (
          <button
            key={label.size}
            onClick={() => onChange(label.size)}
            className={`
              relative p-6 rounded-md border transition-all duration-200 text-left shadow-sm border-gray-200
              ${
                selected === label.size
                  ? " bg-white scale-105"
                  : " bg-white hover:shadow-md opacity-60 hover:opacity-80"
              }
            `}
          >
            {/* Selected indicator */}
            {/* {selected === label.size && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )} */}

            <div className="space-y-2">
              <Image
                src="/images/label-thumbnails/3x2.webp"
                alt="Online Labels"
                width={150}
                height={40}
                className=" w-auto"
              />
              <h3
                className={`text-lg font-bold ${
                  selected === label.size ? "text-primary" : "text-gray-800"
                }`}
              >
                {label.title}
              </h3>
              {/* <p className="text-xs text-gray-500">{label.dimensions}</p> */}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
