import { describe, it, expect } from 'vitest';
import { 
  getSpotifyEmbedUrl, 
  getYouTubeEmbedUrl, 
  getVimeoEmbedUrl, 
  getSoundCloudEmbedUrl, 
  getAppleMusicEmbedUrl, 
  isDirectAudioFile, 
  isDirectVideoFile 
} from '../src/utils/mediaEmbeds';

describe('Media Embed Utilities (0% Fake Implementation)', () => {
  it('converts Spotify track, album, and playlist URLs to official embeds', () => {
    const track = getSpotifyEmbedUrl('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=abc');
    expect(track).toBe('https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT?utm_source=generator&theme=0');

    const album = getSpotifyEmbedUrl('https://open.spotify.com/album/4m2880jivSbbyEGAKfITCa');
    expect(album).toBe('https://open.spotify.com/embed/album/4m2880jivSbbyEGAKfITCa?utm_source=generator&theme=0');

    const uri = getSpotifyEmbedUrl('spotify:track:4cOdK2wGLETKBW3PvgPWqT');
    expect(uri).toBe('https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT?utm_source=generator&theme=0');

    expect(getSpotifyEmbedUrl('https://example.com/audio.mp3')).toBeNull();
  });

  it('converts YouTube watch, short, and share URLs to privacy-enhanced embeds', () => {
    const watch = getYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(watch).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');

    const share = getYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(share).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');

    const shorts = getYouTubeEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    expect(shorts).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');
    expect(getYouTubeEmbedUrl('https://www.youtube.com/watch?v=short')).toBeNull();
    expect(getYouTubeEmbedUrl('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
  });

  it('converts Vimeo URLs to iframe embeds', () => {
    const vimeo = getVimeoEmbedUrl('https://vimeo.com/76979871');
    expect(vimeo).toBe('https://player.vimeo.com/video/76979871');
    expect(getVimeoEmbedUrl('https://vimeo.com.evil.example/76979871')).toBeNull();
  });

  it('detects SoundCloud and Apple Music embeds', () => {
    const sc = getSoundCloudEmbedUrl('https://soundcloud.com/artist/track');
    expect(sc).toContain('w.soundcloud.com/player');
    expect(sc).toContain('auto_play=false');
    expect(sc).toContain('single_active=true');
    expect(getSoundCloudEmbedUrl('https://soundcloud.com.evil.example/artist/track')).toBeNull();

    const apple = getAppleMusicEmbedUrl('https://music.apple.com/us/album/test/123');
    expect(apple).toContain('embed.music.apple.com/us/album/test/123');
    expect(getAppleMusicEmbedUrl('https://music.apple.com.evil.example/us/album/test/123')).toBeNull();
  });

  it('handles edge cases and variations across all embed and media checks', () => {
    // Empty / nullish
    expect(getSpotifyEmbedUrl()).toBeNull();
    expect(getSpotifyEmbedUrl('')).toBeNull();
    expect(getSpotifyEmbedUrl('https://other.example.com')).toBeNull();
    expect(getSpotifyEmbedUrl('spotify:artist:abc12345')).toContain('embed/artist/abc12345');
    expect(getSpotifyEmbedUrl('spotify:episode:abc12345')).toContain('embed/episode/abc12345');
    expect(getSpotifyEmbedUrl('https://open.spotify.com/embed/playlist/abc12345')).toContain('embed/playlist/abc12345');

    // YouTube variations
    expect(getYouTubeEmbedUrl()).toBeNull();
    expect(getYouTubeEmbedUrl('')).toBeNull();
    expect(getYouTubeEmbedUrl('not a url')).toBeNull();
    expect(getYouTubeEmbedUrl('ftp://youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(getYouTubeEmbedUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(getYouTubeEmbedUrl('https://youtube.com/embed/dQw4w9WgXcQ')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(getYouTubeEmbedUrl('https://youtube.com/v/dQw4w9WgXcQ')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(getYouTubeEmbedUrl('https://youtube-nocookie.com/embed/dQw4w9WgXcQ')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(getYouTubeEmbedUrl('https://youtu.be/')).toBeNull();

    // Vimeo variations
    expect(getVimeoEmbedUrl()).toBeNull();
    expect(getVimeoEmbedUrl('')).toBeNull();
    expect(getVimeoEmbedUrl('not a url')).toBeNull();
    expect(getVimeoEmbedUrl('https://player.vimeo.com/video/76979871')).toContain('player.vimeo.com/video/76979871');
    expect(getVimeoEmbedUrl('https://vimeo.com/no-id-here')).toBeNull();

    // SoundCloud & Apple Music variations
    expect(getSoundCloudEmbedUrl()).toBeNull();
    expect(getSoundCloudEmbedUrl('')).toBeNull();
    expect(getSoundCloudEmbedUrl('not a url')).toBeNull();
    expect(getSoundCloudEmbedUrl('https://soundcloud.com/')).toBeNull();

    expect(getAppleMusicEmbedUrl()).toBeNull();
    expect(getAppleMusicEmbedUrl('')).toBeNull();
    expect(getAppleMusicEmbedUrl('not a url')).toBeNull();
    expect(getAppleMusicEmbedUrl('https://music.apple.com/')).toBeNull();

    // Audio & Video variations
    expect(isDirectAudioFile()).toBe(false);
    expect(isDirectAudioFile('')).toBe(false);
    expect(isDirectAudioFile('not a url')).toBe(false);
    expect(isDirectAudioFile('https://example.com/audio.ogg')).toBe(true);
    expect(isDirectAudioFile('https://example.com/audio.m4a')).toBe(true);
    expect(isDirectAudioFile('https://example.com/audio.aac')).toBe(true);

    expect(isDirectVideoFile()).toBe(false);
    expect(isDirectVideoFile('')).toBe(false);
    expect(isDirectVideoFile('not a url')).toBe(false);
    expect(isDirectVideoFile('https://example.com/video.ogv')).toBe(true);
    expect(isDirectVideoFile('https://example.com/video.mov')).toBe(true);
  });
});
