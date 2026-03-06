import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn(), language: 'en' },
  }),
  withTranslation: () => (Component: any) => {
    return (props: any) => React.createElement(Component, { ...props, t: (k: string) => k });
  },
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// Mock Lucide icons generically
vi.mock('lucide-react', () => {
  const icons: any = {};
  return new Proxy(icons, {
    get: (target, prop) => {
      if (typeof prop === 'string' && prop[0] === prop[0].toUpperCase()) {
        if (!target[prop]) {
          target[prop] = (props: any) => React.createElement('div', { ...props, 'data-testid': `icon-${prop}` }, prop);
          target[prop].displayName = prop;
        }
        return target[prop];
      }
      return Reflect.get(target, prop);
    }
  });
});

// Mock react-pdf
vi.mock('react-pdf', () => ({
  Document: ({ children, onLoadSuccess }: any) => {
    setTimeout(() => onLoadSuccess?.({ numPages: 10 }), 0);
    return React.createElement('div', { 'data-testid': 'pdf-document' }, children);
  },
  Page: ({ pageNumber }: any) => React.createElement('div', { 'data-testid': `pdf-page-${pageNumber}` }, `Page ${pageNumber}`),
  pdfjs: {
    GlobalWorkerOptions: { workerSrc: '' },
    version: '1.0',
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    span: ({ children, ...props }: any) => React.createElement('span', props, children),
    h1: ({ children, ...props }: any) => React.createElement('h1', props, children),
    p: ({ children, ...props }: any) => React.createElement('p', props, children),
    section: ({ children, ...props }: any) => React.createElement('section', props, children),
  },
  AnimatePresence: ({ children }: any) => children,
}));
