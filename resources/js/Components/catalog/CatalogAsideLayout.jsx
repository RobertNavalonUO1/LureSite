import React from 'react';
import { useI18n } from '@/i18n';

const COLLAPSED_FILTER_COLUMN = 'minmax(5.75rem, 20%)';
const COLLAPSED_SECONDARY_COLUMN = 'minmax(18rem, 1fr)';
const EXPANDED_FILTER_COLUMN = 'minmax(0, 1fr)';
const EXPANDED_SECONDARY_COLUMN = '0fr';
const SECONDARY_TRANSITION_MS = 300;

export default function CatalogAsideLayout({
  isExpanded,
  stickyTop,
  filterContent,
  secondaryContent,
  edge = 'left',
  className = '',
}) {
  const { t } = useI18n();
  const isRightEdge = edge === 'right';
  const [isSecondaryMounted, setIsSecondaryMounted] = React.useState(!isExpanded);
  const [isSecondaryVisible, setIsSecondaryVisible] = React.useState(!isExpanded);

  React.useEffect(() => {
    let frameId;
    let timeoutId;

    if (isExpanded) {
      setIsSecondaryVisible(false);
      timeoutId = window.setTimeout(() => {
        setIsSecondaryMounted(false);
      }, SECONDARY_TRANSITION_MS);
    } else {
      setIsSecondaryMounted(true);
      frameId = window.requestAnimationFrame(() => {
        setIsSecondaryVisible(true);
      });
    }

    return () => {
      if (typeof frameId === 'number') {
        window.cancelAnimationFrame(frameId);
      }

      if (typeof timeoutId === 'number') {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isExpanded]);

  return (
    <div className={[
      'relative hidden h-full w-full lg:block',
      className,
    ].join(' ')}>
      <div
        className="grid h-full w-full items-stretch gap-4"
        style={{
          gridTemplateColumns: isExpanded
            ? (isRightEdge
              ? `${EXPANDED_SECONDARY_COLUMN} ${EXPANDED_FILTER_COLUMN}`
              : `${EXPANDED_FILTER_COLUMN} ${EXPANDED_SECONDARY_COLUMN}`)
            : (isRightEdge
              ? `${COLLAPSED_SECONDARY_COLUMN} ${COLLAPSED_FILTER_COLUMN}`
              : `${COLLAPSED_FILTER_COLUMN} ${COLLAPSED_SECONDARY_COLUMN}`),
          transition: 'grid-template-columns 320ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {isSecondaryMounted ? (
          <section
            aria-hidden={!isSecondaryVisible}
            inert={!isSecondaryVisible ? '' : undefined}
            className={[
              'min-w-0 overflow-hidden transition-[opacity,transform,visibility] duration-300 ease-out',
              isSecondaryVisible
                ? 'pointer-events-auto visible translate-x-0 opacity-100'
                : isRightEdge
                  ? 'pointer-events-none invisible -translate-x-4 opacity-0'
                  : 'pointer-events-none invisible translate-x-4 opacity-0',
            ].join(' ')}
          >
            <div className="h-full overflow-hidden">{secondaryContent}</div>
          </section>
        ) : null}

        <section
          className="min-w-0 h-full w-full"
          aria-label={t('catalog.filter.panel_title')}
          style={isRightEdge ? { gridColumn: '2 / 3' } : undefined}
        >
          <div className="sticky w-full" style={{ top: stickyTop }}>
            {filterContent}
          </div>
        </section>
      </div>
    </div>
  );
}