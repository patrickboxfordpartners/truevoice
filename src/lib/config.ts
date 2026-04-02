/**
 * Application configuration
 */

/**
 * Get the site URL for generating interview links and other absolute URLs.
 * Falls back to window.location.origin if VITE_SITE_URL is not set.
 */
export function getSiteUrl(): string {
  return import.meta.env.VITE_SITE_URL || window.location.origin;
}
