import React, { useState } from 'react';
import { ColumnConfig } from '../../../lib/services/registrationService';
import { Button } from '../../ui/Button';
import { 
  X, 
  Columns, 
  Check, 
  RotateCcw, 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  Layers
} from 'lucide-react';

interface ColumnSettingsModalProps {
  isOpen: boolean;
  columns: ColumnConfig[];
  onToggleColumn: (key: string) => void;
  onReorderColumns: (newColumns: ColumnConfig[]) => void;
  onResetColumns: () => void;
  onSave: () => void;
  onClose: () => void;
}

export const ColumnSettingsModal: React.FC<ColumnSettingsModalProps> = ({
  isOpen,
  columns,
  onToggleColumn,
  onReorderColumns,
  onResetColumns,
  onSave,
  onClose,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or ghost image
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...columns];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    onReorderColumns(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;

    const updated = [...columns];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    onReorderColumns(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-[#1E1712] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4 font-baloo">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Columns className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100">
                Atur & Urutkan Kolom Tabel
              </h3>
              <p className="text-[11px] text-stone-500">
                Centang untuk menampilkan kolom & <strong>geser (Drag & Drop)</strong> untuk mengatur urutan posisi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Reorderable List */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider font-fredoka px-1">
            <span>Daftar Kolom (Tarik & Lepas untuk Mengubah Urutan):</span>
            <span>{columns.filter((c) => c.visible).length} / {columns.length} Aktif</span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {columns.map((col, idx) => {
              const isDragging = draggedIndex === idx;
              const isOver = dragOverIndex === idx;

              return (
                <div
                  key={col.key}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all select-none ${
                    isDragging
                      ? 'opacity-40 border-dashed border-amber-500 bg-amber-100 dark:bg-amber-950/40'
                      : isOver
                      ? 'border-t-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                      : col.visible
                      ? col.isDynamic
                        ? 'border-teal-300 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 text-teal-950 dark:text-teal-100'
                        : 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-stone-900 dark:text-stone-100'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 text-stone-400 opacity-60'
                  }`}
                >
                  {/* Drag Handle & Checkbox */}
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-amber-600 transition-colors p-0.5"
                      title="Tahan dan geser untuk memindahkan urutan kolom"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => onToggleColumn(col.key)}
                        className={`rounded ${
                          col.isDynamic
                            ? 'text-teal-600 focus:ring-teal-500'
                            : 'text-amber-500 focus:ring-amber-400'
                        }`}
                      />
                      <span className="font-semibold">{col.label}</span>
                    </label>
                  </div>

                  {/* Badges & Up/Down Arrows */}
                  <div className="flex items-center gap-1.5">
                    {col.isDynamic && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        Field Form
                      </span>
                    )}

                    <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => moveColumn(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 text-stone-500 cursor-pointer disabled:cursor-not-allowed"
                        title="Geser ke Atas"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveColumn(idx, 'down')}
                        disabled={idx === columns.length - 1}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 text-stone-500 cursor-pointer disabled:cursor-not-allowed border-l border-stone-200 dark:border-stone-700"
                        title="Geser ke Bawah"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onResetColumns}
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Posisi Awal</span>
          </button>

          <div className="flex items-center gap-2">
            <Button onClick={onClose} variant="ghost" size="sm">
              Tutup
            </Button>
            <Button onClick={onSave} variant="festival" size="sm">
              <Check className="w-3.5 h-3.5 mr-1" />
              Terapkan Urutan Kolom
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
