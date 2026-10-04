import { supabase, isSupabaseConfigured } from '../supabase/client';
import { EventItem, InvitationCode } from '../../types/database';
import { generateBatchCodes } from '../codeGenerator';

// No sample events - purely database-driven
const DEFAULT_EVENTS: EventItem[] = [];

// Helper to get local stored events
function getLocalEvents(): EventItem[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('kobar_expo_events');
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    // If it contains old sample data, purge it
    if (Array.isArray(parsed) && parsed.some((e: any) => e.id?.startsWith('e1111111'))) {
      localStorage.removeItem('kobar_expo_events');
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveLocalEvents(events: EventItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kobar_expo_events', JSON.stringify(events));
  }
}

// Helper to get local invitation codes
function getLocalCodes(eventId: string): InvitationCode[] {
  if (typeof window === 'undefined') return [];
  const key = `kobar_invitation_codes_${eventId}`;
  const saved = localStorage.getItem(key);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveLocalCodes(eventId: string, codes: InvitationCode[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`kobar_invitation_codes_${eventId}`, JSON.stringify(codes));
  }
}

export const eventService = {
  // Fetch events with server-side / role-based filtering
  async getEvents(userId?: string, isSuperAdmin: boolean = false): Promise<EventItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, registrations(count)')
          .order('urutan', { ascending: true });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.error('Supabase getEvents error:', err);
      }
    }
    return getLocalEvents().sort((a, b) => a.urutan - b.urutan);
  },

  // Create or Update Event (Super Admin only)
  async saveEvent(eventData: Partial<EventItem>, isSuperAdmin: boolean): Promise<{ data?: EventItem; error?: string }> {
    if (!isSuperAdmin) {
      return { error: 'Hak Akses Ditolak: Hanya Super Admin yang berwenang menambah atau mengedit event!' };
    }

    if (!eventData.nama || !eventData.tanggal || !eventData.lokasi) {
      return { error: 'Harap lengkapi nama, tanggal, dan lokasi event.' };
    }

    if (isSupabaseConfigured) {
      try {
        if (eventData.id) {
          const { data, error } = await supabase
            .from('events')
            .update({
              nama: eventData.nama,
              tanggal: eventData.tanggal,
              lokasi: eventData.lokasi,
              status: eventData.status,
              kuota: eventData.kuota,
              banner_url: eventData.banner_url,
              qris_url: eventData.qris_url,
              harga: eventData.harga || 0,
              bayar_lanjut: eventData.bayar_lanjut || false,
              mode_akses: eventData.mode_akses || 'Publik',
              urutan: eventData.urutan || 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', eventData.id)
            .select()
            .single();

          if (error) return { error: error.message };
          return { data };
        } else {
          const kode = `EVT-${Date.now()}`;
          const { data, error } = await supabase
            .from('events')
            .insert({
              ...eventData,
              kode,
              harga: eventData.harga || 0,
              bayar_lanjut: eventData.bayar_lanjut || false,
              mode_akses: eventData.mode_akses || 'Publik',
            })
            .select()
            .single();

          if (error) return { error: error.message };
          return { data };
        }
      } catch (err: any) {
        return { error: err.message };
      }
    }

    // Local Storage Mock Persistence
    const currentEvents = getLocalEvents();
    if (eventData.id) {
      const index = currentEvents.findIndex((e) => e.id === eventData.id);
      if (index >= 0) {
        const updated: EventItem = {
          ...currentEvents[index],
          ...eventData,
        } as EventItem;
        currentEvents[index] = updated;
        saveLocalEvents(currentEvents);
        return { data: updated };
      }
      return { error: 'Event tidak ditemukan' };
    } else {
      const newEvent: EventItem = {
        id: `evt-${Date.now()}`,
        kode: `EVT-${Date.now()}`,
        nama: eventData.nama!,
        tanggal: eventData.tanggal!,
        lokasi: eventData.lokasi!,
        status: eventData.status || 'Draft',
        kuota: eventData.kuota ?? null,
        banner_url: eventData.banner_url || null,
        qris_url: eventData.qris_url || null,
        harga: Number(eventData.harga) || 0,
        bayar_lanjut: Boolean(eventData.bayar_lanjut),
        mode_akses: eventData.mode_akses || 'Publik',
        urutan: currentEvents.length + 1,
        created_at: new Date().toISOString(),
        total_pendaftar: 0,
        total_lunas: 0,
      };
      currentEvents.push(newEvent);
      saveLocalEvents(currentEvents);
      return { data: newEvent };
    }
  },

  // Delete Event (Super Admin only)
  async deleteEvent(eventId: string, isSuperAdmin: boolean): Promise<{ success?: boolean; error?: string }> {
    if (!isSuperAdmin) {
      return { error: 'Hak Akses Ditolak: Hanya Super Admin yang berwenang menghapus event!' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('events').delete().eq('id', eventId);
        if (error) return { error: error.message };
        return { success: true };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    const currentEvents = getLocalEvents();
    const filtered = currentEvents.filter((e) => e.id !== eventId);
    saveLocalEvents(filtered);
    return { success: true };
  },

  // Reorder events via drag & drop (Super Admin only)
  async reorderEvents(orderedEvents: { id: string; urutan: number }[], isSuperAdmin: boolean): Promise<{ success?: boolean; error?: string }> {
    if (!isSuperAdmin) {
      return { error: 'Hak Akses Ditolak: Hanya Super Admin yang dapat mengatur urutan event!' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('reorder_events', {
          p_orders: orderedEvents,
        });
        if (error) {
          // Fallback to loop update if RPC not yet deployed
          for (const item of orderedEvents) {
            await supabase.from('events').update({ urutan: item.urutan }).eq('id', item.id);
          }
        }
        return { success: true };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    // Local Storage reorder
    const currentEvents = getLocalEvents();
    orderedEvents.forEach((item) => {
      const found = currentEvents.find((e) => e.id === item.id);
      if (found) found.urutan = item.urutan;
    });
    saveLocalEvents(currentEvents);
    return { success: true };
  },

  // Upload Asset (Banner / QRIS) to Supabase Storage bucket 'assets'
  async uploadAssetFile(file: File, folder: 'banners' | 'qris'): Promise<{ url?: string; error?: string }> {
    if (file.size > 2 * 1024 * 1024) {
      return { error: 'Ukuran file terlalu besar. Maksimal 2 MB.' };
    }

    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(fileName, file, { upsert: true });

        if (uploadError) return { error: uploadError.message };

        const { data } = supabase.storage.from('assets').getPublicUrl(fileName);
        return { url: data.publicUrl };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    // Fallback: create an object URL or base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ url: reader.result as string });
      };
      reader.onerror = () => {
        resolve({ error: 'Gagal memproses file' });
      };
      reader.readAsDataURL(file);
    });
  },

  // Fetch Invitation Codes for an event
  async getInvitationCodes(eventId: string): Promise<InvitationCode[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('invitation_codes')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.error('getInvitationCodes error:', err);
      }
    }
    return getLocalCodes(eventId);
  },

  // Bulk generate invitation codes (8 chars, uppercase + numbers without 0, O, 1, I)
  async generateInvitationCodes(eventId: string, count: number, limit: number = 1): Promise<{ success: boolean; generated: string[]; error?: string }> {
    if (count > 1000) {
      return { success: false, generated: [], error: 'Maksimal pembuatan kode sekaligus adalah 1000 kode.' };
    }

    const newCodes = generateBatchCodes(count);

    if (isSupabaseConfigured) {
      try {
        const rows = newCodes.map((kode) => ({
          event_id: eventId,
          kode,
          batas_pemakaian: limit,
          jumlah_terpakai: 0,
        }));

        const { error } = await supabase.from('invitation_codes').insert(rows);
        if (error) return { success: false, generated: [], error: error.message };
        return { success: true, generated: newCodes };
      } catch (err: any) {
        return { success: false, generated: [], error: err.message };
      }
    }

    // Local Storage mock
    const currentCodes = getLocalCodes(eventId);
    const added: InvitationCode[] = newCodes.map((k) => ({
      id: `code-${Date.now()}-${Math.random()}`,
      event_id: eventId,
      kode: k,
      batas_pemakaian: limit,
      jumlah_terpakai: 0,
      created_at: new Date().toISOString(),
    }));

    const combined = [...added, ...currentCodes];
    saveLocalCodes(eventId, combined);
    return { success: true, generated: newCodes };
  },

  // Delete invitation code
  async deleteInvitationCode(codeId: string, eventId: string): Promise<{ success: boolean }> {
    if (isSupabaseConfigured) {
      await supabase.from('invitation_codes').delete().eq('id', codeId);
    }
    const currentCodes = getLocalCodes(eventId);
    saveLocalCodes(eventId, currentCodes.filter((c) => c.id !== codeId));
    return { success: true };
  },
};
