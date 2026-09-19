import React from 'react';
import { Play, Pause, X, Music2 } from 'lucide-react';
import { type BlockItem, type ThemeConfig } from '../../../types';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';

interface StickyAudioBarProps {
  playingBlock: BlockItem | null;
  theme: ThemeConfig;
  onPause: () => void;
  onResume: () => void;
  onClose: () => void;
  isPlaying: boolean;
}

export const StickyAudioBar: React.FC<StickyAudioBarProps> = ({
  playingBlock,
  theme,
  onPause,
  onResume,
  onClose,
  isPlaying
}) => {
  const { tr: ui } = useUiLanguage();
  if (!playingBlock) return null;

  return (
    <aside
      aria-label={ui('Now playing')}
      className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 rounded-2xl p-3 shadow-2xl border backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
      style={{
        backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)',
        borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
        color: theme.textColor
      }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
          style={{ backgroundColor: theme.cardBg, border: theme.cardBorder }}
        >
          <Music2 className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold truncate leading-tight" dir="auto">
            {playingBlock.title || ui('Audio Track')}
          </p>
          <p className="text-[11px] truncate opacity-70" dir="auto">
            {playingBlock.artist || ui('Now playing')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={isPlaying ? onPause : onResume}
          className="w-8 h-8 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          aria-label={isPlaying ? ui('Pause track') : ui('Play track')}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full opacity-60 hover:opacity-100 flex items-center justify-center cursor-pointer"
          aria-label={ui('Close player')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};

export const StickyAudioBarContainer: React.FC<{
  activeBlock: BlockItem | null;
  theme: ThemeConfig;
  playingAudioId: string | null;
  setPlayingAudioId: (id: string | null) => void;
}> = ({ activeBlock, theme, playingAudioId, setPlayingAudioId }) => {
  if (!activeBlock) return null;
  const handleControl = (action: 'pause' | 'resume' | 'close') => {
    const el = document.getElementById(`audio-player-${activeBlock.id}`) as HTMLAudioElement | null;
    if (action === 'resume') {
      if (el) {
        void el.play();
        setPlayingAudioId(activeBlock.id);
      }
    } else {
      if (el) el.pause();
      setPlayingAudioId(null);
    }
  };

  return (
    <StickyAudioBar
      playingBlock={activeBlock}
      theme={theme}
      isPlaying={Boolean(playingAudioId)}
      onPause={() => handleControl('pause')}
      onResume={() => handleControl('resume')}
      onClose={() => handleControl('close')}
    />
  );
};
