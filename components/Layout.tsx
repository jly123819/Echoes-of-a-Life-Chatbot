
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  // Changed subtitle type from string to React.ReactNode to allow JSX elements (e.g. status indicators with buttons)
  subtitle?: React.ReactNode;
  onHomeClick?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, onHomeClick }) => {
  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-12 flex flex-col">
      <header className="mb-12 flex justify-between items-end border-b border-stone-200 pb-8">
        <div>
          <h1 className="serif text-4xl font-light text-stone-900 tracking-tight" onClick={onHomeClick} style={{ cursor: onHomeClick ? 'pointer' : 'default' }}>
            {title || "Echoes of a Life"}
          </h1>
          {/* Using div instead of p to avoid hydration errors/invalid nesting when subtitle contains block elements like buttons */}
          {subtitle && <div className="mt-2 text-stone-500 font-light">{subtitle}</div>}
        </div>
        <div className="text-stone-400 text-sm font-medium tracking-widest uppercase">
          Memory Archive
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="mt-20 pt-10 border-t border-stone-100 text-stone-400 text-sm italic text-center">
        “Wisdom is not what we know, but what we remember after we have forgotten everything else.”
      </footer>
    </div>
  );
};

export default Layout;
