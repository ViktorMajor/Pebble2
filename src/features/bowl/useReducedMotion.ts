import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(override?: boolean) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (override !== undefined) return;
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => subscription.remove();
  }, [override]);
  return override ?? reduced;
}
