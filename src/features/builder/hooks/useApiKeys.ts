import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../../../services/api';
import { friendlyErrorMessage } from '../../../utils/errors';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { type ApiKeyItem, type BuilderTab } from '../types/builder.types';

interface UseApiKeysProps {
  activeTab: BuilderTab;
  plan: string;
}

export function useApiKeys({ activeTab, plan }: UseApiKeysProps) {
  const { tr: ui } = useUiLanguage();
  const [apiKeyList, setApiKeyList] = useState<ApiKeyItem[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [generateKeyError, setGenerateKeyError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [confirmRevokeKeyId, setConfirmRevokeKeyId] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const loadApiKeys = () => {
    api.studio.getApiKeys()
      .then(res => {
        if (res && Array.isArray(res.keys)) {
          setApiKeyList(res.keys);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (activeTab === 'settings' && plan === 'studio') {
      loadApiKeys();
    }
  }, [activeTab, plan]);

  const handleGenerateApiKeySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || isGeneratingKey) return;
    setIsGeneratingKey(true);
    setGenerateKeyError(null);
    try {
      const res = await api.studio.createApiKey(newKeyName.trim());
      setCreatedApiKey(res.apiKey);
      loadApiKeys();
    } catch (err: any) {
      setGenerateKeyError(friendlyErrorMessage(err, 'We could not generate the API key. Please try again.'));
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    setApiKeyError(null);
    try {
      await api.studio.revokeApiKey(keyId);
      setConfirmRevokeKeyId(null);
      loadApiKeys();
    } catch (err: any) {
      setApiKeyError(friendlyErrorMessage(err, ui('Failed to revoke key')));
    }
  };

  const handleCopyKey = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // Fallback or ignore
    }
  };

  return {
    apiKeyList,
    showNewKeyModal,
    setShowNewKeyModal,
    newKeyName,
    setNewKeyName,
    createdApiKey,
    setCreatedApiKey,
    isGeneratingKey,
    generateKeyError,
    copiedKey,
    confirmRevokeKeyId,
    setConfirmRevokeKeyId,
    apiKeyError,
    loadApiKeys,
    handleGenerateApiKeySubmit,
    handleRevokeApiKey,
    handleCopyKey
  };
}
