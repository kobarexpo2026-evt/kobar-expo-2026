-- ==============================================================================
-- KOBAR EXPO 2026 - TAHAP 5: RPC TINDAKAN MASSAL REGISTRASI
-- ==============================================================================

-- 1. RPC: Bulk Update Status Pendaftaran
CREATE OR REPLACE FUNCTION public.bulk_update_registrations_status(
    p_ids UUID[],
    p_status_bayar TEXT DEFAULT NULL,
    p_status_lulus TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INTEGER := 0;
BEGIN
    -- Check permissions: must be authenticated admin
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Autentikasi diperlukan.';
    END IF;

    -- Update records where user has access
    UPDATE public.registrations
    SET 
        status_bayar = COALESCE(p_status_bayar, status_bayar),
        status_lulus = COALESCE(p_status_lulus, status_lulus),
        updated_at = now()
    WHERE id = ANY(p_ids)
      AND (public.is_super_admin(auth.uid()) OR public.has_event_access(auth.uid(), event_id));

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'count', v_updated_count
    );
END;
$$;

-- 2. RPC: Bulk Delete Registrations (Super Admin only)
CREATE OR REPLACE FUNCTION public.bulk_delete_registrations(p_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
BEGIN
    IF NOT public.is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang dapat menghapus data pendaftar.';
    END IF;

    DELETE FROM public.registrations
    WHERE id = ANY(p_ids);

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'count', v_deleted_count
    );
END;
$$;
