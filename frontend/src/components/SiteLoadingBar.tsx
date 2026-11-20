import { useEffect, useState, useSyncExternalStore } from 'react';
import { isApiLoading, subscribeToApiLoading } from '../apiLoading';

function DelayedLoadingBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return <div className="site-loading-bar" role="status" aria-label="Loading"><span /></div>;
}

export default function SiteLoadingBar() {
  const loading = useSyncExternalStore(subscribeToApiLoading, isApiLoading, () => false);
  return loading ? <DelayedLoadingBar /> : null;
}
