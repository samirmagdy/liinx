import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../../services/api';

export type AccountApiKey = { id: string; name: string; prefix: string; createdAt: number };

export function useApiKeys(user: { id: string } | null, plan: string | undefined, ar: boolean) {
  const [apiKeys, setApiKeys] = useState<AccountApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);

  useEffect(() => {
    if (user && plan === 'studio') {
      api.studio.getApiKeys()
        .then(data => { if (data.keys) setApiKeys(data.keys); })
        .catch(() => {});
    }
  }, [user, plan]);

  const createApiKey = async (event: FormEvent) => {
    event.preventDefault();
    if (!newKeyName.trim()) return;
    setKeyLoading(true);
    try {
      const data = await api.studio.createApiKey(newKeyName.trim());
      setGeneratedKey(data.apiKey);
      setApiKeys(previous => [data.key, ...previous]);
      setNewKeyName('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create API key');
    } finally {
      setKeyLoading(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm(ar ? 'هل أنت متأكد من إلغاء هذا المفتاح؟' : 'Are you sure you want to revoke this API key?')) return;
    try {
      await api.studio.revokeApiKey(keyId);
      setApiKeys(previous => previous.filter(key => key.id !== keyId));
    } catch {
      alert(ar ? 'تعذر إلغاء المفتاح' : 'Failed to revoke API key');
    }
  };

  const copyGeneratedKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return { apiKeys, newKeyName, setNewKeyName, generatedKey, copiedKey, keyLoading, createApiKey, revokeApiKey, copyGeneratedKey };
}
