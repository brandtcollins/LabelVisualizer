"use client";
import { useState } from "react";

export interface LabelDimensions {
  width: number;
  height: number;
  shape?: "rectangular" | "circular";
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
  const [shape, setShape] = useState<"rectangular" | "circular">(
    dimensions.shape || "rectangular"
  );
  const [width, setWidth] = useState(dimensions.width.toString());
  const [height, setHeight] = useState(dimensions.height.toString());
  const [diameter, setDiameter] = useState(dimensions.width.toString());

  const handleShapeChange = (newShape: "rectangular" | "circular") => {
    setShape(newShape);

    if (newShape === "circular") {
      // For circular labels, set width = height = diameter
      const diameterNum = parseFloat(diameter);
      if (!isNaN(diameterNum) && diameterNum > 0) {
        const dims: LabelDimensions = { width: diameterNum, height: diameterNum, shape: "circular" };
        onChange(dims);
      }
    } else {
      // For rectangular labels, use existing width/height
      const widthNum = parseFloat(width);
      const heightNum = parseFloat(height);
      if (!isNaN(widthNum) && widthNum > 0 && !isNaN(heightNum) && heightNum > 0) {
        const dims: LabelDimensions = { width: widthNum, height: heightNum, shape: "rectangular" };
        onChange(dims);
      }
    }
  };

  const handleDiameterChange = (value: string) => {
    setDiameter(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      const dims: LabelDimensions = { width: numValue, height: numValue, shape: "circular" };
      onChange(dims);
    }
  };

  const handleWidthChange = (value: string) => {
    setWidth(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      const dims: LabelDimensions = { width: numValue, height: dimensions.height, shape: "rectangular" };
      onChange(dims);
    }
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      const dims: LabelDimensions = { width: dimensions.width, height: numValue, shape: "rectangular" };
      onChange(dims);
    }
  };

  const handleBlur = () => {
    if (shape === "circular") {
      const diameterNum = parseFloat(diameter);
      if (!isNaN(diameterNum) && diameterNum > 0) {
        const finalDimensions: LabelDimensions = { width: diameterNum, height: diameterNum, shape: "circular" };
        onChange(finalDimensions);
        if (onDimensionsFinalized) {
          onDimensionsFinalized(finalDimensions);
        }
      }
    } else {
      const widthNum = parseFloat(width);
      const heightNum = parseFloat(height);

      if (!isNaN(widthNum) && widthNum > 0 && !isNaN(heightNum) && heightNum > 0) {
        const finalDimensions: LabelDimensions = { width: widthNum, height: heightNum, shape: "rectangular" };
        onChange(finalDimensions);
        if (onDimensionsFinalized) {
          onDimensionsFinalized(finalDimensions);
        }
      }
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Label Size</h2>
      <div className="bg-white border-2 border-gray-300 rounded-xl p-6">
        {/* Shape Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Label Shape
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleShapeChange("rectangular")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                shape === "rectangular"
                  ? "bg-ol-orange text-white border-2 border-ol-orange"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400"
              }`}
            >
              Rectangular
            </button>
            <button
              type="button"
              onClick={() => handleShapeChange("circular")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                shape === "circular"
                  ? "bg-ol-orange text-white border-2 border-ol-orange"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400"
              }`}
            >
              Circular
            </button>
          </div>
        </div>

        {/* Dimension Inputs */}
        {shape === "circular" ? (
          <div>
            <label htmlFor="diameter" className="block text-sm font-medium text-gray-700 mb-2">
              Diameter (inches)
            </label>
            <input
              id="diameter"
              type="number"
              min="0.1"
              step="0.1"
              value={diameter}
              onChange={(e) => handleDiameterChange(e.target.value)}
              onBlur={handleBlur}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="e.g., 3"
            />
            <p className="mt-3 text-sm text-gray-500">
              Enter your circular label diameter. Products will be filtered to show compatible options.
            </p>
          </div>
        ) : (
          <div>
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
        )}
      </div>
    </div>
  );
}
