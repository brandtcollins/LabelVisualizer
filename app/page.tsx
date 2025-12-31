'use client';

import { useState } from 'react';
import LabelSizeSelector from './components/LabelSizeSelector';
import { LabelSize } from '@/types';

export default function Home() {
  const [selectedSize, setSelectedSize] = useState<LabelSize>('3x2');

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

        <LabelSizeSelector selected={selectedSize} onChange={setSelectedSize} />
      </div>
    </main>
  );
}
