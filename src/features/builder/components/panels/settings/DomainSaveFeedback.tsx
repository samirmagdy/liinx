import React from 'react';

/**
 * The result of saving the address, including the reason the server refused it. The message
 * arrives already localized from the settings layer, so it is rendered as given.
 */
export const DomainSaveFeedback: React.FC<{ feedback: { type: 'success' | 'error'; message: string } }> = ({ feedback }) => (
  <p
    role={feedback.type === 'error' ? 'alert' : 'status'}
    className={`rounded-xl border p-3 text-xs font-medium ${
      feedback.type === 'success'
        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
        : 'bg-rose-50 text-rose-800 border-rose-200'
    }`}
  >
    {feedback.message}
  </p>
);
