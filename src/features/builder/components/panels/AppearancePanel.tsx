import React from 'react';
import { AppearancePresetsCard } from './AppearancePresetsCard';
import { ThemeGeometryCard } from './ThemeGeometryCard';

export const AppearancePanel: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <AppearancePresetsCard />
    <ThemeGeometryCard />
  </div>
);
