import React, { useState, useEffect } from 'react';
import { FormField, FormType, EventItem, FieldType } from '../../types/database';
import { formFieldService, DEFAULT_PENDAFTARAN_FIELDS, DEFAULT_PEMBAYARAN_FIELDS } from '../../lib/services/formFieldService';
import { eventService } from '../../lib/services/eventService';
import { FormFieldRow } from '../../components/admin/builder/FormFieldRow';
import { FormLivePreviewModal } from '../../components/admin/builder/FormLivePreviewModal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Save, 
  Eye, 
  RotateCcw, 
  Sparkles, 
  Calendar, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export const AdminFormBuilderPage: React.FC = () => {
  const { isSuperAdmin, accessibleEventIds, hasAccessToAll } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeFormType, setActiveFormType] = useState<FormType>('Pendaftaran');
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      const data = await eventService.getEvents();
      // Filter accessible events
      const filtered = data.filter((e) => isSuperAdmin || hasAccessToAll || accessibleEventIds.includes(e.id));
      setEvents(filtered);
      if (filtered.length > 0 && !selectedEventId) {
        setSelectedEventId(filtered[0].id);
      }
      setIsLoading(false);
    };
    loadEvents();
  }, [isSuperAdmin, hasAccessToAll, accessibleEventIds]);

  // Load fields when selectedEventId or activeFormType changes
  useEffect(() => {
    if (!selectedEventId) return;

    const loadFields = async () => {
      setIsLoading(true);
      const loaded = await formFieldService.getFormFields(selectedEventId, activeFormType);
      setFields(loaded);
      setIsLoading(false);
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);
    };

    loadFields();
  }, [selectedEventId, activeFormType]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  // Handle Drag & Drop End
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(fields, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        urutan: idx + 1,
      }));
      setFields(reordered);
    }
  };

  const handleAddField = () => {
    const newField: FormField = {
      id: `field-new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      event_id: selectedEventId,
      form_type: activeFormType,
      urutan: fields.length + 1,
      label: '',
      tipe: 'Text',
      required: false,
      options: null,
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (updated: FormField) => {
    setFields(fields.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleDuplicateField = (fieldToDuplicate: FormField) => {
    const index = fields.findIndex((f) => f.id === fieldToDuplicate.id);
    const duplicated: FormField = {
      ...fieldToDuplicate,
      id: `field-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: `${fieldToDuplicate.label} (Salinan)`,
      urutan: index + 2,
    };
    const newFields = [...fields];
    newFields.splice(index + 1, 0, duplicated);
    setFields(newFields.map((f, idx) => ({ ...f, urutan: idx + 1 })));
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id).map((f, idx) => ({ ...f, urutan: idx + 1 })));
  };

  const handleResetToTemplate = () => {
    if (confirm('Muat ulang template bawaan untuk formulir ini? Perubahan yang belum disimpan akan hilang.')) {
      const template = activeFormType === 'Pendaftaran' ? DEFAULT_PENDAFTARAN_FIELDS : DEFAULT_PEMBAYARAN_FIELDS;
      setFields(
        template.map((t, idx) => ({
          ...t,
          id: `field-tmpl-${Date.now()}-${idx + 1}`,
          event_id: selectedEventId,
          urutan: idx + 1,
        }))
      );
    }
  };

  const handleSave = async () => {
    if (!selectedEventId) return;

    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    const res = await formFieldService.saveFormFields(selectedEventId, activeFormType, fields);
    setIsSaving(false);

    if (res.error) {
      setSaveErrorMsg(`Gagal menyimpan: ${res.error}`);
    } else {
      setSaveSuccessMsg(`Formulir ${activeFormType} berhasil disimpan! (${res.count} field tersimpan, baris tanpa label dilewati).`);
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Event Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#201813] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-850/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold font-fredoka text-stone-900 dark:text-stone-100">
              Form Builder Dinamis
            </h1>
            <Badge variant="festival" className="text-[10px]">
              Tahap 3
            </Badge>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-baloo mt-1">
            Rancang formulir pendaftaran dan pembayaran lanjutan dinamis per event dengan drag & drop.
          </p>
        </div>

        {/* Event Selector Dropdown */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full lg:w-80 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 font-baloo focus:outline-none focus:border-amber-500 truncate"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.nama} ({evt.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice regarding Bayar Lanjutan status of the selected event */}
      {selectedEvent && (
        <div className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-xs font-baloo text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <span>
              Event terpilih: <strong>{selectedEvent.nama}</strong> &bull; Biaya: <strong>{selectedEvent.harga > 0 ? `Rp ${selectedEvent.harga.toLocaleString('id-ID')}` : 'Gratis'}</strong> &bull; Bayar Lanjutan:{' '}
              <strong>{selectedEvent.bayar_lanjut ? 'Aktif (Form Pembayaran Terpisah)' : 'Tidak (Verifikasi Langsung)'}</strong>.
            </span>
            {selectedEvent.bayar_lanjut && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Peserta yang mendaftar di event ini akan mengisi <strong>Form Pendaftaran</strong> terlebih dahulu, lalu mengisi <strong>Form Pembayaran Lanjutan</strong> hanya setelah dinyatakan <em>Lulus</em> kurasi.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tabs: Form Pendaftaran vs Form Pembayaran Lanjutan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFormType('Pendaftaran')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-fredoka transition-all cursor-pointer ${
              activeFormType === 'Pendaftaran'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white dark:bg-[#201813] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-50'
            }`}
          >
            Tab 1: Form Pendaftaran
          </button>

          <button
            onClick={() => setActiveFormType('Pembayaran')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-fredoka transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFormType === 'Pembayaran'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#201813] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-50'
            }`}
          >
            <span>Tab 2: Form Pembayaran Lanjutan</span>
            {selectedEvent?.bayar_lanjut && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleResetToTemplate}
            variant="outline"
            size="sm"
            className="text-xs"
            title="Muat ulang template standar"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Template
          </Button>

          <Button
            onClick={() => setIsPreviewOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs text-teal-600 border-teal-300 dark:border-teal-800"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Pratinjau Langsung
          </Button>

          <Button
            onClick={handleAddField}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tambah Field
          </Button>

          <Button
            onClick={handleSave}
            variant="festival"
            size="sm"
            isLoading={isSaving}
            className="text-xs shadow-md font-bold"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Simpan Formulir
          </Button>
        </div>
      </div>

      {/* Feedback Messages */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* Main Drag & Drop Fields Editor List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-stone-400 font-baloo text-xs">
            Memuat daftar field formulir...
          </div>
        ) : fields.length === 0 ? (
          <div className="p-8 rounded-3xl border-2 border-dashed border-stone-200 dark:border-stone-800 text-center space-y-3 bg-white/60 dark:bg-[#201813]/60">
            <p className="text-xs text-stone-500 font-baloo">
              Belum ada field untuk {activeFormType} pada event ini.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={handleAddField} variant="festival" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Field Pertama
              </Button>
              <Button onClick={handleResetToTemplate} variant="outline" size="sm">
                Gunakan Template Standar
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <FormFieldRow
                    key={field.id}
                    field={field}
                    index={idx}
                    onUpdate={handleUpdateField}
                    onDuplicate={handleDuplicateField}
                    onDelete={handleDeleteField}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Bottom Add Field & Save Bar */}
        {fields.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
            <Button
              onClick={handleAddField}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Tambah Baris Field Baru
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                onClick={() => setIsPreviewOpen(true)}
                variant="outline"
                size="sm"
                className="text-xs text-teal-600 border-teal-300 dark:border-teal-800"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Pratinjau
              </Button>

              <Button
                onClick={handleSave}
                variant="festival"
                size="sm"
                isLoading={isSaving}
                className="text-xs font-bold"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Simpan Perubahan Formulir
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Modal */}
      <FormLivePreviewModal
        isOpen={isPreviewOpen}
        event={selectedEvent}
        formType={activeFormType}
        fields={fields}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};
