'use client';

import { useState } from 'react';

export interface ProductListItem {
  id: string;
  name: string;
  category: string;
  tags?: string[];
}

interface ProductSelectorProps {
  selected: string;
  onChange: (productId: string) => void;
  products: ProductListItem[];
}

export default function ProductSelector({ selected, onChange, products }: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedProduct = products.find(p => p.id === selected);

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, ProductListItem[]>);

  const categoryLabels: Record<string, string> = {
    'lids': 'Lids',
    'bath-body': 'Bath & Body',
    'candles': 'Candles',
    'bottles': 'Bottles',
    'soap': 'Soap',
    'beverage': 'Beverages',
    'bags': 'Bags & Pouches',
    'boxes': 'Boxes'
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Product Type</h2>

      <div className="relative">
        <button
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
              <p className="font-semibold text-gray-900">{selectedProduct?.name || 'Select a product'}</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
            <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-96 overflow-y-auto">
              {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                <div key={category} className="border-b border-gray-100 last:border-0">
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider sticky top-0">
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
                        selected === product.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.tags && product.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {product.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
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
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
