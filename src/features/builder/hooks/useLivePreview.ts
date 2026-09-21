import { useBuilder } from '../context/BuilderContext';
import { markFullscreenPreview } from '../../../utils/previewSession';

/**
 * Opens the creator's own page the way a visitor would see it. The save queue is flushed first so the
 * preview shows what is actually stored, and the tab-scoped flag tells the public page not to record
 * this visit as somebody else's.
 */
export function useLivePreview() {
  const { profile, customTheme, queueRef, onViewFullscreen } = useBuilder();

  return async () => {
    if (queueRef.current?.dirty && !(await queueRef.current.flush())) return;
    markFullscreenPreview(profile.username);
    onViewFullscreen(profile, customTheme);
  };
}
