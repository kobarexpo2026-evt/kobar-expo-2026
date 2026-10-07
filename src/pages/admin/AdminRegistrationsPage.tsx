import React, { useState, useEffect, useMemo } from 'react';
import { Registration, EventItem, StatusBayar, StatusLulus } from '../../types/database';
import { registrationService, ColumnConfig } from '../../lib/services/registrationService';
import { eventService } from '../../lib/services/eventService';
import { formFieldService } from '../../lib/services/formFieldService';
import { emailInvoiceService } from '../../lib/services/emailInvoiceService';
import { ColumnSettingsModal } from '../../components/admin/registrations/ColumnSettingsModal';
import { AttachmentGalleryModal } from '../../components/admin/registrations/AttachmentGalleryModal';
import { EditStatusModal } from '../../components/admin/registrations/EditStatusModal';
import { ResendEmailModal } from '../../components/admin/registrations/ResendEmailModal';
import { BulkActionFloatingBar } from '../../components/admin/registrations/BulkActionFloatingBar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { formatDateIndo, formatRupiah } from '../../lib/utils';
import { 
  Users, 
  Search, 
  Columns, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Filter, 
  Paperclip, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Calendar,
  AlertCircle,
  MoreHorizontal,
  Printer,
  Mail,
  Eye,
  ZoomIn,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GripVertical,
  RotateCcw,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'no', label: 'No.', visible: true },
  { key: 'reg_id', label: 'No. Registrasi', visible: true },
  { key: 'created_at', label: 'Tanggal Daftar', visible: true },
  { key: 'nama', label: 'Nama Peserta', visible: true },
  { key: 'email', label: 'Email', visible: true },
  { key: 'wa', label: 'WhatsApp', visible: true },
  { key: 'event_nama', label: 'Event', visible: true },
  { key: 'status_bayar', label: 'Status Bayar', visible: true },
  { key: 'status_lulus', label: 'Status Lulus', visible: true },
  { key: 'lampiran', label: 'Lampiran', visible: true },
];

export const AdminRegistrationsPage: React.FC = () => {
  const { isSuperAdmin, accessibleEventIds, hasAccessToAll } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabStatusBayar, setActiveTabStatusBayar] = useState<string>('ALL');
  const [activeStatusLulus, setActiveStatusLulus] = useState<string>('ALL');

  // Sorting State (Ascending / Descending)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'created_at',
    direction: 'desc',
  });

  // Columns Configuration & Drag-and-Drop state
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const saved = localStorage.getItem('kobar_expo_reg_columns');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_COLUMNS;
  });
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Modals
  const [galleryRegistration, setGalleryRegistration] = useState<Registration | null>(null);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState<number>(0);
  const [editStatusRegistration, setEditStatusRegistration] = useState<Registration | null>(null);
  const [resendEmailRegistration, setResendEmailRegistration] = useState<Registration | null>(null);

  // Save column order & visibility to localStorage
  const saveColumnsToStorage = (newCols: ColumnConfig[]) => {
    setColumns(newCols);
    try {
      localStorage.setItem('kobar_expo_reg_columns', JSON.stringify(newCols));
    } catch (e) {
      // ignore
    }
  };

  // Reset columns to default
  const handleResetColumns = () => {
    saveColumnsToStorage(DEFAULT_COLUMNS);
  };

  // Toggle sorting on click
  const handleSort = (columnKey: string) => {
    if (columnKey === 'no') return; // Do not sort on row number

    setSortConfig((prev) => {
      if (!prev || prev.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }
      return null; // Cycle to no sort
    });
  };

  // Drag and drop column headers on table
  const handleHeaderDragStart = (e: React.DragEvent, visibleIndex: number) => {
    setDraggedColIndex(visibleIndex);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleHeaderDragOver = (e: React.DragEvent, visibleIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedColIndex !== null && draggedColIndex !== visibleIndex) {
      setDragOverColIndex(visibleIndex);
    }
  };

  const handleHeaderDrop = (e: React.DragEvent, targetVisibleIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === targetVisibleIndex) {
      setDraggedColIndex(null);
      setDragOverColIndex(null);
      return;
    }

    const visibleCols = columns.filter((c) => c.visible);
    const sourceCol = visibleCols[draggedColIndex];
    const targetCol = visibleCols[targetVisibleIndex];

    if (!sourceCol || !targetCol) {
      setDraggedColIndex(null);
      setDragOverColIndex(null);
      return;
    }

    // Reorder in full columns list
    const originalSourceIdx = columns.findIndex((c) => c.key === sourceCol.key);
    const originalTargetIdx = columns.findIndex((c) => c.key === targetCol.key);

    const updated = [...columns];
    const [moved] = updated.splice(originalSourceIdx, 1);
    updated.splice(originalTargetIdx, 0, moved);

    saveColumnsToStorage(updated);
    setDraggedColIndex(null);
    setDragOverColIndex(null);
  };

  const handleHeaderDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedColIndex(null);
    setDragOverColIndex(null);
  };

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      const data = await eventService.getEvents();
      const filtered = data.filter((e) => isSuperAdmin || hasAccessToAll || accessibleEventIds.includes(e.id));
      setEvents(filtered);
    };
    loadEvents();
  }, [isSuperAdmin, hasAccessToAll, accessibleEventIds]);

  // Load dynamic fields for the selected event to populate column settings
  useEffect(() => {
    const loadDynamicColumns = async () => {
      if (selectedEventId && selectedEventId !== 'ALL') {
        const fields = await formFieldService.getFormFields(selectedEventId, 'Pendaftaran');
        const dynamicCols: ColumnConfig[] = fields
          .filter((f) => !['Judul', 'Link', 'Gambar'].includes(f.tipe) && f.label)
          .map((f) => ({
            key: `dyn_${f.label}`,
            label: f.label,
            visible: false, // Default off until enabled
            isDynamic: true,
          }));

        // Merge with defaults
        const base = DEFAULT_COLUMNS.filter((c) => !c.isDynamic);
        setColumns([...base, ...dynamicCols]);
      } else {
        setColumns(DEFAULT_COLUMNS);
      }
    };

    loadDynamicColumns();
  }, [selectedEventId]);

  // Load registrations
  const loadData = async () => {
    setIsLoading(true);
    const data = await registrationService.getRegistrations({
      eventId: selectedEventId,
      search: searchQuery,
      statusBayar: activeTabStatusBayar,
      statusLulus: activeStatusLulus,
    });
    setRegistrations(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    setSelectedIds([]);
  }, [selectedEventId, searchQuery, activeTabStatusBayar, activeStatusLulus]);

  // Calculate status counts for tabs
  const tabCounts = useMemo(() => {
    return {
      all: registrations.length,
      belumBayar: registrations.filter((r) => r.status_bayar === 'Belum Bayar').length,
      verifikasi: registrations.filter((r) => r.status_bayar === 'Verifikasi Proses').length,
      lunas: registrations.filter((r) => r.status_bayar === 'Lunas').length,
      ditolak: registrations.filter((r) => r.status_bayar === 'Ditolak').length,
    };
  }, [registrations]);

  // Sorted registrations based on sortConfig (Ascending / Descending)
  const sortedRegistrations = useMemo(() => {
    if (!sortConfig) return registrations;

    const { key, direction } = sortConfig;
    return [...registrations].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (key === 'no') {
        return 0;
      } else if (key === 'created_at') {
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      } else if (key === 'lampiran') {
        valA = Object.values(a.answers || {}).filter(Boolean).length;
        valB = Object.values(b.answers || {}).filter(Boolean).length;
      } else if (key.startsWith('dyn_')) {
        const fieldLabel = key.replace('dyn_', '');
        valA = (a.answers || {})[fieldLabel] || '';
        valB = (b.answers || {})[fieldLabel] || '';
      } else {
        valA = (a as any)[key] ?? '';
        valB = (b as any)[key] ?? '';
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (direction === 'asc') {
        return strA.localeCompare(strB, 'id', { numeric: true });
      } else {
        return strB.localeCompare(strA, 'id', { numeric: true });
      }
    });
  }, [registrations, sortConfig]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(registrations.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk action handlers
  const handleBulkUpdateBayar = async (status: StatusBayar) => {
    setIsBulkLoading(true);
    await registrationService.bulkUpdateStatus(selectedIds, status, null);
    setIsBulkLoading(false);
    setSelectedIds([]);
    loadData();
  };

  const handleBulkUpdateLulus = async (status: StatusLulus) => {
    setIsBulkLoading(true);
    await registrationService.bulkUpdateStatus(selectedIds, null, status);
    setIsBulkLoading(false);
    setSelectedIds([]);
    loadData();
  };

  const handleBulkDownloadVcf = () => {
    const selectedRegistrations = registrations.filter((r) => selectedIds.includes(r.id));
    registrationService.downloadVcf(selectedRegistrations, `Kontak-KobarExpo-Massal-${Date.now()}`);
  };

  const handleBulkPrintInvoices = () => {
    const selectedRegistrations = registrations.filter((r) => selectedIds.includes(r.id));
    emailInvoiceService.downloadMassInvoices(selectedRegistrations);
  };

  const handleBulkDelete = async () => {
    if (!isSuperAdmin) return;
    if (confirm(`Yakin ingin menghapus ${selectedIds.length} data pendaftar terpilih secara permanen?`)) {
      setIsBulkLoading(true);
      await registrationService.bulkDelete(selectedIds);
      setIsBulkLoading(false);
      setSelectedIds([]);
      loadData();
    }
  };

  // Single action handlers
  const handleSingleDelete = async (id: string, nama: string) => {
    if (!isSuperAdmin) return;
    if (confirm(`Hapus pendaftaran atas nama "${nama}"?`)) {
      await registrationService.deleteRegistration(id);
      loadData();
    }
  };

  const handleSingleDownloadVcf = (r: Registration) => {
    registrationService.downloadVcf([r], `Kontak-${r.reg_id}-${r.nama.replace(/\s+/g, '_')}`);
  };

  // Export handlers
  const handleExportExcel = () => {
    const eventName = selectedEventId === 'ALL' ? 'Semua_Event' : events.find((e) => e.id === selectedEventId)?.nama || 'Event';
    registrationService.exportToExcel(registrations, columns, `Data-Pendaftar-KobarExpo-${eventName}`);
  };

  const handleExportPdf = () => {
    const eventTitle = selectedEventId === 'ALL' ? 'Semua Event Terdaftar' : events.find((e) => e.id === selectedEventId)?.nama || 'Event';
    registrationService.exportToPdf(registrations, columns, eventTitle);
  };

  const handleExportVcfAll = () => {
    registrationService.downloadVcf(registrations, `Semua-Kontak-Pendaftar-KobarExpo-${Date.now()}`);
  };

  // Column toggle
  const handleToggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#201813] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-850/80 shadow-2xs font-baloo">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold font-fredoka text-stone-900 dark:text-stone-100">
              Data Pendaftar & Tindakan Massal
            </h1>
            <Badge variant="festival" className="text-[10px]">
              Tahap 5
            </Badge>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Kelola data peserta, verifikasi pembayaran, kelulusan kurasi, preview lampiran, dan ekspor laporan.
          </p>
        </div>

        {/* Top Export & Settings Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsColumnModalOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs"
            title="Pilih kolom yang tampil di tabel"
          >
            <Columns className="w-3.5 h-3.5 mr-1 text-amber-500" />
            Atur Kolom
          </Button>

          <Button
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
            className="text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
            title="Unduh format spreadsheet .xlsx"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
            Excel
          </Button>

          <Button
            onClick={handleExportPdf}
            variant="outline"
            size="sm"
            className="text-xs text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800"
            title="Unduh laporan rekapitulasi PDF resmi"
          >
            <FileText className="w-3.5 h-3.5 mr-1" />
            PDF
          </Button>

          <Button
            onClick={handleExportVcfAll}
            variant="outline"
            size="sm"
            className="text-xs text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800"
            title="Unduh seluruh kontak peserta ke format VCF 3.0"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Kontak VCF
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#201813] border border-stone-200/80 dark:border-stone-850/80 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Event Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-fredoka">
              Filter Kegiatan / Event:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 font-baloo focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Event ({events.length})</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-fredoka">
              Cari Pendaftar (No. Reg, Nama, Email, WA, Jawaban):
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Ketik kata kunci pencarian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-baloo focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Status Bayar Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-850">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-stone-500 font-baloo mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Status Bayar:
            </span>

            {[
              { key: 'ALL', label: 'Semua', count: tabCounts.all },
              { key: 'Belum Bayar', label: 'Belum Bayar', count: tabCounts.belumBayar },
              { key: 'Verifikasi Proses', label: 'Verifikasi', count: tabCounts.verifikasi },
              { key: 'Lunas', label: 'Lunas', count: tabCounts.lunas },
              { key: 'Ditolak', label: 'Ditolak', count: tabCounts.ditolak },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTabStatusBayar(tab.key)}
                className={`px-3 py-1 rounded-xl text-xs font-bold font-fredoka transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabStatusBayar === tab.key
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Status Kelulusan Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 font-baloo">Status Lulus:</span>
            <select
              value={activeStatusLulus}
              onChange={(e) => setActiveStatusLulus(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-baloo focus:outline-none"
            >
              <option value="ALL">Semua Kelulusan</option>
              <option value="Belum Lulus">Belum Lulus</option>
              <option value="Lulus">Lulus (Kurasi Diterima)</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Registrations Table */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#201813] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-baloo">
            <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 uppercase text-[10px] tracking-wider font-fredoka select-none">
              <tr>
                {/* Select All Checkbox */}
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={sortedRegistrations.length > 0 && selectedIds.length === sortedRegistrations.length}
                    onChange={handleSelectAll}
                    className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                </th>

                {columns.filter((c) => c.visible).map((col, visibleIdx) => {
                  const isSorted = sortConfig?.key === col.key;
                  const sortDir = sortConfig?.direction;
                  const isOver = dragOverColIndex === visibleIdx;
                  const isDragging = draggedColIndex === visibleIdx;

                  return (
                    <th
                      key={col.key}
                      draggable={col.key !== 'no'}
                      onDragStart={(e) => handleHeaderDragStart(e, visibleIdx)}
                      onDragOver={(e) => handleHeaderDragOver(e, visibleIdx)}
                      onDrop={(e) => handleHeaderDrop(e, visibleIdx)}
                      onDragEnd={handleHeaderDragEnd}
                      className={`p-3 whitespace-nowrap transition-all ${
                        isDragging ? 'opacity-30 bg-amber-100 dark:bg-amber-950/60' : ''
                      } ${
                        isOver ? 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 group">
                        {/* Drag Handle */}
                        {col.key !== 'no' && (
                          <span 
                            className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-amber-500 transition-colors"
                            title="Tahan & geser untuk mengubah urutan kolom"
                          >
                            <GripVertical className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                          </span>
                        )}

                        {/* Column Title & Sort Button */}
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className={`inline-flex items-center gap-1 cursor-pointer font-fredoka hover:text-amber-600 dark:hover:text-amber-400 transition-colors ${
                            isSorted ? 'text-amber-600 dark:text-amber-400 font-bold' : ''
                          }`}
                          title={`Klik untuk urutkan ${col.label} (Ascending/Descending)`}
                        >
                          <span>{col.label}</span>

                          {col.key !== 'no' && (
                            <span className="shrink-0">
                              {isSorted ? (
                                sortDir === 'asc' ? (
                                  <span className="p-0.5 rounded-md bg-amber-500 text-white font-bold inline-flex items-center">
                                    <ArrowUp className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <span className="p-0.5 rounded-md bg-amber-500 text-white font-bold inline-flex items-center">
                                    <ArrowDown className="w-3 h-3" />
                                  </span>
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 text-stone-400" />
                              )}
                            </span>
                          )}
                        </button>
                      </div>
                    </th>
                  );
                })}

                <th className="p-3.5 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.filter((c) => c.visible).length + 2} className="p-8 text-center text-stone-400">
                    Memuat data pendaftar...
                  </td>
                </tr>
              ) : sortedRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={columns.filter((c) => c.visible).length + 2} className="p-8 text-center text-stone-400 space-y-1">
                    <p className="font-semibold">Tidak ada pendaftar yang sesuai filter.</p>
                    <p className="text-[11px]">Coba ubah kata kunci pencarian atau tab status di atas.</p>
                  </td>
                </tr>
              ) : (
                sortedRegistrations.map((r, idx) => {
                  const isChecked = selectedIds.includes(r.id);

                  // Count files or signatures
                  const answers = r.answers || {};
                  const hasAttachments = Object.values(answers).some((v) => {
                    const str = String(v);
                    return str.endsWith('.pdf') || str.endsWith('.jpg') || str.endsWith('.png') || str.includes('Tanda Tangan');
                  });

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors ${
                        isChecked ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectRow(r.id)}
                          className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                        />
                      </td>

                      {/* Visible Columns */}
                      {columns.filter((c) => c.visible).map((col) => {
                        if (col.key === 'no') {
                          return <td key={col.key} className="p-3.5 text-stone-400 font-mono">{idx + 1}</td>;
                        }
                        if (col.key === 'reg_id') {
                          return (
                            <td key={col.key} className="p-3.5 font-mono font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                              {r.reg_id}
                            </td>
                          );
                        }
                        if (col.key === 'created_at') {
                          return (
                            <td key={col.key} className="p-3.5 text-stone-500 whitespace-nowrap">
                              {formatDateIndo(r.created_at).split(',')[0]}
                            </td>
                          );
                        }
                        if (col.key === 'nama') {
                          return (
                            <td key={col.key} className="p-3.5 font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                              {r.nama}
                            </td>
                          );
                        }
                        if (col.key === 'email') {
                          return <td key={col.key} className="p-3.5 text-stone-600 dark:text-stone-400 whitespace-nowrap">{r.email}</td>;
                        }
                        if (col.key === 'wa') {
                          return <td key={col.key} className="p-3.5 font-mono text-stone-700 dark:text-stone-300 whitespace-nowrap">{r.wa}</td>;
                        }
                        if (col.key === 'event_nama') {
                          return (
                            <td key={col.key} className="p-3.5 text-stone-700 dark:text-stone-300 max-w-xs truncate">
                              {r.event_nama || '-'}
                            </td>
                          );
                        }
                        if (col.key === 'status_bayar') {
                          return (
                            <td key={col.key} className="p-3.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setEditStatusRegistration(r)}
                                className="cursor-pointer"
                                title="Klik untuk mengubah status"
                              >
                                <Badge
                                  variant={
                                    r.status_bayar === 'Lunas'
                                      ? 'success'
                                      : r.status_bayar === 'Verifikasi Proses'
                                      ? 'warning'
                                      : 'danger'
                                  }
                                  className="text-[10px]"
                                >
                                  {r.status_bayar}
                                </Badge>
                              </button>
                            </td>
                          );
                        }
                        if (col.key === 'status_lulus') {
                          return (
                            <td key={col.key} className="p-3.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setEditStatusRegistration(r)}
                                className="cursor-pointer"
                                title="Klik untuk mengubah status"
                              >
                                <Badge
                                  variant={r.status_lulus === 'Belum Lulus' ? 'neutral' : 'info'}
                                  className="text-[10px]"
                                >
                                  {r.status_lulus}
                                </Badge>
                              </button>
                            </td>
                          );
                        }
                        if (col.key === 'lampiran') {
                          // Extract file items for direct thumbnail preview
                          const fileEntries: string[] = [];
                          Object.entries(answers).forEach(([k, v]) => {
                            if (!v) return;
                            const s = String(v);
                            if (s.endsWith('.jpg') || s.endsWith('.jpeg') || s.endsWith('.png') || s.endsWith('.webp') || s.endsWith('.pdf') || s.startsWith('data:') || s.startsWith('http') || k.toLowerCase().includes('ttd') || s.includes('Tanda Tangan')) {
                              fileEntries.push(s);
                            }
                          });

                          const fileCount = fileEntries.length;
                          const firstFile = fileEntries[0] || '';
                          const isFirstImage = !firstFile.endsWith('.pdf');

                          return (
                            <td key={col.key} className="p-3.5 whitespace-nowrap">
                              {fileCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGalleryInitialIndex(0);
                                    setGalleryRegistration(r);
                                  }}
                                  className="group inline-flex items-center gap-2 p-1 pr-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer select-none text-left"
                                  title="Klik untuk Preview Langsung, Zoom, dan Unduh Lampiran"
                                >
                                  {/* Direct Thumbnail Preview */}
                                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shrink-0 shadow-2xs group-hover:scale-105 transition-transform flex items-center justify-center">
                                    {isFirstImage ? (
                                      <img
                                        src={firstFile.startsWith('http') || firstFile.startsWith('data:') ? firstFile : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&q=80'}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <FileText className="w-4 h-4 text-rose-500" />
                                    )}

                                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  </div>

                                  {/* Label & Count Badge */}
                                  <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center gap-1">
                                      <span>Preview</span>
                                      <ZoomIn className="w-3 h-3 text-stone-400 group-hover:text-amber-500" />
                                    </span>
                                    <span className="text-[10px] text-stone-500 font-mono">
                                      {fileCount} Berkas
                                    </span>
                                  </div>
                                </button>
                              ) : (
                                <span className="text-stone-400 text-[11px]">-</span>
                              )}
                            </td>
                          );
                        }
                        if (col.isDynamic) {
                          const val = r.answers?.[col.label];
                          return (
                            <td key={col.key} className="p-3.5 max-w-xs truncate text-stone-700 dark:text-stone-300">
                              {val !== undefined && val !== null ? String(val) : '-'}
                            </td>
                          );
                        }
                        return <td key={col.key} className="p-3.5">-</td>;
                      })}

                      {/* Row Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Status Button */}
                          <button
                            type="button"
                            onClick={() => setEditStatusRegistration(r)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            title="Ubah Status Bayar & Lulus"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Invoice PDF Button */}
                          <button
                            type="button"
                            onClick={() => emailInvoiceService.downloadInvoicePdf(r)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                            title="Cetak Invoice PDF Resmi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Resend Email Button */}
                          <button
                            type="button"
                            onClick={() => setResendEmailRegistration(r)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                            title="Kirim Ulang Notifikasi Email (Resend)"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Single VCF Download */}
                          <button
                            type="button"
                            onClick={() => handleSingleDownloadVcf(r)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                            title="Unduh Kontak VCF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete (Super Admin only) */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleSingleDelete(r.id, r.nama)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Hapus Data Peserta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bar for Bulk Actions */}
      <BulkActionFloatingBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkUpdateBayar={handleBulkUpdateBayar}
        onBulkUpdateLulus={handleBulkUpdateLulus}
        onBulkDownloadVcf={handleBulkDownloadVcf}
        onBulkPrintInvoices={handleBulkPrintInvoices}
        onBulkDelete={handleBulkDelete}
        isSuperAdmin={isSuperAdmin}
        isLoading={isBulkLoading}
      />

      {/* MODAL: Column Settings */}
      <ColumnSettingsModal
        isOpen={isColumnModalOpen}
        columns={columns}
        onToggleColumn={handleToggleColumn}
        onReorderColumns={saveColumnsToStorage}
        onResetColumns={handleResetColumns}
        onSave={() => setIsColumnModalOpen(false)}
        onClose={() => setIsColumnModalOpen(false)}
      />

      {/* MODAL: Attachment Gallery */}
      <AttachmentGalleryModal
        isOpen={Boolean(galleryRegistration)}
        registration={galleryRegistration}
        initialIndex={galleryInitialIndex}
        onClose={() => setGalleryRegistration(null)}
      />

      {/* MODAL: Edit Status */}
      <EditStatusModal
        isOpen={Boolean(editStatusRegistration)}
        registration={editStatusRegistration}
        onClose={() => setEditStatusRegistration(null)}
        onSuccess={loadData}
      />

      {/* MODAL: Resend Email */}
      <ResendEmailModal
        isOpen={Boolean(resendEmailRegistration)}
        registration={resendEmailRegistration}
        onClose={() => setResendEmailRegistration(null)}
      />
    </div>
  );
};
