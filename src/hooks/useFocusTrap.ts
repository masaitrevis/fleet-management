'use client';

import { useCallback, useEffect, useRef } from 'react';

interface FocusTrapResult {
  trapRef: React.RefObject<HTMLElement | null>;
  release: () => void;
}

export function useFocusTrap(isActive: boolean): FocusTrapResult {
  const trapRef = useRef<HTMLElement | null>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    const container = trapRef.current;
    if (!container) return [];

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]',
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    return elements.filter((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, []);

  const handleTabKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    [getFocusableElements]
  );

  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        release();
      }
    },
    []
  );

  const release = useCallback(() => {
    if (previousActiveElement.current) {
      (previousActiveElement.current as HTMLElement).focus?.();
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    previousActiveElement.current = document.activeElement;

    // Focus first element after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }, 50);

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive, handleTabKey, handleEscapeKey, getFocusableElements]);

  return { trapRef, release };
}
