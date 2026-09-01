import WooButton from './WooButton';
import type { WooButtonSize } from './WooButton';

export interface WhatsAppCTAProps {
  phone: string;
  message: string;
  label?: string;
  size?: WooButtonSize;
  block?: boolean;
  iconOnly?: boolean;
  title?: string;
}

function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Shared WhatsApp call-to-action used by the product buy-box, the merchant
 * storefront header, and the merchant dashboard dispatch flows. Renders a
 * `.btn-whatsapp` link so every WhatsApp touchpoint looks identical.
 */
export function WhatsAppCTA({
  phone,
  message,
  label = 'WhatsApp',
  size = 'md',
  block,
  iconOnly,
  title,
}: WhatsAppCTAProps) {
  const href = `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={`btn btn-whatsapp${size === 'sm' ? ' btn-sm' : size === 'lg' ? ' btn-lg' : ''}${
        block ? ' btn-block' : ''
      }${iconOnly ? ' btn-icon' : ''}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      {!iconOnly && label}
    </a>
  );
}

export default WhatsAppCTA;
