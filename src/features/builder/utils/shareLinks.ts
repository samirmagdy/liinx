/** Where each share action goes. Both are built from the page's own address, never a placeholder. */
export function whatsappShareUrl(pageUrl: string, message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message} ${pageUrl}`)}`;
}

/** Instagram's own profile-edit page, where the bio field lives. */
export const INSTAGRAM_PROFILE_EDIT_URL = 'https://www.instagram.com/accounts/edit/';
