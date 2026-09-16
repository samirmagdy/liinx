/** Builds a Google Maps search URL without requesting device location. */
export function getGoogleMapsSearchUrl(location: unknown): string | null {
  if (typeof location !== 'string') return null;
  const query = location.trim();
  if (!query) return null;
  const url = new URL('https://www.google.com/maps/search/');
  url.searchParams.set('api', '1');
  url.searchParams.set('query', query);
  return url.toString();
}
