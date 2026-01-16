"use client";

import { useState, useEffect } from "react";

export interface WatermarkOption {
  id: string;
  name: string;
  path: string;
  previewPath?: string;
}

export interface WatermarkSettings {
  enabled: boolean;
  selectedId: string | null;
}

// Available watermarks from public/images
export const WATERMARK_OPTIONS: WatermarkOption[] = [
  {
    id: "ol-logo",
    name: "OL Logo (White)",
    path: "/images/ol-logo-white.svg",
  },
  {
    id: "olg-step-repeat",
    name: "OLG Step & Repeat Pattern",
    path: "/images/olg-watermark-white.png",
  },
];

interface WatermarkSelectorProps {
  settings: WatermarkSettings;
  onChange: (settings: WatermarkSettings) => void;
}

export default function WatermarkSelector({
  settings,
  onChange,
}: WatermarkSelectorProps) {
  const handleToggle = () => {
    onChange({
      ...settings,
      enabled: !settings.enabled,
      // Auto-select first option when enabling if none selected
      selectedId:
        !settings.enabled && !settings.selectedId
          ? WATERMARK_OPTIONS[0].id
          : settings.selectedId,
    });
  };

  const handleSelect = (id: string) => {
    onChange({
      ...settings,
      selectedId: id,
    });
  };

  const selectedWatermark = WATERMARK_OPTIONS.find(
    (w) => w.id === settings.selectedId
  );

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Watermark</h2>
          <p className="text-sm text-gray-500">
            Add a watermark to the generated mockup
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          onClick={handleToggle}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${settings.enabled ? "bg-primary" : "bg-gray-300"}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${settings.enabled ? "translate-x-6" : "translate-x-1"}
            `}
          />
        </button>
      </div>

      {/* Dropdown - only shown when enabled */}
      {settings.enabled && (
        <div className="space-y-3">
          <label
            htmlFor="watermark-select"
            className="block text-sm font-medium text-gray-700"
          >
            Select Watermark
          </label>
          <select
            id="watermark-select"
            value={settings.selectedId || ""}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-primary focus:outline-none transition-colors"
          >
            {WATERMARK_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
