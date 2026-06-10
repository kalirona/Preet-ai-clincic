import React from 'react';

interface SystemPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function SystemPageLayout({ children, className }: SystemPageLayoutProps) {
  return (
    <div className={`w-full max-w-[1450px] mx-auto space-y-8 pb-16 select-none animate-fade-in ${className || ''}`} id="system-page-layout-root">
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
  category: string;
  version?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  category, 
  version = "Settings Console v2.14", 
  actions 
}: PageHeaderProps) {
  return (
    <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6" id="system-page-header">
      <div className="space-y-1.5 max-w-xl">
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-slate-200">
            {category}
          </span>
          <span className="text-slate-300 text-xs">/</span>
          <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-widest leading-none">{version}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-950 tracking-tight" style={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}>
          {title}
        </h1>
        <p className="text-slate-500 text-[13px] font-medium max-w-lg leading-relaxed">
          {description}
        </p>
      </div>
      {actions && (
        <div className="shrink-0 flex items-center gap-2" id="system-page-header-actions">
          {actions}
        </div>
      )}
    </div>
  );
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 ${className || ''}`} id="system-page-content-grid">
      {children}
    </div>
  );
}
