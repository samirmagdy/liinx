type PagePublishedListener = (pageId: string) => void;

const listeners = new Set<PagePublishedListener>();

/**
 * A page that just went live is one event several parts of the studio want to hear, and they sit in
 * different branches of the tree. The builder provider cannot carry another piece of state without
 * growing past its reviewed size, so this stays a deliberately small, explicit subscription.
 */
export function onPagePublished(listener: PagePublishedListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function notifyPagePublished(pageId: string): void {
  listeners.forEach(listener => listener(pageId));
}
