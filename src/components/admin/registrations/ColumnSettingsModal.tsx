import React from 'react';
import { ColumnConfig } from '../../../lib/services/registrationService';
import { Button } from '../../ui/Button';
import { X, Columns, Check, RotateCcw } from 'lucide-react';

interface ColumnSettingsModalProps {
  isOpen: boolean;
  columns: ColumnConfig[];
  onToggleColumn: (key: string) => void;
  onResetColumns: () => void;
  onSave: () => void;
  onClose: () => void;
}

export const ColumnSettingsModal: React.FC<ColumnSettingsModalProps> = ({
  isOpen,
  columns,
  onToggleColumn,
  onResetColumns,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  const basicCols = columns.filter((c) => !c.isDynamic);
  const dynamicCols = columns.filter((c) => c.isDynamic);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1E1712] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4 font-baloo">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Columns className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100">
                Atur Tampilan Kolom Tabel
              </h3>
              <p className="text-[11px] text-stone-500">
                Pilih kolom dasar dan field dinamis yang ingin ditampilkan
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

        {/* Column Lists */}
        <div className="max-h-64 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Basic Columns */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-fredoka block">
              Kolom Dasar Sistem
            </span>
            <div className="grid grid-cols-2 gap-2">
              {basicCols.map((col) => (
                <label
                  key={col.key}
                  className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none transition-colors ${
                    col.visible
                      ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 font-semibold'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 text-stone-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => onToggleColumn(col.key)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span className="truncate">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dynamic Columns */}
          {dynamicCols.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-850">
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider font-fredoka block">
                Field Dinamis Event
              </span>
              <div className="grid grid-cols-2 gap-2">
                {dynamicCols.map((col) => (
                  <label
                    key={col.key}
                    className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none transition-colors ${
                      col.visible
                        ? 'border-teal-400 bg-teal-50/60 dark:bg-teal-950/30 text-teal-950 dark:text-teal-100 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 text-stone-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => onToggleColumn(col.key)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="truncate">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onResetColumns}
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar</span>
          </button>

          <div className="flex items-center gap-2">
            <Button onClick={onClose} variant="ghost" size="sm">
              Tutup
            </Button>
            <Button onClick={onSave} variant="festival" size="sm">
              <Check className="w-3.5 h-3.5 mr-1" />
              Terapkan Kolom
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
