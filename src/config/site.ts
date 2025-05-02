import site from '../../site.config.json';

// Re-exported so app code never hard-codes the domain.
export const DOMAIN = site.domain;
export const SITE_URL = `https://${site.domain}`;
export const GRIEVANCE_EMAIL = site.grievanceEmail;

export const postUrl = (id: string) => `${SITE_URL}/post/${id}`;
export const privacyUrl = `${SITE_URL}/privacy`;
export const termsUrl = `${SITE_URL}/terms`;
