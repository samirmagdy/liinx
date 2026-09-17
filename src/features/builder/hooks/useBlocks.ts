import { useState, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { CreatorProfile, CreatorPage, ProfileBlock, FolderBlock } from '../../../types';
import { api } from '../../../services/api';

interface UseBlocksProps {
  profile: CreatorProfile;
  profileRef: MutableRefObject<CreatorProfile>;
  setProfile: Dispatch<SetStateAction<CreatorProfile>>;
  activePage?: CreatorPage;
  enqueueBlockSave: (blockId: string, patch: Partial<ProfileBlock> | Record<string, any>) => void;
  flushQueue: () => Promise<boolean>;
  setSaveStatus: (status: 'saved' | 'saving' | 'error') => void;
  setDataError: (error: boolean) => void;
}

export function useBlocks({
  profile,
  profileRef,
  setProfile,
  activePage,
  enqueueBlockSave,
  flushQueue,
  setSaveStatus,
  setDataError
}: UseBlocksProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [confirmDeleteBlockId, setConfirmDeleteBlockId] = useState<string | null>(null);

  const visibleBlocks = activePage
    ? profile.blocks.filter(block => !(block as any).pageId || (block as any).pageId === activePage.id)
    : profile.blocks;

  const createBlockForPage = (data: { type: string; title: string; [key: string]: any }) =>
    api.studio.createBlock({ ...data, pageId: activePage?.id || undefined });

  const handleAddLink = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'link',
        title: 'Untitled link',
        url: null,
        subtitle: 'Add a destination before publishing',
        badge: null,
        highlighted: false
      });
      setProfile(prev => ({ ...prev, blocks: [newBlock, ...prev.blocks] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add link block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddHeader = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'header',
        title: 'New Section Header'
      });
      setProfile(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add header block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddAudio = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'audio',
        title: 'Add an audio track',
        url: '',
        extra: {
          artist: profile.displayName,
          coverUrl: '',
          audioUrl: '',
          platform: 'spotify'
        }
      });
      setProfile(prev => ({ ...prev, blocks: [newBlock, ...prev.blocks] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add audio block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddVideo = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'video',
        title: 'Add a video',
        url: '',
        extra: {
          videoUrl: '',
          thumbnailUrl: '',
          platform: 'youtube'
        }
      });
      setProfile(prev => ({ ...prev, blocks: [newBlock, ...prev.blocks] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add video block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddFolder = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'folder',
        title: 'Curated Resource Links',
        extra: {
          subtitle: 'Expandable collection of destinations',
          items: [
            { id: 'f_1', title: 'Main Project', url: 'https://github.com' },
            { id: 'f_2', title: 'Documentation', url: 'https://liinx.app/features' }
          ]
        }
      });
      setProfile(prev => ({ ...prev, blocks: [newBlock, ...prev.blocks] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add folder block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddNewsletter = async () => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({
        type: 'newsletter',
        title: 'Weekly Creator Dispatch',
        extra: {
          description: 'Get weekly essays, behind-the-scenes thoughts, and exclusive releases.',
          buttonText: 'Join Newsletter'
        }
      });
      setProfile(prev => ({ ...prev, blocks: [newBlock, ...prev.blocks] }));
      setShowAddMenu(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add newsletter block:', err);
      setSaveStatus('error');
    }
  };

  const handleAddAdvancedBlock = async (type: string) => {
    const defaults: Record<string, { title: string; subtitle?: string; extra?: Record<string, unknown> }> = {
      rich_text: { title: 'About this work', extra: { body: 'Add your story, services, or introduction here.' } },
      image: { title: 'Featured image', extra: { imageUrl: '', alt: '', caption: '' } },
      gallery: { title: 'Gallery', extra: { items: [{ id: 'item-1', imageUrl: '', alt: '' }] } },
      carousel: { title: 'Highlights', extra: { items: [{ id: 'item-1', imageUrl: '', alt: '' }] } },
      spacer: { title: 'Spacer', extra: { height: 48 } },
      form: {
        title: 'Get in touch',
        subtitle: 'Send me a message.',
        extra: {
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'message', label: 'Message', type: 'textarea', required: true }
          ]
        }
      },
      download: { title: 'Download', extra: { fileUrl: '', description: 'Download this file.' } },
      map: { title: 'Find me', extra: { location: '' } },
      faq: { title: 'Frequently asked questions', extra: { items: [] } },
      testimonials: { title: 'What clients say', extra: { items: [{ id: 'item-1', quote: 'A great experience.', name: 'Client name' }] } },
      event: { title: 'Upcoming event', extra: { date: '', time: '', timezone: '', location: '', description: '', artworkUrl: '', url: '' } },
      presave: { title: 'External release link', extra: { url: '', description: '' } },
      phone: { title: 'Direct contact', extra: { contactType: 'phone', phone: '', email: '', subject: '', body: '', description: '', availability: '' } },
      product: { title: 'Featured product', extra: { price: '', priceAmount: '', currency: '', imageUrl: '', url: '', description: '' } },
      tips: { title: 'External support link', extra: { url: '', description: '' } },
      content_gate: { title: 'Members-only content', extra: { password: '', description: 'Enter the access code.', body: 'Add the protected content here.' } }
    };
    const preset = defaults[type] || defaults.rich_text;
    try {
      const newBlock = await createBlockForPage({
        type: type as any,
        title: preset.title,
        subtitle: preset.subtitle,
        extra: preset.extra
      });
      setProfile(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
      setShowAddMenu(false);
    } catch {
      setDataError(true);
    }
  };

  const handleMoveBlock = async (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...visibleBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    try {
      setSaveStatus('saving');
      await api.studio.reorderBlocks(newBlocks.map(b => b.id), activePage?.id);
      setProfile(prev => {
        let reorderedIndex = 0;
        const visibleIds = new Set(visibleBlocks.map(block => block.id));
        return {
          ...prev,
          blocks: prev.blocks.map(block => (visibleIds.has(block.id) ? newBlocks[reorderedIndex++] : block))
        };
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleDuplicateBlock = async (blockId: string) => {
    if (!activePage || !(await flushQueue())) return;
    try {
      setSaveStatus('saving');
      const result = await api.studio.duplicateBlock(blockId, activePage.id);
      setProfile(previous => ({ ...previous, blocks: [...previous.blocks, result.block] }));
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!(await flushQueue())) return;
    try {
      setSaveStatus('saving');
      await api.studio.deleteBlock(id);
      setProfile(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }));
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleUpdateBlockField = (id: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => (b.id === id ? { ...b, [field]: value } : b))
    }));
    enqueueBlockSave(id, { [field]: value });
  };

  const handleUpdateBlockExtra = (id: string, extraUpdates: Record<string, any>) => {
    setProfile(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => (b.id === id ? { ...b, ...extraUpdates } : b))
    }));
    enqueueBlockSave(id, { extra: extraUpdates });
  };

  // Folder Block item helpers
  const handleAddFolderItem = (blockId: string) => {
    const block = profile.blocks.find(b => b.id === blockId) as FolderBlock;
    if (!block) return;
    const currentItems = block.items || [];
    const newItems = [
      ...currentItems,
      { id: 'fi_' + Date.now(), title: 'Untitled folder link', url: '', subtitle: 'Add a destination before publishing' }
    ];
    handleUpdateBlockExtra(blockId, { items: newItems });
  };

  const handleMoveFolderItem = (blockId: string, itemId: string, direction: -1 | 1) => {
    const block = profile.blocks.find(b => b.id === blockId) as FolderBlock;
    if (!block) return;
    const items = [...(block.items || [])];
    const index = items.findIndex(item => item.id === itemId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= items.length) return;
    [items[index], items[next]] = [items[next], items[index]];
    handleUpdateBlockExtra(blockId, { items });
  };

  const handleRemoveFolderItem = (blockId: string, itemId: string) => {
    const block = profile.blocks.find(b => b.id === blockId) as FolderBlock;
    if (!block) return;
    const newItems = (block.items || []).filter(item => item.id !== itemId);
    handleUpdateBlockExtra(blockId, { items: newItems });
  };

  const handleUpdateFolderItem = (blockId: string, itemId: string, field: 'title' | 'url', val: string) => {
    const block = profile.blocks.find(b => b.id === blockId) as FolderBlock;
    if (!block) return;
    const newItems = (block.items || []).map(item =>
      item.id === itemId ? { ...item, [field]: val } : item
    );
    handleUpdateBlockExtra(blockId, { items: newItems });
  };

  const handleAddBookingBlock = async (title: string, url: string) => {
    try {
      setSaveStatus('saving');
      const newBlock = await createBlockForPage({ type: 'booking', title, url });
      setProfile(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
      console.error('Failed to create booking block', err);
    }
  };

  return {
    visibleBlocks,
    showAddMenu,
    setShowAddMenu,
    confirmDeleteBlockId,
    setConfirmDeleteBlockId,
    handleAddLink,
    handleAddHeader,
    handleAddAudio,
    handleAddVideo,
    handleAddFolder,
    handleAddNewsletter,
    handleAddAdvancedBlock,
    handleAddBookingBlock,
    handleMoveBlock,
    handleDuplicateBlock,
    handleDeleteBlock,
    handleUpdateBlockField,
    handleUpdateBlockExtra,
    handleAddFolderItem,
    handleMoveFolderItem,
    handleRemoveFolderItem,
    handleUpdateFolderItem
  };
}
