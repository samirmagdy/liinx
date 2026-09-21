/** Two letters to show in place of a photo the creator has not uploaded yet. */
export function avatarInitials(name: string): string {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  return (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
}
