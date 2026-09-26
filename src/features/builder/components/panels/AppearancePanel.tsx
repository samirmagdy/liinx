import React from 'react';
import { AppearancePresetsCard } from './AppearancePresetsCard';
import { ThemeGeometryCard } from './ThemeGeometryCard';
import { ThemeVisualsCard } from './ThemeVisualsCard';

export const AppearancePanel: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <AppearancePresetsCard />
    <ThemeVisualsCard />
    <ThemeGeometryCard />
  </div>
);
