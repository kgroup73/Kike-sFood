/** Enlace de la mesa para QR/NFC. El token es secreto: no compartirlo fuera de la mesa. */
export const tableUrl = (slug, token) => `${window.location.origin}/r/${slug}/m/${token}`;
