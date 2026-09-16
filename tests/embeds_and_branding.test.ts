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

    const apple = getAppleMusicEmbedUrl('https://music.apple.com/us/album/test/123');
    expect(apple).toContain('embed.music.apple.com/us/album/test/123');
  });

  it('identifies direct audio and video media files', () => {
    expect(isDirectAudioFile('https://cdn.example.com/track.mp3')).toBe(true);
    expect(isDirectAudioFile('https://cdn.example.com/track.wav?download=1')).toBe(true);
    expect(isDirectAudioFile('https://spotify.com')).toBe(false);

    expect(isDirectVideoFile('https://cdn.example.com/clip.mp4')).toBe(true);
    expect(isDirectVideoFile('https://cdn.example.com/clip.webm')).toBe(true);
    expect(isDirectVideoFile('https://youtube.com')).toBe(false);
  });
});
