import { useEffect, useRef, useCallback } from 'react';

export interface AutoScrollRefs<T extends HTMLElement> {
  containerRef: React.RefObject<T>;
  anchorRef: React.RefObject<HTMLDivElement>;
}

export const useAutoScroll = <T extends HTMLElement>(dependency: any[]): AutoScrollRefs<T> => {
  const containerRef = useRef<T>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  // Function to scroll to the anchor element
  const scrollToAnchor = useCallback(() => {
    if (anchorRef.current) {
      anchorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);


  // Effect to manage auto-scrolling when dependency changes (e.g., new message)
  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToAnchor();
    }
  }, dependency); // eslint-disable-line react-hooks/exhaustive-deps

  return { containerRef, anchorRef };
};

export default useAutoScroll;
