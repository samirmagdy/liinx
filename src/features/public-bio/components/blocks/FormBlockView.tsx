import React, { useState, useRef } from 'react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { getAccessibleTextColor } from '../../../../utils/colorContrast';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { normalizeFormFields, advancedRadius } from '../../utils/publicBio.utils';

interface FormBlockViewProps {
  block: BlockItem;
  profileId: string;
  theme: ThemeConfig;
}

export const FormBlockView: React.FC<FormBlockViewProps> = ({
  block,
  profileId,
  theme
}) => {
  const { tr: ui } = useUiLanguage();
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };

  const fields = normalizeFormFields(extra.fields);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formConsent, setFormConsent] = useState(false);
  const formSubmissionKey = useRef<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  if (fields.length === 0) {
    return (
      <div className={card} style={cardStyle}>
        <h3 className="font-bold mb-1">{block.title}</h3>
        <p role="status" className="text-sm" style={{ color: theme.subtextColor }}>
          {ui('This form is not available yet.')}
        </p>
      </div>
    );
  }

  const consentRequired = extra.consentRequired === true;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('Sending…');
    if (!formSubmissionKey.current) {
      formSubmissionKey.current =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `submission_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          blockId: block.id,
          submissionKey: formSubmissionKey.current,
          consent: formConsent,
          fields: formValues
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to save your response. Please try again.');
      }
      setStatus(data.message || 'Thanks — your response was sent.');
      setFormValues({});
      setFormConsent(false);
      formSubmissionKey.current = null;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'We could not save your response. Please try again.');
    }
  };

  return (
    <div className={card} style={cardStyle}>
      <h3 className="font-bold mb-1">{block.title}</h3>
      <p className="text-sm mb-4" style={{ color: theme.subtextColor }}>
        {block.subtitle || extra.description}
      </p>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3">
          {fields.map(field => (
            <label key={field.id || field.name} className="grid gap-1 text-xs font-semibold">
              {field.label || field.name}
              {field.helpText && (
                <span className="font-normal text-xs" style={{ color: theme.subtextColor }}>
                  {field.helpText}
                </span>
              )}
              {field.type === 'textarea' ? (
                <textarea
                  id={`form-field-${block.id}-${field.name}`}
                  name={field.name}
                  required={field.required !== false}
                  minLength={field.minLength}
                  maxLength={field.maxLength}
                  value={formValues[field.name] || ''}
                  onChange={e => setFormValues(v => ({ ...v, [field.name]: e.target.value }))}
                  className="min-h-24 rounded-xl border bg-transparent p-3 font-normal"
                />
              ) : (
                <input
                  id={`form-field-${block.id}-${field.name}`}
                  name={field.name}
                  required={field.required !== false}
                  minLength={field.minLength}
                  maxLength={field.maxLength}
                  type={field.type || 'text'}
                  autoComplete={field.name === 'email' ? 'email' : field.name === 'name' ? 'name' : undefined}
                  value={formValues[field.name] || ''}
                  onChange={e => setFormValues(v => ({ ...v, [field.name]: e.target.value }))}
                  className="rounded-xl border bg-transparent p-3 font-normal"
                />
              )}
            </label>
          ))}
        </div>

        {consentRequired && (
          <label className="flex items-start gap-2 text-xs" style={{ color: theme.subtextColor }}>
            <input
              id={`form-consent-${block.id}`}
              name="consent"
              type="checkbox"
              checked={formConsent}
              onChange={event => setFormConsent(event.target.checked)}
              required
              className="mt-0.5"
            />
            <span>
              {extra.consentText || ui('I agree that this creator may receive and use my response.')}
            </span>
          </label>
        )}

        <button
          className="rounded-xl px-4 py-2 text-sm font-bold cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: theme.accentColor,
            color: getAccessibleTextColor(theme.accentColor)
          }}
          disabled={status === 'Sending…'}
        >
          {extra.buttonText || 'Send'}
        </button>

        {status && (
          <p role="status" className="text-xs" style={{ color: theme.subtextColor }}>
            {status}
          </p>
        )}
      </form>
    </div>
  );
};
