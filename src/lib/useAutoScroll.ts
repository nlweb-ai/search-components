import { useEffect, useRef, useCallback } from 'react';

const useAutoScroll = <T extends HTMLElement>(dependency: any[]): React.RefObject<T> => {
  const containerRef = useRef<T>(null);
  const shouldScrollRef = useRef(true);

  // Function to scroll to the bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
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
      scrollToBottom();
    }
  }, dependency); // eslint-disable-line react-hooks/exhaustive-deps

  return containerRef;
};

export default useAutoScroll;
