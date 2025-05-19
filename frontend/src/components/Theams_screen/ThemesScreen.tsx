import React from 'react';
import type { ThemeColor } from '../types';

interface ThemesScreenProps {
  currentTheme: ThemeColor;
  onThemeChange: (theme: ThemeColor) => void;
}

export default function ThemesScreen({ currentTheme, onThemeChange }: ThemesScreenProps) {
  const themes = [
    { color: 'indigo', label: 'Classic Indigo' },
    { color: 'emerald', label: 'Fresh Emerald' },
    { color: 'rose', label: 'Vibrant Rose' },
    { color: 'amber', label: 'Warm Amber' },
  ];

  // Define color mappings for Tailwind classes
  const colorClasses = {
    indigo: { text: 'text-indigo-600', border: 'border-indigo-500', bg: 'bg-indigo-50' },
    emerald: { text: 'text-emerald-600', border: 'border-emerald-500', bg: 'bg-emerald-50' },
    rose: { text: 'text-rose-600', border: 'border-rose-500', bg: 'bg-rose-50' },
    amber: { text: 'text-amber-600', border: 'border-amber-500', bg: 'bg-amber-50' },
  };

  const currentThemeClasses = colorClasses[currentTheme];

  return (
    <div className={`p-6 h-screen ${currentThemeClasses.bg}`}>
      <h2 className={`text-2xl font-semibold mb-6 ${currentThemeClasses.text}`}>Theme Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {themes.map(({ color, label }) => {
          const isActive = currentTheme === color;
          const themeClasses = colorClasses[color];
          return (
            <button
              key={color}
              onClick={() => onThemeChange(color)}
              aria-pressed={isActive}
              className={`p-6 rounded-lg border-2 transition-all ${
                isActive
                  ? `${themeClasses.text} ${themeClasses.border} ${themeClasses.bg}`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-full h-24 rounded-lg ${themeClasses.bg} mb-4`} />
              <h3 className={`font-medium ${isActive ? themeClasses.text : 'text-gray-900'}`}>
                {label}
              </h3>
            </button>
          );
        })}
      </div>
    </div>
  );
}
