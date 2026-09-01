import { ButtonHTMLAttributes, forwardRef } from 'react';

export type WooButtonVariant = 'primary' | 'outline' | 'whatsapp' | 'dark' | 'success' | 'danger' | 'secondary';
export type WooButtonSize = 'sm' | 'md' | 'lg';

export interface WooButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: WooButtonVariant;
  size?: WooButtonSize;
  block?: boolean;
  iconOnly?: boolean;
}

const variantClass: Record<WooButtonVariant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  whatsapp: 'btn-whatsapp',
  dark: 'btn-dark',
  success: 'btn-success',
  danger: 'btn-danger',
  secondary: 'btn-secondary',
};

/**
 * Thin wrapper over the global `.btn` WooCommerce design system.
 * Works in both Server and Client components. Use it everywhere a button
 * appears so the whole app shares one hover/active/focus language.
 */
export const WooButton = forwardRef<HTMLButtonElement, WooButtonProps>(function WooButton(
  { variant = 'primary', size = 'md', block, iconOnly, className = '', children, ...rest },
  ref,
) {
  const classes = [
    'btn',
    variantClass[variant],
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    block ? 'btn-block' : '',
    iconOnly ? 'btn-icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} className={classes} {...rest}>
      {children}
    </button>
  );
});

export default WooButton;
