import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Shared WooCommerce breadcrumb. Renders on light backgrounds via the global
 * `.breadcrumb` system. On dark merchant headers, pass `onDark` to flip the
 * colours so it stays legible.
 */
export function Breadcrumb({ items, onDark = false }: { items: BreadcrumbItem[]; onDark?: boolean }) {
  return (
    <nav
      className={`breadcrumb${onDark ? ' breadcrumb--dark' : ''}`}
      aria-label="Breadcrumb"
      style={{ marginBottom: '0.75rem' }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="breadcrumb__item">
            {item.href && !isLast ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span className="current" aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {!isLast && <span className="sep">/</span>}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
