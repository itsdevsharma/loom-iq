import { useEffect, useState, useSyncExternalStore } from 'react';
import { isApiLoading, subscribeToApiLoading } from '../apiLoading';

export default function SiteLoadingBar() {
  const loading = useSyncExternalStore(subscribeToApiLoading, isApiLoading, () => false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(timer);
  }, [loading]);

  if (!visible) return null;
  return <div className="site-loading-bar" role="status" aria-label="Loading"><span /></div>;
}
