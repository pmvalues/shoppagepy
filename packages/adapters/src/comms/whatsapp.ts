/**
 * WhatsApp Action Rail & Universal Deep Link Generator
 */

export interface WhatsAppPrefillOptions {
  whatsappNumber: string; // E.164 format, e.g. +27821234567
  productTitle: string;
  price?: number;
  currency?: string;
  merchantName: string;
  sourceReferralId: string;
  universalLinkUrl: string;
}

/**
 * Builds a direct click-to-chat WhatsApp link with prefilled context and attribution
 */
export function buildWhatsAppActionLink(options: WhatsAppPrefillOptions): string {
  // Clean phone number (strip '+', spaces, dashes)
  const cleanPhone = options.whatsappNumber.replace(/[^0-9]/g, '');

  const priceText = options.price
    ? ` listed at ${options.currency || 'R'}${options.price.toLocaleString()}`
    : '';

  const message = `Hi ${options.merchantName}, I found your listing for "${options.productTitle}"${priceText} on Shoppage (${options.universalLinkUrl}). Is this currently available for collection/delivery? [Ref: ${options.sourceReferralId}]`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
