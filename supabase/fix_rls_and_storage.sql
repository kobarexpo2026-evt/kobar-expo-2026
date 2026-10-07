-- ==============================================================================
-- KOBAR EXPO 2026 - RLS POLICIES & STORAGE BUCKET FIX
-- Jalankan script ini di Supabase SQL Editor untuk mengizinkan penyimpanan Event & Upload Gambar
-- ==============================================================================

-- 1. FIX TABLE RLS POLICIES (EVENTS, FORM FIELDS, CODES, REGISTRATIONS, TEMPLATES)
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registration_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_event_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_column_preferences ENABLE ROW LEVEL SECURITY;

-- EVENTS POLICIES
DROP POLICY IF EXISTS "events_public_select" ON public.events;
DROP POLICY IF EXISTS "events_super_admin_all" ON public.events;
DROP POLICY IF EXISTS "events_all_access" ON public.events;
CREATE POLICY "events_all_access" ON public.events
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- FORM FIELDS POLICIES
DROP POLICY IF EXISTS "form_fields_public_select" ON public.form_fields;
DROP POLICY IF EXISTS "form_fields_super_admin_manage" ON public.form_fields;
DROP POLICY IF EXISTS "form_fields_all_access" ON public.form_fields;
CREATE POLICY "form_fields_all_access" ON public.form_fields
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- INVITATION CODES POLICIES
DROP POLICY IF EXISTS "invitation_codes_admin_select" ON public.invitation_codes;
DROP POLICY IF EXISTS "invitation_codes_super_admin_manage" ON public.invitation_codes;
DROP POLICY IF EXISTS "invitation_codes_all_access" ON public.invitation_codes;
CREATE POLICY "invitation_codes_all_access" ON public.invitation_codes
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- REGISTRATIONS POLICIES
DROP POLICY IF EXISTS "registrations_admin_select" ON public.registrations;
DROP POLICY IF EXISTS "registrations_admin_update" ON public.registrations;
DROP POLICY IF EXISTS "registrations_all_access" ON public.registrations;
CREATE POLICY "registrations_all_access" ON public.registrations
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- REGISTRATION FILES POLICIES
DROP POLICY IF EXISTS "registration_files_admin_select" ON public.registration_files;
DROP POLICY IF EXISTS "registration_files_all_access" ON public.registration_files;
CREATE POLICY "registration_files_all_access" ON public.registration_files
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- PAYMENT SUBMISSIONS POLICIES
DROP POLICY IF EXISTS "payment_submissions_all_access" ON public.payment_submissions;
CREATE POLICY "payment_submissions_all_access" ON public.payment_submissions
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- TEMPLATES POLICIES
DROP POLICY IF EXISTS "templates_super_admin_all" ON public.invoice_templates;
DROP POLICY IF EXISTS "invoice_templates_all_access" ON public.invoice_templates;
CREATE POLICY "invoice_templates_all_access" ON public.invoice_templates
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "email_templates_super_admin_all" ON public.email_templates;
DROP POLICY IF EXISTS "email_templates_all_access" ON public.email_templates;
CREATE POLICY "email_templates_all_access" ON public.email_templates
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_all_access" ON public.profiles;
CREATE POLICY "profiles_all_access" ON public.profiles
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ADMIN EVENT ACCESS POLICIES
DROP POLICY IF EXISTS "admin_event_access_super_admin" ON public.admin_event_access;
DROP POLICY IF EXISTS "admin_event_access_self_select" ON public.admin_event_access;
DROP POLICY IF EXISTS "admin_event_access_all" ON public.admin_event_access;
CREATE POLICY "admin_event_access_all" ON public.admin_event_access
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ADMIN COLUMN PREFERENCES POLICIES
DROP POLICY IF EXISTS "column_prefs_user_all" ON public.admin_column_preferences;
DROP POLICY IF EXISTS "column_prefs_all" ON public.admin_column_preferences;
CREATE POLICY "column_prefs_all" ON public.admin_column_preferences
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 2. STORAGE BUCKETS & STORAGE POLICIES FIX (BANNER & QRIS UPLOAD)
-- ==============================================================================

-- Buat bucket 'assets' (public) dan 'registrations' (public) jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('registrations', 'registrations', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Hapus policy lama storage
DROP POLICY IF EXISTS "assets_public_read" ON storage.objects;
DROP POLICY IF EXISTS "assets_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "assets_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "registrations_admin_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_assets_all" ON storage.objects;
DROP POLICY IF EXISTS "storage_registrations_all" ON storage.objects;

-- Pasang policy storage baru untuk upload/download banner, qris, file pendaftar
CREATE POLICY "storage_assets_all" ON storage.objects
    FOR ALL TO anon, authenticated
    USING (bucket_id = 'assets')
    WITH CHECK (bucket_id = 'assets');

CREATE POLICY "storage_registrations_all" ON storage.objects
    FOR ALL TO anon, authenticated
    USING (bucket_id = 'registrations')
    WITH CHECK (bucket_id = 'registrations');
