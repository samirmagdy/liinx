import confetti from 'canvas-confetti';

export async function shareProfile(url: string, title?: string, onCopied?: () => void) {
  if (typeof window === 'undefined') return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: title || document.title || 'Liinx Profile',
        url
      });
      return;
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    if (onCopied) onCopied();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.2 }
    });
  }
}
