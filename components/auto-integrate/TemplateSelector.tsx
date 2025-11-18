// components/auto-integrate/TemplateSelector.tsx
"use client";

import { useEffect, useState } from "react";

export default function TemplateSelector({ onApply }: any) {
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/service-templates");
      const json = await res.json();
      setTemplates(json.templates || []);
    }
    load();
  }, []);

  async function applyTemplate() {
    if (!selectedId) return;

    const res = await fetch(`/api/service-templates/${selectedId}`);
    const json = await res.json();

    onApply(json.template); // Pass template to parent
  }

  return (
    <div className="border rounded p-4 bg-white shadow-sm">
      <h2 className="font-semibold text-lg mb-2">Service Templates</h2>

      <select
        className="border p-2 rounded w-full"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">Select Template</option>

        {templates.map((t: any) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <button
        onClick={applyTemplate}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Apply Template
      </button>
    </div>
  );
}
