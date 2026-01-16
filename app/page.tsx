"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LabelSizeSelector, {
  LabelDimensions,
} from "./components/LabelSizeSelector";
import FileUpload from "./components/FileUpload";
import ProductSelector from "./components/ProductSelector";
import WatermarkSelector, {
  WatermarkSettings,
  WATERMARK_OPTIONS,
} from "./components/WatermarkSelector";
import { getProductList } from "@/lib/productScenes";
import { useAuth } from "./hooks/useAuth";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, isProtected, getPassword, requireAuth } = useAuth();

  const [labelDimensions, setLabelDimensions] = useState<LabelDimensions>({
    width: 3,
    height: 2,
  });
  const [dimensionsFilter, setDimensionsFilter] = useState<
    LabelDimensions | undefined
  >(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<string>("sugar_scrub_jar");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showMockup, setShowMockup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockupData, setMockupData] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
    enabled: true,
    selectedId: WATERMARK_OPTIONS[0].id,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, isAuthenticated, isProtected]);

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

  const handleDimensionsFinalized = (dimensions: LabelDimensions) => {
    setDimensionsFilter(dimensions);
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    console.log("=== Client: Starting generation ===");
    console.log("Selected file:", selectedFile.name);
    console.log("Label dimensions:", labelDimensions);
    console.log("Product type:", selectedProduct);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("artwork", selectedFile);

      // Format label size based on shape
      const labelSizeStr =
        labelDimensions.shape === "circular"
          ? `${labelDimensions.width}d` // e.g., "3d" for 3-inch diameter
          : `${labelDimensions.width}x${labelDimensions.height}`; // e.g., "3x2"

      formData.append("labelSize", labelSizeStr);
      formData.append("productId", selectedProduct);

      // Include password from session if protected
      const storedPassword = getPassword();
      if (storedPassword) {
        formData.append("password", storedPassword);
      }

      // Include watermark settings
      formData.append("watermarkEnabled", String(watermarkSettings.enabled));
      if (watermarkSettings.enabled && watermarkSettings.selectedId) {
        formData.append("watermarkId", watermarkSettings.selectedId);
      }

      console.log("Sending POST request to /api/generate...");

      // Make API call
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        setMockupData(data);
        setShowMockup(true);
        console.log("Success! Showing mockup");
      } else {
        setError(data.error || "Failed to generate mockup");
        console.error("API returned error:", data.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("An error occurred. Please try again.");
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

  const downloadImage = () => {
    if (!mockupData?.imageUrl) return;
    const link = document.createElement("a");
    link.href = mockupData.imageUrl;
    link.download = mockupData.imageUrl.split("/").pop() || "mockup.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Navigation Bar */}
        <div className="flex justify-end mb-6"></div>

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
              dimensions={labelDimensions}
              onChange={setLabelDimensions}
              onDimensionsFinalized={handleDimensionsFinalized}
            />

            <ProductSelector
              selected={selectedProduct}
              onChange={setSelectedProduct}
              products={products}
            />

            <WatermarkSelector
              settings={watermarkSettings}
              onChange={setWatermarkSettings}
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
              <div
                className="flex justify-center bg-gray-50 rounded-lg p-8 cursor-zoom-in"
                onClick={() => setShowImageModal(true)}
                title="Click to view full size"
              >
                <img
                  src={mockupData?.imageUrl || ""}
                  alt="Generated mockup"
                  className="max-w-full h-auto max-h-96 rounded-lg shadow-md hover:shadow-xl transition-shadow"
                />
              </div>
              <div className="mt-4 text-center space-y-1">
                <p className="text-sm text-gray-500">
                  Label Size:{" "}
                  {labelDimensions.shape === "circular"
                    ? `${labelDimensions.width}" diameter`
                    : `${labelDimensions.width}" × ${labelDimensions.height}"`}
                </p>
                {/* {mockupData && (
                  <p className="text-xs text-gray-400">
                    {mockupData.cached
                      ? "✓ Retrieved from cache"
                      : "✓ Newly generated"}
                    {mockupData.message && ` • ${mockupData.message}`}
                  </p>
                )} */}
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
              <button
                onClick={downloadImage}
                className="py-3 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Download Mockup
              </button>
            </div>
          </div>
        )}

        {/* Modal for Full Image View */}
        {showImageModal && mockupData?.imageUrl && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div
              className="relative max-w-5xl w-full bg-white rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image */}
              <div className="bg-gray-50 p-8">
                <img
                  src={mockupData.imageUrl}
                  alt="Generated mockup"
                  className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                />
              </div>

              {/* Details */}
              <div className="p-6 border-t-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Mockup Details
                    </h3>
                    <p className="text-sm text-gray-600">
                      {mockupData.cached
                        ? "Retrieved from cache"
                        : "Newly generated"}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-medium">
                    {labelDimensions.shape === "circular"
                      ? `${labelDimensions.width}" diameter`
                      : `${labelDimensions.width}" × ${labelDimensions.height}"`}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={downloadImage}
                    className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
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
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  {/* <button
                    onClick={() => setShowImageModal(false)}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button> */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
