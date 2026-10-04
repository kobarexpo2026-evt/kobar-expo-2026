-- ==============================================================================
-- KOBAR EXPO 2026 - TAHAP 3: RPC FORM BUILDER DINAMIS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.save_form_fields_atomic(
    p_event_id UUID,
    p_form_type TEXT,
    p_fields JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
    v_count INTEGER := 0;
    v_urutan INTEGER := 1;
    v_label TEXT;
BEGIN
    -- Check permissions: Super Admin or Admin with access to this event
    IF NOT public.is_super_admin(auth.uid()) AND NOT public.has_event_access(auth.uid(), p_event_id) THEN
        RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki wewenang untuk mengatur form event ini.';
    END IF;

    -- Delete existing fields for this event & form_type
    DELETE FROM public.form_fields
    WHERE event_id = p_event_id AND form_type = p_form_type;

    -- Insert new fields in order
    FOR item IN SELECT * FROM jsonb_array_elements(p_fields)
    LOOP
        v_label := trim(item->>'label');
        
        -- Lewati baris tanpa label
        IF v_label IS NOT NULL AND v_label <> '' THEN
            INSERT INTO public.form_fields (
                event_id,
                form_type,
                urutan,
                label,
                tipe,
                required,
                options
            ) VALUES (
                p_event_id,
                p_form_type,
                v_urutan,
                v_label,
                item->>'tipe',
                COALESCE((item->>'required')::BOOLEAN, false),
                item->>'options'
            );

            v_urutan := v_urutan + 1;
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'event_id', p_event_id,
        'form_type', p_form_type,
        'count', v_count
    );
END;
$$;
