"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocuments } from "@/lib/api-client/documents";

export default function LibraryDocumentsPicker({ selected, onChange }) {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    getDocuments()
      .then(all => setDocs(all.filter(d => d.is_active !== false)))
      .catch(console.error);
  }, []);

  if (docs.length === 0) return null;

  const toggle = (doc) => {
    const exists = selected.find((d) => d.id === doc.id);
    if (exists) onChange(selected.filter((d) => d.id !== doc.id));
    else onChange([...selected, { id: doc.id, name: doc.name, file_url: doc.file_url, file_name: doc.file_name }]);
  };

  const categories = [...new Set(docs.map(d => d.category).filter(Boolean))];
  const uncategorized = docs.filter(d => !d.category);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">Document Library</CardTitle>
        <p className="text-xs text-slate-500">Optionally attach documents from the library to this visit note</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map(cat => (
          <div key={cat}>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{cat}</p>
            <div className="space-y-1">
              {docs.filter(d => d.category === cat).map(doc => {
                const checked = !!selected.find(d => d.id === doc.id);
                return (
                  <label key={doc.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                    <input type="checkbox" checked={checked} onChange={() => toggle(doc)} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-slate-700">{doc.name}</span>
                      {doc.description && <p className="text-xs text-slate-400 truncate">{doc.description}</p>}
                    </div>
                    {checked && (
                      <button type="button" onClick={() => window.open(doc.file_url, "_blank")} className="text-xs text-teal-600 underline shrink-0">View</button>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        {uncategorized.length > 0 && (
          <div className="space-y-1">
            {uncategorized.map(doc => {
              const checked = !!selected.find(d => d.id === doc.id);
              return (
                <label key={doc.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <input type="checkbox" checked={checked} onChange={() => toggle(doc)} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-slate-700">{doc.name}</span>
                    {doc.description && <p className="text-xs text-slate-400 truncate">{doc.description}</p>}
                  </div>
                  {checked && (
                    <button type="button" onClick={() => window.open(doc.file_url, "_blank")} className="text-xs text-teal-600 underline shrink-0">View</button>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
