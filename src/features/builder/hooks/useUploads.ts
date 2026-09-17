import React, { useState, useRef, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { CreatorProfile } from '../../../types';
import { api } from '../../../services/api';
import { friendlyErrorMessage } from '../../../utils/errors';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';

interface UseUploadsProps {
  profile: CreatorProfile;
  profileRef: MutableRefObject<CreatorProfile>;
  setProfile: Dispatch<SetStateAction<CreatorProfile>>;
  triggerAutoSave: (patch: Partial<CreatorProfile>) => void;
  enqueueBlockSave: (blockId: string, patch: Record<string, any>) => void;
  flushQueue: () => Promise<boolean>;
  setSaveStatus: (status: 'saved' | 'saving' | 'error') => void;
  setSaveErrorBanner: (banner: string | null) => void;
  setBackgroundMediaUrlInput: (url: string) => void;
  setBackgroundMediaTypeInput: (type: 'image' | 'video') => void;
  setPageSettingsFeedback: (feedback: string | null) => void;
}

export function useUploads({
  profile,
  profileRef,
  setProfile,
  triggerAutoSave,
  enqueueBlockSave,
  flushQueue,
  setSaveStatus,
  setSaveErrorBanner,
  setBackgroundMediaUrlInput,
  setBackgroundMediaTypeInput,
  setPageSettingsFeedback
}: UseUploadsProps) {
  const { tr: ui } = useUiLanguage();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setAvatarError(null);
    try {
      const res = await api.studio.uploadImage(file);
      const updated = { ...profile, avatarUrl: res.url };
      setProfile(updated);
      triggerAutoSave({ avatarUrl: res.url });
    } catch (err: any) {
      setAvatarError(friendlyErrorMessage(err, ui('Image upload failed')));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBlockImageUpload = async (
    blockId: string,
    file: File,
    field = 'imageUrl',
    itemIndex?: number,
    itemId?: string
  ) => {
    try {
      setSaveStatus('saving');
      const uploaded = await api.studio.uploadImage(file);
      if (!(await flushQueue())) {
        throw new Error(ui('Changes are not saved. Check your connection and retry.'));
      }
      const block = profileRef.current.blocks.find(candidate => candidate.id === blockId) as any;
      const current = block?.items || [];
      if (itemId && !current.some((item: any) => item?.id === itemId)) {
        throw new Error(ui('This gallery item was removed before the upload finished.'));
      }
      const nextItems =
        itemIndex === undefined && !itemId
          ? current
          : current.map((item: any, index: number) =>
              (itemId ? item?.id === itemId : index === itemIndex)
                ? { ...item, [field]: uploaded.url }
                : item
            );
      enqueueBlockSave(
        blockId,
        itemIndex === undefined
          ? { extra: { [field]: uploaded.url } }
          : { extra: { items: nextItems } }
      );
      if (!(await flushQueue())) {
        throw new Error(ui('Changes are not saved. Check your connection and retry.'));
      }
      setProfile(previous => ({
        ...previous,
        blocks: previous.blocks.map(candidate =>
          candidate.id === blockId
            ? ({
                ...candidate,
                ...(itemIndex === undefined
                  ? { [field]: uploaded.url }
                  : { items: nextItems })
              } as any)
            : candidate
        )
      }));
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      setSaveErrorBanner(friendlyErrorMessage(error, ui('Image upload failed')));
    }
  };

  const handleBlockFileUpload = async (blockId: string, file: File) => {
    let uploaded: { url: string; originalName: string; size: number; mimeType: string } | null = null;
    try {
      setSaveStatus('saving');
      uploaded = await api.studio.uploadFile(file);
      if (!(await flushQueue())) {
        throw new Error(ui('Changes are not saved. Check your connection and retry.'));
      }
      enqueueBlockSave(blockId, {
        extra: {
          fileUrl: uploaded.url,
          downloadName: uploaded.originalName,
          sizeBytes: uploaded.size,
          mimeType: uploaded.mimeType
        }
      });
      if (!(await flushQueue())) {
        throw new Error(ui('Changes are not saved. Check your connection and retry.'));
      }
      setProfile(previous => ({
        ...previous,
        blocks: previous.blocks.map(candidate =>
          candidate.id === blockId
            ? ({
                ...candidate,
                fileUrl: uploaded!.url,
                downloadName: uploaded!.originalName,
                sizeBytes: uploaded!.size,
                mimeType: uploaded!.mimeType
              } as any)
            : candidate
        )
      }));
      setSaveStatus('saved');
    } catch (error) {
      if (uploaded) await api.studio.deleteUploadedFile(uploaded.url).catch(() => {});
      setSaveStatus('error');
      setSaveErrorBanner(friendlyErrorMessage(error, ui('File upload failed')));
    }
  };

  const handleBackgroundImageUpload = async (file: File) => {
    if (profile.plan === 'free') return;
    setPageSettingsFeedback(null);
    setUploadingImage(true);
    try {
      const uploaded = await api.studio.uploadImage(file);
      setBackgroundMediaUrlInput(uploaded.url);
      setBackgroundMediaTypeInput('image');
      setPageSettingsFeedback(ui('Background image uploaded. Save public page settings to apply it.'));
    } catch (error) {
      setPageSettingsFeedback(friendlyErrorMessage(error, ui('Background image upload failed.')));
    } finally {
      setUploadingImage(false);
    }
  };

  return {
    uploadingImage,
    avatarError,
    setAvatarError,
    fileInputRef,
    handleAvatarFileSelect,
    handleBlockImageUpload,
    handleBlockFileUpload,
    handleBackgroundImageUpload
  };
}
