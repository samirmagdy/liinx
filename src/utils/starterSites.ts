import {
  templateBlockExtra,
  type CreatorPage,
  type CreatorProfile,
  type ProfileBlock,
  type SiteTemplate,
  type SocialLink
} from '../../shared/index.js';

export const HOME_PAGE_SLUG = 'home';

/** Preview copy for the one identity field a starter site cannot know before the handle exists. */
export const STARTER_SITE_NAME_PLACEHOLDER = 'Add your name';

export interface StarterSitePreviewOptions {
  /** Which page of the composition to project. Defaults to the home page. */
  pageSlug?: string;
  username?: string;
  displayName?: string;
  /** The account's existing home page title; a starter site never renames it. */
  homeTitle?: string;
  /** The account's own bio; applying a starter site only fills a bio that is still empty. */
  bio?: string;
  /** The account's own social rows; a starter site never authors them, so the caller supplies them. */
  socials?: SocialLink[];
}

const pageIdFor = (templateId: string, slug: string) => `preview-${templateId}-page-${slug}`;
const blockIdFor = (templateId: string, slug: string, index: number) => `preview-${templateId}-block-${slug}-${index}`;

/**
 * Projects a starter composition into the shape `GET /api/profiles/:username` returns.
 *
 * The ids are not the ones the server will mint — those only exist after apply — but every other
 * field is produced by the same shared helpers the write path uses, so a preview built here cannot
 * drift from the page a creator actually gets.
 */
export function starterSitePages(template: SiteTemplate, homeTitle: string): CreatorPage[] {
  return [
    {
      id: pageIdFor(template.id, HOME_PAGE_SLUG),
      slug: HOME_PAGE_SLUG,
      title: homeTitle,
      description: null,
      sortOrder: 0,
      isHome: true,
      published: true
    },
    ...(template.pages || []).map((page, index) => ({
      id: pageIdFor(template.id, page.slug),
      slug: page.slug,
      title: page.title,
      description: page.description || null,
      sortOrder: index + 1,
      isHome: false,
      published: true
    }))
  ];
}

export function starterSiteBlocks(template: SiteTemplate, pageSlug: string = HOME_PAGE_SLUG): ProfileBlock[] {
  const pageId = pageIdFor(template.id, pageSlug);
  return template.blocks
    .filter(block => (block.page || HOME_PAGE_SLUG) === pageSlug)
    .map((block, index) => ({
      id: blockIdFor(template.id, pageSlug, index),
      pageId,
      type: block.type,
      title: block.title,
      url: block.url || null,
      subtitle: block.subtitle || null,
      icon: block.icon || null,
      badge: block.badge || null,
      highlighted: Boolean(block.highlighted),
      visible: true,
      ...templateBlockExtra(block.type, block.extra)
    } as unknown as ProfileBlock));
}

export function starterSitePreview(template: SiteTemplate, options: StarterSitePreviewOptions = {}): CreatorProfile {
  const pageSlug = options.pageSlug || HOME_PAGE_SLUG;
  const displayName = options.displayName || template.profile?.shareTitle || STARTER_SITE_NAME_PLACEHOLDER;
  return {
    id: '',
    username: options.username || '',
    displayName,
    bio: options.bio || template.profile?.bio || '',
    avatarUrl: '',
    category: template.category,
    verified: false,
    socials: options.socials || [],
    themeId: template.themeId,
    pages: starterSitePages(template, options.homeTitle || displayName),
    blocks: starterSiteBlocks(template, pageSlug)
  };
}

/**
 * Where "Use this template" sends someone. The choice is carried as the catalog id so the studio can
 * apply the whole composition; for a visitor who is not signed in it survives into the signup form.
 */
export function starterSitePath(templateId: string, signedIn: boolean): string {
  const query = `template=${encodeURIComponent(templateId)}`;
  return signedIn ? `/studio?${query}` : `/register?${query}`;
}
