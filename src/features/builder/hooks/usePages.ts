import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { type CreatorProfile, type CreatorPage } from '../../../types';
import { api } from '../../../services/api';
import { friendlyErrorMessage } from '../../../utils/errors';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { notifyPagePublished } from '../utils/publishEvents';

interface PageEdit {
  title: string;
  slug: string;
  description: string;
  published: boolean;
}

/** The stored shape of a page edit. The home page is always reachable, so it never sends false. */
function pageEditPayload(activePage: CreatorPage, edit: PageEdit) {
  return {
    title: edit.title,
    slug: edit.slug,
    description: edit.description.trim() || null,
    published: activePage.isHome ? true : edit.published
  };
}

interface UsePagesProps {
  profile: CreatorProfile;
  setProfile: Dispatch<SetStateAction<CreatorProfile>>;
  flushQueue: () => Promise<boolean>;
  setSaveStatus: (status: 'saved' | 'saving' | 'error') => void;
}

export function usePages({
  profile,
  setProfile,
  flushQueue,
  setSaveStatus
}: UsePagesProps) {
  const { tr: ui } = useUiLanguage();
  const pages = useMemo(() => profile.pages || [], [profile.pages]);
  const initialPageId = profile.page?.id || pages.find(page => page.isHome)?.id || pages[0]?.id || '';

  const [activePageId, setActivePageId] = useState(initialPageId);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [pageEditTitle, setPageEditTitle] = useState('');
  const [pageEditSlug, setPageEditSlug] = useState('');
  const [pageEditDescription, setPageEditDescription] = useState('');
  const [pageEditPublished, setPageEditPublished] = useState(true);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [pageManagerError, setPageManagerError] = useState<string | null>(null);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);

  const activePage = pages.find(page => page.id === activePageId) || pages.find(page => page.isHome);

  useEffect(() => {
    const page = pages.find(item => item.id === activePageId);
    if (!page) return;
    setPageEditTitle(page.title);
    setPageEditSlug(page.slug);
    setPageEditDescription(page.description || '');
    setPageEditPublished(page.published);
  }, [activePageId, pages]);

  const handleCreatePage = async () => {
    const title = newPageTitle.trim();
    const slug = newPageSlug.trim().toLowerCase();
    if (!title || !slug) return setPageManagerError(ui('Enter a page title and URL slug.'));
    try {
      const result = await api.studio.createPage({ title, slug });
      setProfile(previous => ({ ...previous, pages: [...(previous.pages || []), result.page] }));
      setActivePageId(result.page.id);
      setNewPageTitle('');
      setNewPageSlug('');
      setPageManagerError(null);
    } catch (error: any) {
      setPageManagerError(friendlyErrorMessage(error, ui('Could not create this page.')));
    }
  };

  const handleDeletePage = async (pageId: string) => {
    const page = pages.find(item => item.id === pageId);
    if (!page || page.isHome) return;
    try {
      if (!(await flushQueue())) {
        setPageManagerError(ui('Changes are not saved. Retry before deleting this page.'));
        return;
      }
      await api.studio.deletePage(pageId);
      const nextPages = pages.filter(item => item.id !== pageId);
      if (activePageId === pageId) {
        setActivePageId(nextPages.find(item => item.isHome)?.id || nextPages[0]?.id || '');
      }
      const refreshed = await api.studio.getProfile();
      setProfile(refreshed);
      setDeletePageId(null);
      setPageManagerError(null);
    } catch (error: any) {
      setPageManagerError(friendlyErrorMessage(error, ui('Could not delete this page.')));
    }
  };

  const handleSavePage = async () => {
    if (!activePage || isSavingPage) return;
    const payload = pageEditPayload(activePage, {
      title: pageEditTitle.trim(),
      slug: pageEditSlug.trim().toLowerCase(),
      description: pageEditDescription,
      published: pageEditPublished
    });
    if (!payload.title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
      setPageManagerError(ui('Use a title and a lowercase URL slug with hyphens only.'));
      return;
    }
    setIsSavingPage(true);
    try {
      const result = await api.studio.updatePage(activePage.id, { ...payload, revision: activePage.revision });
      const updated: CreatorPage = { ...activePage, ...payload, revision: result.revision ?? activePage.revision };
      setProfile(previous => ({ ...previous, pages: (previous.pages || []).map(page => (page.id === activePage.id ? updated : page)) }));
      setPageManagerError(null);
      // The share moment belongs to the moment a page actually becomes reachable.
      if (payload.published && !activePage.published) notifyPagePublished(activePage.id);
    } catch (error: any) {
      setPageManagerError(friendlyErrorMessage(error, ui('Could not save page settings.')));
    } finally {
      setIsSavingPage(false);
    }
  };

  const handleMovePage = async (direction: -1 | 1) => {
    const index = pages.findIndex(page => page.id === activePage?.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= pages.length) return;
    const reordered = [...pages];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    try {
      const result = await api.studio.reorderPages(reordered.map(page => page.id));
      setProfile(previous => ({
        ...previous,
        pages: result.pages || reordered.map((page, sortOrder) => ({ ...page, sortOrder }))
      }));
    } catch (error: any) {
      setPageManagerError(friendlyErrorMessage(error, ui('Could not reorder pages.')));
    }
  };

  const handleMoveBlockToPage = async (blockId: string, pageId: string) => {
    if (!pageId || !(await flushQueue())) return;
    try {
      setSaveStatus('saving');
      await api.studio.moveBlock(blockId, pageId);
      const refreshed = await api.studio.getProfile();
      setProfile(refreshed);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  return {
    pages,
    activePage,
    activePageId,
    setActivePageId,
    newPageTitle,
    setNewPageTitle,
    newPageSlug,
    setNewPageSlug,
    pageEditTitle,
    setPageEditTitle,
    pageEditSlug,
    setPageEditSlug,
    pageEditDescription,
    setPageEditDescription,
    pageEditPublished,
    setPageEditPublished,
    isSavingPage,
    pageManagerError,
    setPageManagerError,
    deletePageId,
    setDeletePageId,
    handleCreatePage,
    handleDeletePage,
    handleSavePage,
    handleMovePage,
    handleMoveBlockToPage
  };
}
