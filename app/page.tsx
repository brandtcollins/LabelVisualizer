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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockupData, setMockupData] = useState<any>(null);

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

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    console.log('=== Client: Starting generation ===');
    console.log('Selected file:', selectedFile.name);
    console.log('Label size:', selectedSize);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('artwork', selectedFile);
      formData.append('labelSize', selectedSize);
      formData.append('sceneId', '1'); // Using first scene for now

      console.log('Sending POST request to /api/generate...');

      // Make API call
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setMockupData(data);
        setShowMockup(true);
        console.log('Success! Showing mockup');
      } else {
        setError(data.error || 'Failed to generate mockup');
        console.error('API returned error:', data.error);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowMockup(false);
    setSelectedFile(null);
    setMockupData(null);
    setError(null);
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
              disabled={!selectedFile || loading}
              className={`
                py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200
                ${
                  selectedFile && !loading
                    ? "bg-ol-orange text-white hover:bg-primary-600 shadow-lg hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : selectedFile ? (
                "Generate Mockup"
              ) : (
                "Upload artwork to continue"
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-800 text-center">{error}</p>
              </div>
            )}
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
              <div className="mt-4 text-center space-y-1">
                <p className="text-sm text-gray-500">
                  Label Size: {selectedSize === "3x2" ? '3" × 2"' : '4" × 6"'}
                </p>
                {mockupData && (
                  <p className="text-xs text-gray-400">
                    {mockupData.cached ? '✓ Retrieved from cache' : '✓ Newly generated'}
                    {mockupData.message && ` • ${mockupData.message}`}
                  </p>
                )}
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
