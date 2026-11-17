import React from 'react';

export const UnavailableFeature: React.FC<{ title: string; detail: string }> = ({ title, detail }) => (
  <div className="space-y-4">
    <div><h1 className="text-2xl font-bold text-gray-900">{title}</h1><p className="mt-1 text-sm text-gray-500">Cette fonctionnalité n’est pas encore disponible dans le backend.</p></div>
    <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{detail}</div>
  </div>
);
