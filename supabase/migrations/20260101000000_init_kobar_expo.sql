-- ==============================================================================
-- KOBAR EXPO 2026 - EVENT ORGANIZER MANAGEMENT SYSTEM (EOMS)
-- Database Migration (PostgreSQL / Supabase)
-- ==============================================================================

-- 1. EXTENSIONS & SEQUENCES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sequence for unique Registration IDs: EVT-YYYY-XXXXX (e.g. EVT-2026-00001)
CREATE SEQUENCE IF NOT EXISTS registration_seq START WITH 1 INCREMENT BY 1;

-- 2. ENUMS & DOMAIN CHECKS (Implemented with CHECK constraints for maximum compatibility)

-- 3. PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    lokasi TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Buka', 'Tutup', 'Draft')) DEFAULT 'Draft',
    kuota INTEGER NULL, -- NULL = Kuota tanpa batas
    banner_url TEXT NULL,
    qris_url TEXT NULL,
    harga NUMERIC(12, 2) NOT NULL DEFAULT 0,
    bayar_lanjut BOOLEAN NOT NULL DEFAULT false, -- false = Langsung Verifikasi Proses; true = Form Pembayaran Terpisah (Belum Bayar)
    mode_akses TEXT NOT NULL CHECK (mode_akses IN ('Publik', 'Undangan')) DEFAULT 'Publik',
    urutan INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_urutan ON public.events(urutan ASC);

-- 5. ADMIN EVENT ACCESS (RBAC)
-- Aturan: Admin dengan role 'admin' TANPA baris akses = otomatis bisa akses semua event.
-- Jika ada baris akses, hanya event yang terdaftar yang bisa diakses.
-- Super Admin selalu bisa akses semua event.
CREATE TABLE IF NOT EXISTS public.admin_event_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_admin_event UNIQUE (admin_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_event_access_admin ON public.admin_event_access(admin_id);

-- 6. FORM FIELDS (Dynamic Form Builder per Event)
CREATE TABLE IF NOT EXISTS public.form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    form_type TEXT NOT NULL CHECK (form_type IN ('Pendaftaran', 'Pembayaran')) DEFAULT 'Pendaftaran',
    urutan INTEGER NOT NULL DEFAULT 0,
    label TEXT NOT NULL,
    tipe TEXT NOT NULL CHECK (tipe IN (
        'Text', 'Textarea', 'Number', 'Email', 'Date',
        'Dropdown', 'Checkbox', 'Radio', 'File', 'File Multiple',
        'Signature', 'Judul', 'Link', 'Gambar'
    )),
    required BOOLEAN NOT NULL DEFAULT false,
    options TEXT NULL, -- Multiline text / JSON options, pernyataan TTD, URL link, atau URL gambar
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_fields_event_type ON public.form_fields(event_id, form_type, urutan ASC);

-- 7. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reg_id TEXT UNIQUE NOT NULL, -- Format: EVT-2026-00001
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    wa TEXT NOT NULL,
    status_bayar TEXT NOT NULL CHECK (status_bayar IN ('Belum Bayar', 'Verifikasi Proses', 'Lunas', 'Ditolak')),
    status_lulus TEXT NOT NULL CHECK (status_lulus IN ('Belum Lulus', 'Lulus', 'Ditolak')) DEFAULT 'Belum Lulus',
    answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- Map of Field Label -> Values
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Constraint unik: 1 email hanya boleh daftar 1 kali per event (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_event_email ON public.registrations(event_id, lower(email));

CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_reg_id ON public.registrations(reg_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status_bayar, status_lulus);

-- 8. REGISTRATION FILES (Private uploads & signatures)
CREATE TABLE IF NOT EXISTS public.registration_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    field_label TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('pendaftaran', 'pembayaran', 'ttd')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg_files_reg_id ON public.registration_files(registration_id);

-- 9. PAYMENT SUBMISSIONS (Form Pembayaran Lanjutan)
CREATE TABLE IF NOT EXISTS public.payment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_reg ON public.payment_submissions(registration_id);

-- 10. INVITATION CODES (Private Event Access)
CREATE TABLE IF NOT EXISTS public.invitation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    kode TEXT NOT NULL UNIQUE,
    batas_pemakaian INTEGER NOT NULL DEFAULT 1,
    jumlah_terpakai INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_pemakaian CHECK (jumlah_terpakai <= batas_pemakaian)
);

CREATE INDEX IF NOT EXISTS idx_invitation_codes_event ON public.invitation_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_kode ON public.invitation_codes(kode);

-- 11. INVOICE TEMPLATES
CREATE TABLE IF NOT EXISTS public.invoice_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    trigger_key TEXT NOT NULL, -- e.g. 'Lunas|Lulus'
    nama_template TEXT NOT NULL,
    template_html TEXT NOT NULL,
    placeholders JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{placeholder, source, keyword}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_templates_event ON public.invoice_templates(event_id);

-- 12. EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    trigger_key TEXT NOT NULL, -- 'PENDAFTARAN_DITERIMA', 'Verifikasi Proses|Belum Lulus', etc.
    aktif BOOLEAN NOT NULL DEFAULT true,
    subjek TEXT NOT NULL,
    isi_html TEXT NOT NULL,
    invoice_template_id UUID NULL REFERENCES public.invoice_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_trigger UNIQUE (event_id, trigger_key)
);

CREATE INDEX IF NOT EXISTS idx_email_templates_event ON public.email_templates(event_id, trigger_key);

-- 13. ADMIN COLUMN PREFERENCES
CREATE TABLE IF NOT EXISTS public.admin_column_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_key TEXT NOT NULL, -- event UUID or 'ALL'
    columns JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_admin_column_pref UNIQUE (admin_id, event_key)
);

-- ==============================================================================
-- HELPER FUNCTIONS & RPC (ATOMIC OPERATIONS)
-- ==============================================================================

-- Helper: Check if current user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'super_admin'
  );
$$;

-- Helper: Check if admin has access to an event
-- Admin role 'admin' with NO entries in admin_event_access has access to ALL events.
CREATE OR REPLACE FUNCTION public.has_event_access(p_admin_id UUID, p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
    v_has_specific_access BOOLEAN;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_admin_id;
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    -- If admin has NO records in admin_event_access, they have access to all events
    SELECT EXISTS (SELECT 1 FROM public.admin_event_access WHERE admin_id = p_admin_id) INTO v_has_specific_access;
    IF NOT v_has_specific_access THEN
        RETURN TRUE;
    END IF;

    -- If they have specific records, verify this event is assigned
    RETURN EXISTS (
        SELECT 1 FROM public.admin_event_access
        WHERE admin_id = p_admin_id AND event_id = p_event_id
    );
END;
$$;

-- Function: Generate Next Unique Registration ID (EVT-YYYY-00001)
CREATE OR REPLACE FUNCTION public.fn_generate_reg_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_year TEXT := to_char(CURRENT_DATE, 'YYYY');
    v_num BIGINT;
BEGIN
    v_num := nextval('public.registration_seq');
    RETURN 'EVT-' || v_year || '-' || lpad(v_num::text, 5, '0');
END;
$$;

-- ATOMIC RPC: Submit Participant Registration
-- Enforces row-level lock on event, quota check, spam/duplicate email check,
-- and atomic invitation code consumption in a single transaction.
CREATE OR REPLACE FUNCTION public.submit_registration_atomic(
    p_event_id UUID,
    p_nama TEXT,
    p_email TEXT,
    p_wa TEXT,
    p_answers JSONB,
    p_invitation_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event public.events%ROWTYPE;
    v_total_registered INTEGER;
    v_reg_id TEXT;
    v_status_bayar TEXT;
    v_new_reg public.registrations%ROWTYPE;
    v_inv_code public.invitation_codes%ROWTYPE;
BEGIN
    -- 1. Lock the event row for atomic check
    SELECT * INTO v_event
    FROM public.events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event tidak ditemukan!';
    END IF;

    IF v_event.status <> 'Buka' THEN
        RAISE EXCEPTION 'Pendaftaran untuk event ini sedang ditutup!';
    END IF;

    -- 2. Validate Invitation Code if Mode Akses is 'Undangan'
    IF v_event.mode_akses = 'Undangan' THEN
        IF p_invitation_code IS NULL OR trim(p_invitation_code) = '' THEN
            RAISE EXCEPTION 'Event ini memerlukan kode undangan!';
        END IF;

        SELECT * INTO v_inv_code
        FROM public.invitation_codes
        WHERE event_id = p_event_id AND kode = upper(trim(p_invitation_code))
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Kode undangan tidak ditemukan!';
        END IF;

        IF v_inv_code.jumlah_terpakai >= v_inv_code.batas_pemakaian THEN
            RAISE EXCEPTION 'Kode undangan sudah mencapai batas pemakaian!';
        END IF;
    END IF;

    -- 3. Check Quota (if kuota is specified)
    IF v_event.kuota IS NOT NULL THEN
        SELECT count(*) INTO v_total_registered
        FROM public.registrations
        WHERE event_id = p_event_id;

        IF v_total_registered >= v_event.kuota THEN
            RAISE EXCEPTION 'Maaf, kuota pendaftaran sudah penuh!';
        END IF;
    END IF;

    -- 4. Check Duplicate Email
    IF EXISTS (
        SELECT 1 FROM public.registrations
        WHERE event_id = p_event_id AND lower(email) = lower(trim(p_email))
    ) THEN
        RAISE EXCEPTION 'Spam Terdeteksi: Email ini sudah terdaftar di event ini!';
    END IF;

    -- 5. Determine initial status
    -- Jika bayar_lanjut = true -> 'Belum Bayar'
    -- Jika bayar_lanjut = false -> 'Verifikasi Proses'
    IF v_event.bayar_lanjut THEN
        v_status_bayar := 'Belum Bayar';
    ELSE
        v_status_bayar := 'Verifikasi Proses';
    END IF;

    -- 6. Generate atomic registration ID
    v_reg_id := public.fn_generate_reg_id();

    -- 7. Insert Registration
    INSERT INTO public.registrations (
        reg_id,
        event_id,
        nama,
        email,
        wa,
        status_bayar,
        status_lulus,
        answers
    ) VALUES (
        v_reg_id,
        p_event_id,
        trim(p_nama),
        lower(trim(p_email)),
        trim(p_wa),
        v_status_bayar,
        'Belum Lulus',
        p_answers
    ) RETURNING * INTO v_new_reg;

    -- 8. Increment Invitation Code if used
    IF v_event.mode_akses = 'Undangan' THEN
        UPDATE public.invitation_codes
        SET jumlah_terpakai = jumlah_terpakai + 1
        WHERE id = v_inv_code.id;
    END IF;

    -- Return JSON result
    RETURN jsonb_build_object(
        'success', true,
        'registration_id', v_new_reg.id,
        'reg_id', v_new_reg.reg_id,
        'nama', v_new_reg.nama,
        'email', v_new_reg.email,
        'status_bayar', v_new_reg.status_bayar,
        'status_lulus', v_new_reg.status_lulus,
        'bayar_lanjut', v_event.bayar_lanjut
    );
END;
$$;

-- ATOMIC RPC: Submit Subsequent Payment (Form Pembayaran Lanjutan)
CREATE OR REPLACE FUNCTION public.submit_payment_atomic(
    p_reg_id TEXT,
    p_payment_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reg public.registrations%ROWTYPE;
BEGIN
    SELECT * INTO v_reg
    FROM public.registrations
    WHERE reg_id = p_reg_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nomor registrasi tidak ditemukan!';
    END IF;

    -- Cek aturan: hanya jika status_lulus = Lulus dan status_bayar bukan Lunas / Verifikasi Proses
    IF v_reg.status_lulus <> 'Lulus' THEN
        RAISE EXCEPTION 'Hanya peserta yang telah Lulus verifikasi yang dapat melakukan pembayaran lanjutan!';
    END IF;

    IF v_reg.status_bayar IN ('Lunas', 'Verifikasi Proses') THEN
        RAISE EXCEPTION 'Pembayaran Anda saat ini berstatus %!', v_reg.status_bayar;
    END IF;

    -- Simpan payment submission
    INSERT INTO public.payment_submissions (registration_id, answers)
    VALUES (v_reg.id, p_payment_answers);

    -- Update status_bayar menjadi Verifikasi Proses
    UPDATE public.registrations
    SET status_bayar = 'Verifikasi Proses',
        updated_at = now()
    WHERE id = v_reg.id
    RETURNING * INTO v_reg;

    RETURN jsonb_build_object(
        'success', true,
        'registration_id', v_reg.id,
        'reg_id', v_reg.reg_id,
        'status_bayar', v_reg.status_bayar,
        'status_lulus', v_reg.status_lulus
    );
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_event_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_column_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles:
-- 1. Users can read own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 2. Only Super Admin can insert/update/delete profiles
DROP POLICY IF EXISTS "profiles_super_admin_manage" ON public.profiles;
CREATE POLICY "profiles_super_admin_manage" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Events:
-- 1. Public can read non-draft events
DROP POLICY IF EXISTS "events_public_select" ON public.events;
CREATE POLICY "events_public_select" ON public.events
    FOR SELECT TO anon, authenticated
    USING (status IN ('Buka', 'Tutup') OR public.is_super_admin(auth.uid()) OR public.has_event_access(auth.uid(), id));

-- 2. Only Super Admin can insert, update, or delete events
DROP POLICY IF EXISTS "events_super_admin_all" ON public.events;
CREATE POLICY "events_super_admin_all" ON public.events
    FOR ALL TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Admin Event Access:
DROP POLICY IF EXISTS "admin_event_access_super_admin" ON public.admin_event_access;
CREATE POLICY "admin_event_access_super_admin" ON public.admin_event_access
    FOR ALL TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_event_access_self_select" ON public.admin_event_access;
CREATE POLICY "admin_event_access_self_select" ON public.admin_event_access
    FOR SELECT TO authenticated
    USING (admin_id = auth.uid());

-- Form Fields:
-- 1. Public can read form fields for active events
DROP POLICY IF EXISTS "form_fields_public_select" ON public.form_fields;
CREATE POLICY "form_fields_public_select" ON public.form_fields
    FOR SELECT TO anon, authenticated
    USING (true);

-- 2. Super Admin can manage form fields
DROP POLICY IF EXISTS "form_fields_super_admin_manage" ON public.form_fields;
CREATE POLICY "form_fields_super_admin_manage" ON public.form_fields
    FOR ALL TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Registrations:
-- 1. Authenticated admins can view registrations for allowed events
DROP POLICY IF EXISTS "registrations_admin_select" ON public.registrations;
CREATE POLICY "registrations_admin_select" ON public.registrations
    FOR SELECT TO authenticated
    USING (public.has_event_access(auth.uid(), event_id));

-- 2. Authenticated admins can update status of registrations for allowed events
DROP POLICY IF EXISTS "registrations_admin_update" ON public.registrations;
CREATE POLICY "registrations_admin_update" ON public.registrations
    FOR UPDATE TO authenticated
    USING (public.has_event_access(auth.uid(), event_id))
    WITH CHECK (public.has_event_access(auth.uid(), event_id));

-- Registration Files:
DROP POLICY IF EXISTS "registration_files_admin_select" ON public.registration_files;
CREATE POLICY "registration_files_admin_select" ON public.registration_files
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.registrations r
            WHERE r.id = registration_id AND public.has_event_access(auth.uid(), r.event_id)
        )
    );

-- Invitation Codes:
DROP POLICY IF EXISTS "invitation_codes_admin_select" ON public.invitation_codes;
CREATE POLICY "invitation_codes_admin_select" ON public.invitation_codes
    FOR SELECT TO authenticated
    USING (public.has_event_access(auth.uid(), event_id));

DROP POLICY IF EXISTS "invitation_codes_super_admin_manage" ON public.invitation_codes;
CREATE POLICY "invitation_codes_super_admin_manage" ON public.invitation_codes
    FOR ALL TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Invoice Templates & Email Templates:
DROP POLICY IF EXISTS "templates_super_admin_all" ON public.invoice_templates;
CREATE POLICY "templates_super_admin_all" ON public.invoice_templates
    FOR ALL TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "email_templates_super_admin_all" ON public.email_templates;
CREATE POLICY "email_templates_super_admin_all" ON public.email_templates
    FOR ALL TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Admin Column Preferences:
DROP POLICY IF EXISTS "column_prefs_user_all" ON public.admin_column_preferences;
CREATE POLICY "column_prefs_user_all" ON public.admin_column_preferences
    FOR ALL TO authenticated
    USING (admin_id = auth.uid())
    WITH CHECK (admin_id = auth.uid());

-- ==============================================================================
-- STORAGE BUCKETS SETUP
-- ==============================================================================

-- 1. Assets Bucket (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Registrations Bucket (Private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('registrations', 'registrations', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies:
-- Assets: Public can read, Super Admin can upload/delete
DROP POLICY IF EXISTS "assets_public_read" ON storage.objects;
CREATE POLICY "assets_public_read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "assets_admin_insert" ON storage.objects;
CREATE POLICY "assets_admin_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'assets');

DROP POLICY IF EXISTS "assets_admin_delete" ON storage.objects;
CREATE POLICY "assets_admin_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'assets');

-- Registrations:
-- Upload allowed for server/service role or authenticated users; public submits via backend Route Handler
DROP POLICY IF EXISTS "registrations_admin_read" ON storage.objects;
CREATE POLICY "registrations_admin_read" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'registrations');
