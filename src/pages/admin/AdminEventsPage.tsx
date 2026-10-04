import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EventItem } from '../../types/database';
import { eventService } from '../../lib/services/eventService';
import { EventModal } from '../../components/admin/EventModal';
import { InvitationCodeModal } from '../../components/admin/InvitationCodeModal';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../lib/utils';
import { 
  Plus, 
  GripVertical, 
  Edit3, 
  Trash2, 
  Key, 
  Lock, 
  Calendar, 
  MapPin, 
  Users, 
  RefreshCw,
  Search,
  Sparkles,
  ShieldAlert
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Row Component for @dnd-kit
interface SortableRowProps {
  event: EventItem;
  index: number;
  isSuperAdmin: boolean;
  onEdit: (event: EventItem) => void;
  onDelete: (eventId: string) => void;
  onOpenCodes: (event: EventItem) => void;
}

const SortableEventRow: React.FC<SortableRowProps> = ({
  event,
  index,
  isSuperAdmin,
  onEdit,
  onDelete,
  onOpenCodes,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id, disabled: !isSuperAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  const isClosed = event.status === 'Tutup';
  const isDraft = event.status === 'Draft';
  const isInvitation = event.mode_akses === 'Undangan';

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group hover:bg-stone-50/70 dark:hover:bg-stone-850/50 transition-colors ${
        isDragging ? 'bg-amber-50 dark:bg-amber-950/40 shadow-lg' : ''
      }`}
    >
      {/* Drag Handle */}
      <td className="px-3 py-3.5 w-10 text-center">
        {isSuperAdmin ? (
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-grab active:cursor-grabbing"
            title="Tahan & geser untuk mengubah urutan"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-stone-400 text-xs font-mono">{index + 1}</span>
        )}
      </td>

      {/* Event Details */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt=""
              className="w-12 h-10 object-cover rounded-lg border border-stone-200 dark:border-stone-800 shrink-0"
            />
          ) : (
            <div className="w-12 h-10 rounded-lg bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-400 text-xs font-mono shrink-0">
              EVT
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-fredoka font-bold text-stone-900 dark:text-stone-100 text-sm truncate max-w-sm">
                {event.nama}
              </span>
              {isInvitation && (
                <Badge variant="warning" className="text-[10px] py-0">
                  <Lock className="w-2.5 h-2.5 mr-0.5" />
                  Undangan
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-500 font-baloo mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-500" />
                {event.tanggal}
              </span>
              <span className="flex items-center gap-1 truncate max-w-[180px]">
                <MapPin className="w-3 h-3 text-rose-500" />
                {event.lokasi}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Status Badge */}
      <td className="px-4 py-3.5">
        <Badge
          variant={
            event.status === 'Buka'
              ? 'success'
              : event.status === 'Tutup'
              ? 'danger'
              : 'neutral'
          }
          className="text-xs uppercase font-fredoka"
        >
          {event.status}
        </Badge>
      </td>

      {/* Kuota */}
      <td className="px-4 py-3.5 text-stone-700 dark:text-stone-300 font-baloo">
        {event.kuota ? `${event.kuota} Peserta` : 'Tanpa Batas'}
      </td>

      {/* Harga & Bayar Lanjut */}
      <td className="px-4 py-3.5 font-baloo">
        <div className="font-bold text-stone-900 dark:text-stone-100">
          {formatRupiah(event.harga)}
        </div>
        {event.bayar_lanjut && (
          <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
            Bayar Terpisah
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {/* Panel Kode Undangan (Jika mode Undangan) */}
          {isInvitation && (
            <Button
              onClick={() => onOpenCodes(event)}
              variant="outline"
              size="sm"
              className="text-xs px-2.5 py-1 text-amber-600 border-amber-300 dark:border-amber-800"
              title="Kelola Kode Undangan"
            >
              <Key className="w-3.5 h-3.5 mr-1" />
              Kode
            </Button>
          )}

          {/* Edit Button */}
          {isSuperAdmin && (
            <Button
              onClick={() => onEdit(event)}
              variant="ghost"
              size="sm"
              className="p-1.5 text-stone-600 hover:text-amber-600"
              title="Edit Event"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}

          {/* Delete Button */}
          {isSuperAdmin && (
            <Button
              onClick={() => onDelete(event.id)}
              variant="ghost"
              size="sm"
              className="p-1.5 text-stone-400 hover:text-rose-600"
              title="Hapus Event"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

export const AdminEventsPage: React.FC = () => {
  const { isSuperAdmin, accessibleEventIds, hasAccessToAll } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Buka' | 'Tutup' | 'Draft'>('all');

  // Modals state
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<EventItem | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventForCodes, setSelectedEventForCodes] = useState<EventItem | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchEvents = async () => {
    setIsLoading(true);
    const data = await eventService.getEvents();
    setEvents(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter based on admin permissions first
  const permittedEvents = events.filter((evt) => {
    if (isSuperAdmin || hasAccessToAll) return true;
    return accessibleEventIds.includes(evt.id);
  });

  // Filter based on UI search and status
  const filteredEvents = permittedEvents.filter((evt) => {
    const matchesSearch = evt.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          evt.lokasi.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && evt.status === statusFilter;
  });

  // Handle Drag & Drop End
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !isSuperAdmin) return;

    const oldIndex = events.findIndex((e) => e.id === active.id);
    const newIndex = events.findIndex((e) => e.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(events, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        urutan: idx + 1,
      }));

      setEvents(reordered);

      // Save reordering to database
      await eventService.reorderEvents(
        reordered.map((item) => ({ id: item.id, urutan: item.urutan })),
        isSuperAdmin
      );
    }
  };

  const handleCreate = () => {
    setSelectedEventForEdit(null);
    setIsEventModalOpen(true);
  };

  const handleEdit = (evt: EventItem) => {
    setSelectedEventForEdit(evt);
    setIsEventModalOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus event ini? Seluruh form field dan data pendaftar terkait akan ikut terhapus!')) {
      const res = await eventService.deleteEvent(eventId, isSuperAdmin);
      if (res.error) {
        alert(res.error);
      } else {
        await fetchEvents();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#201813] p-4 rounded-2xl border border-stone-200/80 dark:border-stone-850/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold font-fredoka text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Manajemen Agenda Event Kobar Expo</span>
            <span className="festival-ribbon text-[11px] bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full">
              2026
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-baloo">
            {isSuperAdmin
              ? 'Tahan dan geser ikon untuk mengatur urutan tampilan kartu event di beranda publik.'
              : 'Menampilkan event yang ditugaskan kepada akun Anda.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchEvents}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>

          {isSuperAdmin && (
            <Button
              onClick={handleCreate}
              variant="festival"
              size="sm"
              className="text-xs shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Event Baru
            </Button>
          )}
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Sebagai <strong>Panitia (Admin)</strong>, Anda dapat melihat rincian event dan kode undangan yang ditugaskan. Penambahan, pengeditan, atau pengubahan urutan event dikelola oleh <strong>Super Admin</strong>.
          </span>
        </div>
      )}

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari event atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-[#201813] border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
          {(['all', 'Buka', 'Tutup', 'Draft'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-white dark:bg-[#201813] border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              {st === 'all' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Events Table with DnD */}
      <div className="overflow-x-auto rounded-2xl border border-stone-200/90 dark:border-stone-850/90 bg-white dark:bg-[#201813] shadow-xs">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full text-left text-xs font-baloo">
            <thead className="bg-stone-50 dark:bg-stone-900/50 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="px-3 py-3 w-10 text-center">Urut</th>
                <th className="px-4 py-3">Nama Event & Lokasi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Kuota</th>
                <th className="px-4 py-3">Biaya</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
              <SortableContext
                items={filteredEvents.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-stone-400">
                      {isLoading ? 'Memuat data event...' : 'Tidak ada agenda event yang sesuai filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt, idx) => (
                    <SortableEventRow
                      key={evt.id}
                      event={evt}
                      index={idx}
                      isSuperAdmin={isSuperAdmin}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onOpenCodes={(e) => {
                        setSelectedEventForCodes(e);
                        setIsCodeModalOpen(true);
                      }}
                    />
                  ))
                )}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Modal Tambah/Edit Event */}
      <EventModal
        isOpen={isEventModalOpen}
        event={selectedEventForEdit}
        onClose={() => setIsEventModalOpen(false)}
        onSaved={fetchEvents}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Modal Kode Undangan */}
      <InvitationCodeModal
        isOpen={isCodeModalOpen}
        event={selectedEventForCodes}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
};
