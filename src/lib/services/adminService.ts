import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Profile, UserRole } from '../../types/database';

export interface AdminWithAccess extends Profile {
  assigned_event_ids: string[];
}

const DEFAULT_ADMINS: AdminWithAccess[] = [
  {
    id: 'super-admin-ananda',
    nama: 'Ananda Poji (Super Admin)',
    email: 'ananda.poji@gmail.com',
    role: 'super_admin',
    created_at: new Date().toISOString(),
    assigned_event_ids: [],
  },
];

function getLocalAdmins(): AdminWithAccess[] {
  if (typeof window === 'undefined') return DEFAULT_ADMINS;
  const saved = localStorage.getItem('kobar_expo_admins');
  if (!saved) {
    localStorage.setItem('kobar_expo_admins', JSON.stringify(DEFAULT_ADMINS));
    return DEFAULT_ADMINS;
  }
  try {
    const parsed = JSON.parse(saved);
    // If it contains old sample data, replace with current user super admin
    if (Array.isArray(parsed) && parsed.some((a: any) => a.email === 'superadmin@kobarexpo.id')) {
      localStorage.setItem('kobar_expo_admins', JSON.stringify(DEFAULT_ADMINS));
      return DEFAULT_ADMINS;
    }
    return parsed;
  } catch {
    return DEFAULT_ADMINS;
  }
}

function saveLocalAdmins(admins: AdminWithAccess[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kobar_expo_admins', JSON.stringify(admins));
  }
}

export const adminService = {
  // Fetch all admins with their assigned event ids
  async getAdmins(isSuperAdmin: boolean): Promise<AdminWithAccess[]> {
    if (!isSuperAdmin) {
      return [];
    }

    if (isSupabaseConfigured) {
      try {
        const { data: profiles, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!profileErr && profiles) {
          const { data: accessRows } = await supabase
            .from('admin_event_access')
            .select('admin_id, event_id');

          return profiles.map((p: Profile) => {
            const assigned = (accessRows || [])
              .filter((a: any) => a.admin_id === p.id)
              .map((a: any) => a.event_id);
            return {
              ...p,
              assigned_event_ids: assigned,
            };
          });
        }
      } catch (err) {
        console.error('getAdmins error:', err);
      }
    }

    return getLocalAdmins();
  },

  // Save admin user (Create or Update)
  async saveAdmin(
    adminData: {
      id?: string;
      nama: string;
      email: string;
      password?: string;
      role: UserRole;
      assigned_event_ids: string[];
    },
    currentUserId: string,
    isSuperAdmin: boolean
  ): Promise<{ data?: AdminWithAccess; error?: string }> {
    if (!isSuperAdmin) {
      return { error: 'Hak Akses Ditolak: Hanya Super Admin yang berhak mengelola akun admin!' };
    }

    if (!adminData.nama || !adminData.email) {
      return { error: 'Harap lengkapi nama dan alamat email.' };
    }

    // Email uniqueness check
    const currentAdmins = getLocalAdmins();
    const emailConflict = currentAdmins.find(
      (a) => a.email.toLowerCase() === adminData.email.toLowerCase() && a.id !== adminData.id
    );
    if (emailConflict) {
      return { error: 'Email ini sudah terdaftar untuk akun panitia lain!' };
    }

    if (isSupabaseConfigured) {
      try {
        // If updating
        if (adminData.id) {
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({
              nama: adminData.nama,
              role: adminData.role,
              updated_at: new Date().toISOString(),
            })
            .eq('id', adminData.id);

          if (profileErr) return { error: profileErr.message };

          // Sync access
          await supabase.from('admin_event_access').delete().eq('admin_id', adminData.id);
          if (adminData.role === 'admin' && adminData.assigned_event_ids.length > 0) {
            const rows = adminData.assigned_event_ids.map((eventId) => ({
              admin_id: adminData.id!,
              event_id: eventId,
            }));
            await supabase.from('admin_event_access').insert(rows);
          }

          return {
            data: {
              id: adminData.id,
              nama: adminData.nama,
              email: adminData.email,
              role: adminData.role,
              created_at: new Date().toISOString(),
              assigned_event_ids: adminData.role === 'admin' ? adminData.assigned_event_ids : [],
            },
          };
        } else {
          // If creating new admin
          if (!adminData.password || adminData.password.length < 6) {
            return { error: 'Password baru wajib diisi minimal 6 karakter.' };
          }

          // In client-side Supabase, signup creates an auth user
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: adminData.email,
            password: adminData.password,
            options: {
              data: { nama: adminData.nama, role: adminData.role },
            },
          });

          if (authErr) return { error: authErr.message };
          const newUserId = authData.user?.id || `admin-${Date.now()}`;

          // Profile row
          await supabase.from('profiles').upsert({
            id: newUserId,
            nama: adminData.nama,
            email: adminData.email,
            role: adminData.role,
          });

          if (adminData.role === 'admin' && adminData.assigned_event_ids.length > 0) {
            const rows = adminData.assigned_event_ids.map((eventId) => ({
              admin_id: newUserId,
              event_id: eventId,
            }));
            await supabase.from('admin_event_access').insert(rows);
          }

          return {
            data: {
              id: newUserId,
              nama: adminData.nama,
              email: adminData.email,
              role: adminData.role,
              created_at: new Date().toISOString(),
              assigned_event_ids: adminData.assigned_event_ids,
            },
          };
        }
      } catch (err: any) {
        return { error: err.message };
      }
    }

    // Local storage mock
    if (adminData.id) {
      const index = currentAdmins.findIndex((a) => a.id === adminData.id);
      if (index >= 0) {
        const updated: AdminWithAccess = {
          ...currentAdmins[index],
          nama: adminData.nama,
          email: adminData.email,
          role: adminData.role,
          assigned_event_ids: adminData.role === 'super_admin' ? [] : adminData.assigned_event_ids,
        };
        currentAdmins[index] = updated;
        saveLocalAdmins(currentAdmins);
        return { data: updated };
      }
      return { error: 'Akun admin tidak ditemukan.' };
    } else {
      if (!adminData.password || adminData.password.length < 6) {
        return { error: 'Password baru wajib diisi minimal 6 karakter.' };
      }
      const newAdmin: AdminWithAccess = {
        id: `admin-${Date.now()}`,
        nama: adminData.nama,
        email: adminData.email,
        role: adminData.role,
        created_at: new Date().toISOString(),
        assigned_event_ids: adminData.role === 'super_admin' ? [] : adminData.assigned_event_ids,
      };
      currentAdmins.push(newAdmin);
      saveLocalAdmins(currentAdmins);
      return { data: newAdmin };
    }
  },

  // Delete admin (Super Admin only, cannot delete self!)
  async deleteAdmin(
    adminId: string,
    currentUserId: string,
    isSuperAdmin: boolean
  ): Promise<{ success?: boolean; error?: string }> {
    if (!isSuperAdmin) {
      return { error: 'Hak Akses Ditolak: Hanya Super Admin yang dapat menghapus akun!' };
    }

    // Rule: Super Admin tidak boleh menghapus akunnya sendiri
    if (adminId === currentUserId) {
      return { error: 'Pelanggaran Aturan: Super Admin tidak dapat menghapus akunnya sendiri!' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', adminId);
        if (error) return { error: error.message };
        return { success: true };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    const currentAdmins = getLocalAdmins();
    const filtered = currentAdmins.filter((a) => a.id !== adminId);
    saveLocalAdmins(filtered);
    return { success: true };
  },
};
