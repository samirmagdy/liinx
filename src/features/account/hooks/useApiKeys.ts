import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../../services/api';
import { useProductFeedback } from '../../../components/ProductFeedback';

export type AccountApiKey = { id: string; name: string; prefix: string; createdAt: number };

export function useApiKeys(user: { id: string } | null, plan: string | undefined, ar: boolean) {
  const { confirm, notify } = useProductFeedback();
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
      notify(error instanceof Error ? error.message : (ar ? 'تعذر إنشاء مفتاح API' : 'Failed to create API key'));
    } finally {
      setKeyLoading(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    const accepted = await confirm(ar ? 'هل تريد إلغاء مفتاح API هذا؟ لن تتمكن الأنظمة التي تستخدمه من الوصول بعد ذلك.' : 'Revoke this API key? Systems using it will lose access.', {
      title: ar ? 'إلغاء مفتاح API' : 'Revoke API key',
      confirmLabel: ar ? 'إلغاء المفتاح' : 'Revoke key',
      cancelLabel: ar ? 'إبقاء المفتاح' : 'Keep key',
      destructive: true
    });
    if (!accepted) return;
    try {
      await api.studio.revokeApiKey(keyId);
      setApiKeys(previous => previous.filter(key => key.id !== keyId));
    } catch {
      notify(ar ? 'تعذر إلغاء المفتاح' : 'Failed to revoke API key');
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
