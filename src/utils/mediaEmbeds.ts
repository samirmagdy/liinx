/**
 * Media Embed Utilities for 100% genuine inline media playback.
 * Supports Spotify, YouTube, Vimeo, SoundCloud, and Apple Music.
 */

export function getSpotifyEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Handle spotify:type:id URI
  const uriMatch = cleanUrl.match(/^spotify:(track|album|playlist|artist|episode):([a-zA-Z0-9]+)/i);
  if (uriMatch) {
    return `https://open.spotify.com/embed/${uriMatch[1]}/${uriMatch[2]}?utm_source=generator&theme=0`;
  }

  // Handle open.spotify.com URL
  const urlMatch = cleanUrl.match(/open\.spotify\.com\/(track|album|playlist|artist|episode)\/([a-zA-Z0-9]+)/i);
  if (urlMatch) {
    return `https://open.spotify.com/embed/${urlMatch[1]}/${urlMatch[2]}?utm_source=generator&theme=0`;
  }

  if (cleanUrl.includes('open.spotify.com/embed/')) {
    return cleanUrl;
  }

  return null;
}

export function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  let parsed: URL;
  try { parsed = new URL(cleanUrl); } catch { return null; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  const host = parsed.hostname.toLowerCase();
  let videoId: string | null = null;
  if (host === 'youtu.be') {
    videoId = parsed.pathname.slice(1).split('/')[0] || null;
  } else if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com' || host === 'www.youtube-nocookie.com') {
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    videoId = pathParts[0] === 'watch' ? parsed.searchParams.get('v') : pathParts[0] === 'embed' || pathParts[0] === 'shorts' || pathParts[0] === 'v' ? pathParts[1] || null : null;
  }
  if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;

  return null;
}

export function getVimeoEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  let parsed: URL;
  try { parsed = new URL(cleanUrl); } catch { return null; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  const host = parsed.hostname.toLowerCase();
  if (host !== 'vimeo.com' && host !== 'www.vimeo.com' && host !== 'player.vimeo.com') return null;
  const videoId = parsed.pathname.match(/(?:^|\/)(\d+)(?:$|\/)/)?.[1];
  if (videoId) return `https://player.vimeo.com/video/${videoId}`;

  return null;
}

export function getSoundCloudEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  if (cleanUrl.includes('soundcloud.com/')) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(cleanUrl)}&color=%2310b981&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
  }

  return null;
}

export function getAppleMusicEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  if (cleanUrl.includes('music.apple.com/')) {
    return cleanUrl.replace('https://music.apple.com/', 'https://embed.music.apple.com/');
  }

  return null;
}

export function isDirectAudioFile(url?: string): boolean {
  if (!url) return false;
  return /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(url.trim());
}

export function isDirectVideoFile(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return ['http:', 'https:'].includes(parsed.protocol) && /\.(mp4|webm|ogv|mov)$/i.test(parsed.pathname);
  } catch { return false; }
}
