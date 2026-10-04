-- ==============================================================================
-- KOBAR EXPO 2026 - TAHAP 2: RPC UNTUK EVENT, KODE UNDANGAN & KELOLA ADMIN
-- ==============================================================================

-- 1. RPC: Reorder Events (Update urutan sekaligus secara atomik)
CREATE OR REPLACE FUNCTION public.reorder_events(p_orders JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
BEGIN
    -- Only Super Admin can reorder events
    IF NOT public.is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang dapat mengubah urutan event.';
    END IF;

    FOR item IN SELECT * FROM jsonb_array_elements(p_orders)
    LOOP
        UPDATE public.events
        SET urutan = (item->>'urutan')::INTEGER,
            updated_at = now()
        WHERE id = (item->>'id')::UUID;
    END LOOP;

    RETURN TRUE;
END;
$$;

-- 2. RPC: Bulk Generate Invitation Codes (Karakter tanpa 0, O, 1, I)
CREATE OR REPLACE FUNCTION public.generate_invitation_codes_bulk(
    p_event_id UUID,
    p_count INTEGER,
    p_limit INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_charset TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_charset_len INTEGER := length(v_charset);
    v_generated_count INTEGER := 0;
    v_random_code TEXT;
    v_attempts INTEGER := 0;
    v_max_attempts INTEGER := p_count * 10;
BEGIN
    IF NOT public.is_super_admin(auth.uid()) AND NOT public.has_event_access(auth.uid(), p_event_id) THEN
        RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki wewenang untuk event ini.';
    END IF;

    IF p_count > 1000 THEN
        RAISE EXCEPTION 'Maksimal pembuatan kode sekaligus adalah 1000 kode.';
    END IF;

    WHILE v_generated_count < p_count AND v_attempts < v_max_attempts LOOP
        v_attempts := v_attempts + 1;
        
        -- Generate 8 random characters
        v_random_code := '';
        FOR i IN 1..8 LOOP
            v_random_code := v_random_code || substr(v_charset, floor(random() * v_charset_len + 1)::integer, 1);
        END LOOP;

        -- Insert if unique across all events
        BEGIN
            INSERT INTO public.invitation_codes (event_id, kode, batas_pemakaian, jumlah_terpakai)
            VALUES (p_event_id, v_random_code, p_limit, 0);
            
            v_generated_count := v_generated_count + 1;
        EXCEPTION WHEN unique_violation THEN
            -- Retry on duplicate code
            NULL;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'count', v_generated_count,
        'event_id', p_event_id
    );
END;
$$;

-- 3. RPC: Super Admin Upsert Admin Profile & Event Access
CREATE OR REPLACE FUNCTION public.save_admin_user(
    p_admin_id UUID,
    p_nama TEXT,
    p_email TEXT,
    p_role TEXT,
    p_event_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang dapat mengelola akun admin.';
    END IF;

    -- Update or insert profile
    UPDATE public.profiles
    SET nama = trim(p_nama),
        role = p_role,
        updated_at = now()
    WHERE id = p_admin_id;

    -- Sync event access
    DELETE FROM public.admin_event_access
    WHERE admin_id = p_admin_id;

    IF p_role = 'admin' AND array_length(p_event_ids, 1) > 0 THEN
        INSERT INTO public.admin_event_access (admin_id, event_id)
        SELECT p_admin_id, unnest(p_event_ids);
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;
