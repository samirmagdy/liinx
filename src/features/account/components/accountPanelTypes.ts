import type { FormEvent } from 'react';
import type { AccountProfileSummary } from '../hooks/useAccountProfiles';
import type { AccountApiKey } from '../hooks/useApiKeys';

export type AccountMessage = { type: 'success' | 'error'; text: string } | null;

export type ProfileSettingsPanelProps = {
  ar: boolean;
  newEmail: string;
  setNewEmail: (value: string) => void;
  emailPassword: string;
  setEmailPassword: (value: string) => void;
  emailLoading: boolean;
  emailMessage: AccountMessage;
  handleUpdateEmail: (event: FormEvent) => void;
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  passwordLoading: boolean;
  passwordMessage: AccountMessage;
  handleChangePassword: (event: FormEvent) => void;
};

export type BillingSettingsPanelProps = {
  ar: boolean;
  currentPlan: string;
  profilesCount: number;
  hasActiveSubscription: boolean;
  setLocation: (path: string) => void;
  openBillingPortal: () => Promise<void>;
};

export type ProfilesSettingsPanelProps = {
  ar: boolean;
  profilesList: AccountProfileSummary[];
  profilesLoading: boolean;
  setLocation: (path: string) => void;
  selectProfile: (profileId: string) => Promise<void>;
};

export type DeveloperSettingsPanelProps = {
  ar: boolean;
  currentPlan: string;
  setLocation: (path: string) => void;
  apiKeys: AccountApiKey[];
  newKeyName: string;
  setNewKeyName: (value: string) => void;
  generatedKey: string | null;
  copiedKey: boolean;
  keyLoading: boolean;
  createApiKey: (event: FormEvent) => void;
  revokeApiKey: (keyId: string) => void;
  copyGeneratedKey: () => void;
};

export type SecuritySettingsPanelProps = {
  ar: boolean;
  exportLoading: boolean;
  handleExportData: () => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (value: string) => void;
  deletePassword: string;
  setDeletePassword: (value: string) => void;
  deleteLoading: boolean;
  deleteError: string | null;
  handleDeleteAccount: () => void;
};
