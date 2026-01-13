"use client";
import { useState } from "react";

export interface LabelDimensions {
  width: number;
  height: number;
}

interface LabelSizeSelectorProps {
  dimensions: LabelDimensions;
  onChange: (dimensions: LabelDimensions) => void;
  onDimensionsFinalized?: (dimensions: LabelDimensions) => void;
}

export default function LabelSizeSelector({
  dimensions,
  onChange,
  onDimensionsFinalized,
}: LabelSizeSelectorProps) {
  const [width, setWidth] = useState(dimensions.width.toString());
  const [height, setHeight] = useState(dimensions.height.toString());

  const handleWidthChange = (value: string) => {
    setWidth(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onChange({ width: numValue, height: dimensions.height });
    }
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onChange({ width: dimensions.width, height: numValue });
    }
  };

  const handleBlur = () => {
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);

    if (!isNaN(widthNum) && widthNum > 0 && !isNaN(heightNum) && heightNum > 0) {
      const finalDimensions = { width: widthNum, height: heightNum };
      onChange(finalDimensions);
      if (onDimensionsFinalized) {
        onDimensionsFinalized(finalDimensions);
      }
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Label Size</h2>
      <div className="bg-white border-2 border-gray-300 rounded-xl p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
              Width (inches)
            </label>
            <input
              id="width"
              type="number"
              min="0.1"
              step="0.1"
              value={width}
              onChange={(e) => handleWidthChange(e.target.value)}
              onBlur={handleBlur}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="e.g., 3"
            />
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
              Height (inches)
            </label>
            <input
              id="height"
              type="number"
              min="0.1"
              step="0.1"
              value={height}
              onChange={(e) => handleHeightChange(e.target.value)}
              onBlur={handleBlur}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="e.g., 2"
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Enter your label dimensions. Products will be filtered to show compatible options.
        </p>
      </div>
    </div>
  );
}
