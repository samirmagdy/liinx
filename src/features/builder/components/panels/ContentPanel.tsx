import React, { useState } from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { SocialLinksEditor } from '../social/SocialLinksEditor';
import { PageManager } from '../pages/PageManager';
import { AddBlockMenu } from '../blocks/AddBlockMenu';
import { BlockList } from '../blocks/BlockList';
import { BookingEditor } from '../../../../components/BookingEditor';
import { AvatarUploader } from './AvatarUploader';
import { IdentityFields } from './IdentityFields';
import { UsernameChangeDialog } from './UsernameChangeDialog';

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export const ContentPanel: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile, setProfile, handleUsernameBlur, handleAddBookingBlock } = useBuilder();

  const [pendingUsername, setPendingUsername] = useState<string | null>(null);

  const isChangeRequested =
    pendingUsername !== null &&
    pendingUsername !== profile.username &&
    USERNAME_PATTERN.test(profile.username);

  const confirmUsernameChange = () => {
    setPendingUsername(null);
    void handleUsernameBlur();
  };

  const cancelUsernameChange = () => {
    if (pendingUsername !== null) {
      setProfile(previous => ({ ...previous, username: pendingUsername }));
    }
    setPendingUsername(null);
  };

  const rememberStartingUsername = () => {
    if (pendingUsername === null) {
      setPendingUsername(profile.username);
    }
  };

  const releasePendingUsername = () => {
    if (isChangeRequested) return;
    setPendingUsername(null);
    void handleUsernameBlur();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile Bio & Avatar Card */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-neutral-900">{ui("Creator Identity")}</h2>
          <span className="text-[11px] font-mono uppercase tracking-caps bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md">
            {ui("Published autosave")}
          </span>
        </div>

        <AvatarUploader />

        <IdentityFields
          onUsernameFocus={rememberStartingUsername}
          onUsernameBlur={releasePendingUsername}
        />

        {/* Social Links Manager */}
        <SocialLinksEditor />
      </div>

      {/* Pages Section */}
      <PageManager />

      {/* Booking Block Section */}
      <BookingEditor onSave={handleAddBookingBlock} />

      {/* Add Block & Importer */}
      <AddBlockMenu />

      {/* Block List */}
      <BlockList />

      <UsernameChangeDialog
        open={isChangeRequested}
        previousUsername={pendingUsername}
        onCancel={cancelUsernameChange}
        onConfirm={confirmUsernameChange}
      />
    </div>
  );
};
