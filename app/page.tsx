"use client";

import { useState } from "react";
import LabelSizeSelector from "./components/LabelSizeSelector";
import FileUpload from "./components/FileUpload";
import { LabelSize } from "@/types";

export default function Home() {
  const [selectedSize, setSelectedSize] = useState<LabelSize>("3x2");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showMockup, setShowMockup] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Create preview URL for the uploaded file
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleGenerate = () => {
    if (selectedFile && previewUrl) {
      setShowMockup(true);
    }
  };

  const handleReset = () => {
    setShowMockup(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Visualize Your Custom Labels on Real Products
          </h1>
          <p className="text-lg text-gray-600">
            Upload your artwork and see how it looks in real-world applications
          </p>
        </div>

        {!showMockup ? (
          <div className="space-y-8">
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
            />

            <LabelSizeSelector
              selected={selectedSize}
              onChange={setSelectedSize}
            />

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedFile}
              className={`
                py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200
                ${
                  selectedFile
                    ? "bg-ol-orange text-white hover:bg-primary-600 shadow-lg hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {selectedFile ? "Generate Mockup" : "Upload artwork to continue"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mockup Display */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Your Label Mockup
              </h2>
              <div className="flex justify-center bg-gray-50 rounded-lg p-8">
                <img
                  src={previewUrl || ""}
                  alt="Generated mockup"
                  className="max-w-full h-auto max-h-96 rounded-lg shadow-md"
                />
              </div>
              <div className="mt-4 text-center text-sm text-gray-500">
                Label Size: {selectedSize === "3x2" ? '3" × 2"' : '4" × 6"'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-6 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Create Another Mockup
              </button>
              <button className="flex-1 py-3 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors">
                Download Mockup
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
