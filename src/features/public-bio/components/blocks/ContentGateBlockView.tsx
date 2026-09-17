import React, { useState } from 'react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { getAccessibleTextColor } from '../../../../utils/colorContrast';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { advancedRadius } from '../../utils/publicBio.utils';

interface ContentGateBlockViewProps {
  block: BlockItem;
  profileId: string;
  theme: ThemeConfig;
}

export const ContentGateBlockView: React.FC<ContentGateBlockViewProps> = ({
  block,
  profileId,
  theme
}) => {
  const { tr: ui } = useUiLanguage();
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };

  const [gateValue, setGateValue] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(ui('Checking…'));
    try {
      const response = await fetch('/api/content-gates/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          blockId: block.id,
          password: gateValue
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || ui('Unable to unlock'));
      }
      setStatus(data.body || ui('Unlocked.'));
      setUnlocked(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : ui('Unable to unlock.'));
    }
  };

  return (
    <div className={card} style={cardStyle}>
      {unlocked ? (
        <div className="whitespace-pre-wrap text-sm" dir="auto">
          {status}
        </div>
      ) : !extra.locked ? (
        <>
          <h3 className="font-bold" dir="auto">{block.title}</h3>
          <p role="status" className="text-sm my-3" style={{ color: theme.subtextColor }}>
            {ui('This protected text is not configured yet.')}
          </p>
        </>
      ) : (
        <form onSubmit={handleUnlock}>
          <h3 className="font-bold" dir="auto">{block.title}</h3>
          <p className="text-sm my-3" style={{ color: theme.subtextColor }} dir="auto">
            {extra.description || ui('Enter the access code to continue.')}
          </p>
          <input
            id={`gate-code-${block.id}`}
            name="gateCode"
            autoComplete="current-password"
            required
            type="password"
            value={gateValue}
            onChange={e => setGateValue(e.target.value)}
            className="w-full rounded-xl border bg-transparent p-3 mb-2"
            placeholder={ui('Access code')}
            dir="ltr"
          />
          <button
            className="rounded-xl px-4 py-2 text-sm font-bold cursor-pointer"
            style={{
              backgroundColor: theme.accentColor,
              color: getAccessibleTextColor(theme.accentColor)
            }}
          >
            {ui('Unlock')}
          </button>
          {status && (
            <p role="alert" className="text-xs mt-2" dir="auto">
              {status}
            </p>
          )}
        </form>
      )}
    </div>
  );
};
