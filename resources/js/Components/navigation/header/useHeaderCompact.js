import React from 'react';

const readCompactFlag = () => {
  if (typeof document === 'undefined') return false;
  return document.documentElement?.dataset?.headerCompact === '1';
};

export default function useHeaderCompact() {
  const [isCompact, setIsCompact] = React.useState(readCompactFlag);

  React.useEffect(() => {
    const onChange = (event) => {
      setIsCompact(Boolean(event?.detail?.compact));
    };

    window.addEventListener('header:compact', onChange);

    const observer = new MutationObserver(() => {
      setIsCompact(readCompactFlag());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-header-compact'],
    });

    return () => {
      window.removeEventListener('header:compact', onChange);
      observer.disconnect();
    };
  }, []);

  return isCompact;
}
