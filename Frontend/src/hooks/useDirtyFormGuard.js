import { useState, useEffect, useCallback } from 'react';
import notify from '@/utils/notify';

export default function useDirtyFormGuard() {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const guardedNavigate = useCallback(async (navigateFn, forceAllow = false) => {
    if (!isDirty || forceAllow) {
      navigateFn();
      return;
    }
    const result = await notify.confirmLeave();
    if (result.isConfirmed) {
      navigateFn();
    }
  }, [isDirty]);

  return { isDirty, setIsDirty, guardedNavigate };
}
