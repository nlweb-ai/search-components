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
    if (anchorRef.current && containerRef.current) {
      anchorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);

  // Handle user scrolling: if they move away from the bottom, stop auto-scrolling
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      // Check if the user is near the bottom (e.g., within 5 pixels)
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
      shouldScrollRef.current = isAtBottom;
    }
  }, []);

  useEffect(() => {
    // Add scroll listener to the container
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  // Effect to manage auto-scrolling when dependency changes (e.g., new message)
  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToAnchor();
    }
  }, dependency); // eslint-disable-line react-hooks/exhaustive-deps

  return { containerRef, anchorRef };
};

export default useAutoScroll;
