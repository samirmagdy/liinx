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

  // Extract 11-character YouTube video ID
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  return null;
}

export function getVimeoEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`;
  }

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
  return /\.(mp4|webm|ogv|mov)(\?.*)?$/i.test(url.trim());
}
