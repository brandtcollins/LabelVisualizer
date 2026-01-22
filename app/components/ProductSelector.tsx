"use client";

import { useState, useMemo, Fragment } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
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
  const [query, setQuery] = useState("");

  // Filter products based on dimensions
  const dimensionFilteredProducts = useMemo(() => {
    if (!filterByDimensions) return products;

    const productScenes = getProductScenes();
    const { width, height, shape } = filterByDimensions;

    return products.filter((product) => {
      const scene = productScenes.mockupProducts.find(
        (p) => p.id === product.id
      );
      if (!scene || !scene.labelConstraints) return false;

      const constraints = scene.labelConstraints;

      if (shape === "circular" && constraints.circle) {
        const circle = constraints.circle;
        const diameter = width;
        return diameter >= circle.minD && diameter <= circle.maxD;
      }

      if (shape === "rectangular" && constraints.rectangle) {
        const rect = constraints.rectangle;
        return (
          width >= rect.minW &&
          width <= rect.maxW &&
          height >= rect.minH &&
          height <= rect.maxH
        );
      }

      if (constraints.minW !== undefined && constraints.maxW !== undefined) {
        return (
          width >= constraints.minW &&
          width <= constraints.maxW &&
          height >= constraints.minH &&
          height <= constraints.maxH
        );
      }

      return false;
    });
  }, [products, filterByDimensions]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (query === "") return dimensionFilteredProducts;

    const lowerQuery = query.toLowerCase();
    return dimensionFilteredProducts.filter((product) => {
      return (
        product.name.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }, [dimensionFilteredProducts, query]);

  const selectedProduct = products.find((p) => p.id === selected);

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

  const handleChange = (product: ProductListItem | null) => {
    if (product) {
      onChange(product.id);
      setQuery("");
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Select Product Type
        {filterByDimensions && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({dimensionFilteredProducts.length} compatible product
            {dimensionFilteredProducts.length !== 1 ? "s" : ""})
          </span>
        )}
      </h2>

      {!dimensionFilteredProducts.length && filterByDimensions ? (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 font-medium">
            No products match your label dimensions
          </p>
          <p className="text-yellow-700 text-sm mt-1">
            {filterByDimensions.shape === "circular" ? (
              <>
                Try adjusting your diameter ({filterByDimensions.width}") to see
                available products.
              </>
            ) : (
              <>
                Try adjusting your width ({filterByDimensions.width}") or height
                ({filterByDimensions.height}") to see available products.
              </>
            )}
          </p>
        </div>
      ) : (
        <Combobox
          value={selectedProduct || null}
          onChange={handleChange}
          onClose={() => setQuery("")}
        >
          <div className="relative">
            <div className="w-full bg-white border-2 border-gray-300 rounded-xl p-4 flex items-center gap-3 hover:border-primary-300 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
              <div className="flex-1 min-w-0">
                <ComboboxInput
                  className="w-full font-semibold text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-400 placeholder:font-normal"
                  placeholder="Search or select a product..."
                  displayValue={(product: ProductListItem | null) =>
                    product?.name || ""
                  }
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <ComboboxButton className="flex-shrink-0 p-1">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </ComboboxButton>
            </div>

            <ComboboxOptions className="absolute z-20 w-full bottom-full mb-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-[min(400px,60vh)] overflow-y-auto">
              {!hasFilteredProducts ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No products found for "{query}"
                </div>
              ) : (
                Object.entries(groupedProducts).map(
                  ([category, categoryProducts]) => (
                    <div
                      key={category}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <div className="px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-800 uppercase tracking-wider sticky top-0">
                        {categoryLabels[category] || category}
                      </div>
                      {categoryProducts.map((product) => (
                        <ComboboxOption
                          key={product.id}
                          value={product}
                          as={Fragment}
                        >
                          {({ active, selected: isSelected }) => (
                            <div
                              className={`w-full px-4 py-3 cursor-pointer transition-colors ${
                                active ? "bg-primary/10" : ""
                              } ${isSelected ? "bg-primary/5" : ""}`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900">
                                  {product.name}
                                </p>
                                {isSelected && (
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
                            </div>
                          )}
                        </ComboboxOption>
                      ))}
                    </div>
                  )
                )
              )}
            </ComboboxOptions>
          </div>
        </Combobox>
      )}
    </div>
  );
}
