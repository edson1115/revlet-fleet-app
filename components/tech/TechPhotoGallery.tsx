"use client";

import React, { useState, useEffect } from "react";

type Photo = {
  id: string;
  url_thumb: string;
  url_work: string;
  kind: string;
  order_index: number;
  ai_labels?: string[];
  ai_damage_detected?: boolean;
};

type Props = {
  photos: Photo[];
  onReorder: (newList: Photo[]) => void;
  onDelete: (id: string) => void;
};

export default function TechPhotoGallery({ photos, onReorder, onDelete }: Props) {
  const [list, setList] = useState<Photo[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    setList(photos);
  }, [photos]);

  // ---------------------------------------------------------------------------
  // Drag events
  // ---------------------------------------------------------------------------
  function handleDragStart(idx: number) {
    setDragIndex(idx);
  }

  function handleDragEnter(idx: number) {
    if (dragIndex === null || dragIndex === idx) return;

    setHoverIndex(idx);
    const updated = [...list];
    const dragged = updated[dragIndex];
    updated.splice(dragIndex, 1);
    updated.splice(idx, 0, dragged);

    setList(updated);
    setDragIndex(idx);
    onReorder(updated);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setHoverIndex(null);
  }

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------
  async function deletePhoto(id: string) {
    const ok = confirm("Delete this photo?");
    if (!ok) return;

    onDelete(id);
  }

  // ---------------------------------------------------------------------------
  // Grid UI
  // ---------------------------------------------------------------------------
  return (
    <div className="grid grid-cols-3 gap-3">
      {list.map((p, idx) => (
        <div
          key={p.id}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragEnter={() => handleDragEnter(idx)}
          onDragEnd={handleDragEnd}
          className={`relative rounded-xl overflow-hidden border shadow-sm
              transition-transform duration-150
              ${dragIndex === idx ? "scale-105" : "scale-100"}
            `}
          style={{ cursor: "grab" }}
        >
          {/* Thumbnail */}
          <img
            src={p.url_thumb}
            className="w-full h-24 object-cover"
          />

          {/* Damage Badge */}
          {p.ai_damage_detected && (
            <div className="absolute top-1 left-1 bg-red-600 text-white text-[10px] px-2 py-1 rounded-md shadow">
              DAMAGE
            </div>
          )}

          {/* Delete button */}
          <button
            onClick={() => deletePhoto(p.id)}
            className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-[2px] rounded-full"
          >
            ✕
          </button>

          {/* AI labels */}
          {p.ai_labels && p.ai_labels.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 leading-tight">
              {p.ai_labels.join(", ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
