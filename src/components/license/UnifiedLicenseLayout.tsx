import React from 'react';

type Children = { children: React.ReactNode };

export function LicensePage({ children }: Children) {
  return <div className="space-y-4 w-full">{children}</div>;
}

export function LicenseToolbar({ children }: Children) {
  return <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">{children}</div>;
}

export function LicenseSection({ children }: Children) {
  return <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">{children}</div>;
}

export function LicenseSectionTitle({ title }: { title: string }) {
  return <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">{title}</h2>;
}
