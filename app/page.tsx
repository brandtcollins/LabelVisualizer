"use client";

import { useState } from "react";
import Link from "next/link";
import LabelSizeSelector from "./components/LabelSizeSelector";
import FileUpload from "./components/FileUpload";
import ProductSelector from "./components/ProductSelector";
import { LabelSize } from "@/types";
import { getProductList } from "@/lib/productScenes";

export default function Home() {
  const [selectedSize, setSelectedSize] = useState<LabelSize>("3x2");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("sugar_scrub_jar");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showMockup, setShowMockup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockupData, setMockupData] = useState<any>(null);

  // Get product list for selector
  const products = getProductList();

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
    console.log('Product type:', selectedProduct);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('artwork', selectedFile);
      formData.append('labelSize', selectedSize);
      formData.append('productId', selectedProduct);

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
        {/* Navigation Bar */}
        <div className="flex justify-end mb-6">
          <Link
            href="/generated"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            View Gallery
          </Link>
        </div>

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

            <ProductSelector
              selected={selectedProduct}
              onChange={setSelectedProduct}
              products={products}
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
                  src={mockupData?.imageUrl || ""}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={handleReset}
                className="py-3 px-6 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Create Another Mockup
              </button>
              <Link
                href="/generated"
                className="py-3 px-6 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors text-center"
              >
                View All Mockups
              </Link>
              <button className="py-3 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors">
                Download Mockup
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
