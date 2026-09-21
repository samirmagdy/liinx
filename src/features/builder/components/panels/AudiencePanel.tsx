import React from 'react';
import { FormSubmissionsPanel } from './FormSubmissionsPanel';
import { SubscribersPanel } from './SubscribersPanel';

/** Everything the creator has collected from visitors: form answers and newsletter signups. */
export const AudiencePanel: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <FormSubmissionsPanel />
    <SubscribersPanel />
  </div>
);
