export const CATALOG_STICKY_GAP = '1.5rem';

export const CATALOG_STICKY_TOP = `calc(var(--header-sticky-height, 0px) + var(--topnav-sticky-height, 0px) - var(--header-compact-offset-active, 0px) + ${CATALOG_STICKY_GAP})`;

export const CATALOG_STICKY_TOP_WITH_RAIL = `calc(var(--header-sticky-height, 0px) + var(--topnav-sticky-height, 0px) + var(--category-rail-height, 0px) - var(--header-compact-offset-active, 0px) + ${CATALOG_STICKY_GAP})`;