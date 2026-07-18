'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type AnnouncePriority = 'polite' | 'assertive';

interface AriaLiveAnnouncement {
  message: string;
  priority: AnnouncePriority;
  id: number;
}

export function useAriaLive() {
  const [announcements, setAnnouncements] = useState<AriaLiveAnnouncement[]>([]);
  const idRef = useRef(0);
  const regionRef = useRef<HTMLDivElement | null>(null);

  const announce = useCallback((message: string, priority: AnnouncePriority = 'polite') => {
    idRef.current += 1;
    const newAnnouncement: AriaLiveAnnouncement = {
      message,
      priority,
      id: idRef.current,
    };

    setAnnouncements((prev) => [...prev, newAnnouncement]);

    // Clear announcement after screen reader has had time to read it
    setTimeout(() => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== newAnnouncement.id));
    }, 3000);
  }, []);

  const AriaLiveRegion = useCallback(() => {
    return (
      <div ref={regionRef} className="sr-only" aria-live="polite" aria-atomic="true">
        {announcements
          .filter((a) => a.priority === 'polite')
          .map((a) => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
    );
  }, [announcements]);

  const AriaLiveAssertiveRegion = useCallback(() => {
    return (
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {announcements
          .filter((a) => a.priority === 'assertive')
          .map((a) => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
    );
  }, [announcements]);

  return {
    announce,
    AriaLiveRegion,
    AriaLiveAssertiveRegion,
  };
}

// Standalone aria-live region component for direct use in JSX
export function AriaLiveRegions() {
  const [politeMessages, setPoliteMessages] = useState<string[]>([]);
  const [assertiveMessages, setAssertiveMessages] = useState<string[]>([]);
  const idRef = useRef(0);

  const announce = useCallback((message: string, priority: AnnouncePriority = 'polite') => {
    idRef.current += 1;
    const key = `${idRef.current}-${Date.now()}`;

    if (priority === 'assertive') {
      setAssertiveMessages((prev) => [...prev, message]);
      setTimeout(() => {
        setAssertiveMessages((prev) => prev.filter((m) => m !== message));
      }, 3000);
    } else {
      setPoliteMessages((prev) => [...prev, message]);
      setTimeout(() => {
        setPoliteMessages((prev) => prev.filter((m) => m !== message));
      }, 3000);
    }
  }, []);

  return { announce, politeMessages, assertiveMessages };
}
