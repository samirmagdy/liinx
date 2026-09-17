import { useState, type Dispatch, type SetStateAction } from 'react';
import { type CreatorProfile, type SocialLink } from '../../../types';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';

interface UseSocialLinksProps {
  profile: CreatorProfile;
  setProfile: Dispatch<SetStateAction<CreatorProfile>>;
  triggerAutoSave: (patch: Partial<CreatorProfile>) => void;
}

const SOCIAL_DOMAINS: Record<string, string[]> = {
  instagram: ['instagram.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'],
  spotify: ['spotify.com'],
  twitter: ['twitter.com', 'x.com'],
  github: ['github.com'],
  linkedin: ['linkedin.com']
};

export function useSocialLinks({
  profile,
  setProfile,
  triggerAutoSave
}: UseSocialLinksProps) {
  const { tr: ui } = useUiLanguage();
  const [newSocialPlatform, setNewSocialPlatform] = useState<SocialLink['platform']>('instagram');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [socialError, setSocialError] = useState<string | null>(null);
  const [socialDrafts, setSocialDrafts] = useState<Record<number, string>>({});

  const validateSocialUrl = (platform: SocialLink['platform'], raw: string) => {
    const value = raw.trim();
    if (!value) return ui('Enter a social link.');
    if (platform === 'email') {
      return /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(value)
        ? null
        : ui('Use a valid mailto email address.');
    }
    if (platform === 'phone') {
      const digits = value.replace(/\D/g, '');
      return /^tel:\+?[0-9][0-9 ()-]{3,24}$/i.test(value) && digits.length >= 4
        ? null
        : ui('Use a valid tel phone number.');
    }
    try {
      const parsed = new URL(value);
      const host = parsed.hostname.toLowerCase();
      const validHost = (SOCIAL_DOMAINS[platform] || []).some(
        domain => host === domain || host.endsWith(`.${domain}`)
      );
      return ['http:', 'https:'].includes(parsed.protocol) && validHost
        ? null
        : ui('Use the selected provider URL.');
    } catch {
      return ui('Enter a valid URL.');
    }
  };

  const persistSocials = (updatedSocials: SocialLink[]) => {
    setProfile(previous => ({ ...previous, socials: updatedSocials }));
    triggerAutoSave({ socials: updatedSocials });
    setSocialDrafts({});
  };

  const handleAddSocial = () => {
    const cleanUrl = newSocialUrl.trim();
    const validationError = validateSocialUrl(newSocialPlatform, cleanUrl);
    if (validationError) {
      setSocialError(validationError);
      return;
    }
    const currentSocials = profile.socials || [];
    if (
      currentSocials.some(
        social => social.url.trim().toLowerCase() === cleanUrl.toLowerCase()
      )
    ) {
      setSocialError(ui('That social link is already added.'));
      return;
    }
    const updatedSocials = [...currentSocials, { platform: newSocialPlatform, url: cleanUrl }];
    setSocialError(null);
    persistSocials(updatedSocials);
    setNewSocialUrl('');
  };

  const handleEditSocial = (index: number, value: string) => {
    const currentSocials = profile.socials || [];
    const social = currentSocials[index];
    if (!social) return;
    const validationError = validateSocialUrl(social.platform, value);
    if (validationError) {
      setSocialError(validationError);
      return;
    }
    if (
      currentSocials.some(
        (candidate, candidateIndex) =>
          candidateIndex !== index &&
          candidate.url.trim().toLowerCase() === value.trim().toLowerCase()
      )
    ) {
      setSocialError(ui('That social link is already added.'));
      return;
    }
    setSocialError(null);
    persistSocials(
      currentSocials.map((candidate, candidateIndex) =>
        candidateIndex === index ? { ...candidate, url: value.trim() } : candidate
      )
    );
  };

  const handleMoveSocial = (index: number, direction: -1 | 1) => {
    const currentSocials = profile.socials || [];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= currentSocials.length) return;
    const updatedSocials = [...currentSocials];
    [updatedSocials[index], updatedSocials[nextIndex]] = [
      updatedSocials[nextIndex],
      updatedSocials[index]
    ];
    setSocialError(null);
    persistSocials(updatedSocials);
  };

  const handleRemoveSocial = (index: number) => {
    const currentSocials = profile.socials || [];
    const updatedSocials = currentSocials.filter((_, i) => i !== index);
    setSocialError(null);
    persistSocials(updatedSocials);
  };

  return {
    newSocialPlatform,
    setNewSocialPlatform,
    newSocialUrl,
    setNewSocialUrl,
    socialError,
    setSocialError,
    socialDrafts,
    setSocialDrafts,
    validateSocialUrl,
    handleAddSocial,
    handleEditSocial,
    handleMoveSocial,
    handleRemoveSocial
  };
}
