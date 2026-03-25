import React from 'react';
import { usePage } from '@inertiajs/react';

import Header from '@/Components/navigation/Header.jsx';
import TopNavMenu from '@/Components/navigation/TopNavMenu.jsx';
import useScrollCompact from '@/hooks/useScrollCompact.js';

export default function StorefrontLayout({
  showTopNav = false,
  headerProps = {},
  compactOptions,
  onCompactChange,
  children,
}) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const isCompact = useScrollCompact(compactOptions);

  React.useEffect(() => {
    onCompactChange?.(isCompact);
  }, [isCompact, onCompactChange]);

  return (
    <>
      <Header user={user} isCompact={isCompact} {...headerProps} />
      {showTopNav ? <TopNavMenu isCompact={isCompact} /> : null}
      {typeof children === 'function' ? children({ isCompact, user }) : children}
    </>
  );
}
