-- ==============================================================================
-- KOBAR EXPO 2026 - TAHAP 6: TEMPLATE EMAIL & INVOICE PDF
-- ==============================================================================

-- 1. Helper function to upsert email template
CREATE OR REPLACE FUNCTION public.save_email_template(
    p_event_id UUID,
    p_trigger_key TEXT,
    p_aktif BOOLEAN,
    p_subjek TEXT,
    p_isi_html TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_super_admin(auth.uid()) AND NOT public.has_event_access(auth.uid(), p_event_id) THEN
        RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki wewenang untuk mengatur template event ini.';
    END IF;

    INSERT INTO public.email_templates (
        event_id,
        trigger_key,
        aktif,
        subjek,
        isi_html,
        updated_at
    ) VALUES (
        p_event_id,
        p_trigger_key,
        p_aktif,
        p_subjek,
        p_isi_html,
        now()
    )
    ON CONFLICT (event_id, trigger_key)
    DO UPDATE SET
        aktif = EXCLUDED.aktif,
        subjek = EXCLUDED.subjek,
        isi_html = EXCLUDED.isi_html,
        updated_at = now();

    RETURN jsonb_build_object('success', true);
END;
$$;
