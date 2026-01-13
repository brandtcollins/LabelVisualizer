"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { getProductScenes } from "@/lib/productScenes";

export interface ProductListItem {
  id: string;
  name: string;
  category: string;
  tags?: string[];
}

export interface LabelDimensions {
  width: number;
  height: number;
  shape?: "rectangular" | "circular";
}

interface ProductSelectorProps {
  selected: string;
  onChange: (productId: string) => void;
  products: ProductListItem[];
  filterByDimensions?: LabelDimensions;
}

export default function ProductSelector({
  selected,
  onChange,
  products,
  filterByDimensions,
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      // If less than 300px below, try to position above
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        setDropdownPosition('above');
      } else {
        setDropdownPosition('below');
      }
    }
  }, [isOpen]);

  // Filter products based on dimensions
  const filteredProducts = useMemo(() => {
    if (!filterByDimensions) return products;

    const productScenes = getProductScenes();
    const { width, height, shape } = filterByDimensions;

    return products.filter((product) => {
      const scene = productScenes.mockupProducts.find(
        (p) => p.id === product.id
      );
      if (!scene || !scene.labelConstraints) return false;

      const constraints = scene.labelConstraints;

      // For circular labels, check circle constraints
      if (shape === "circular" && constraints.circle) {
        const circle = constraints.circle;
        const diameter = width; // For circular labels, width = height = diameter
        return diameter >= circle.minD && diameter <= circle.maxD;
      }

      // For rectangular labels, check rectangle constraints
      if (shape === "rectangular" && constraints.rectangle) {
        const rect = constraints.rectangle;
        return (
          width >= rect.minW &&
          width <= rect.maxW &&
          height >= rect.minH &&
          height <= rect.maxH
        );
      }

      // Check flat constraints (no shape specification)
      if (constraints.minW !== undefined && constraints.maxW !== undefined) {
        return (
          width >= constraints.minW &&
          width <= constraints.maxW &&
          height >= constraints.minH &&
          height <= constraints.maxH
        );
      }

      // If no matching constraints found, don't include
      return false;
    });
  }, [products, filterByDimensions]);

  const selectedProduct = filteredProducts.find((p) => p.id === selected);

  // Group filtered products by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, ProductListItem[]>);

  const categoryLabels: Record<string, string> = {
    lids: "Lids",
    "bath-body": "Bath & Body",
    candles: "Candles",
    bottles: "Bottles",
    soap: "Soap",
    beverage: "Beverages",
    bags: "Bags & Pouches",
    boxes: "Boxes",
  };

  const hasFilteredProducts = Object.keys(groupedProducts).length > 0;

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Select Product Type
        {filterByDimensions && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({filteredProducts.length} compatible product
            {filteredProducts.length !== 1 ? "s" : ""})
          </span>
        )}
      </h2>

      {!hasFilteredProducts && filterByDimensions ? (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 font-medium">
            No products match your label dimensions
          </p>
          <p className="text-yellow-700 text-sm mt-1">
            {filterByDimensions.shape === "circular" ? (
              <>Try adjusting your diameter ({filterByDimensions.width}") to see available products.</>
            ) : (
              <>
                Try adjusting your width ({filterByDimensions.width}") or height ({filterByDimensions.height}") to see available products.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-white border-2 border-gray-300 rounded-xl p-4 text-left flex items-center justify-between hover:border-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Product Type</p>
                <p className="font-semibold text-gray-900">
                  {selectedProduct?.name || "Select a product"}
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown */}
              <div className={`absolute z-20 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-[min(400px,60vh)] overflow-y-auto ${
                dropdownPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
              }`}>
                {Object.entries(groupedProducts).map(
                  ([category, categoryProducts]) => (
                    <div
                      key={category}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <div className="px-4 py-4 bg-gray-50 text-xs font-semibold text-gray-800 uppercase tracking-wider sticky top-0">
                        {categoryLabels[category] || category}
                      </div>
                      {categoryProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            onChange(product.id);
                            setIsOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors ${
                            selected === product.id ? "bg-primary/10" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {product.name}
                              </p>
                            </div>
                            {selected === product.id && (
                              <svg
                                className="w-5 h-5 text-primary flex-shrink-0"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
