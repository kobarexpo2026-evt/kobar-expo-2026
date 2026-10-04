-- ==============================================================================
-- KOBAR EXPO 2026 - SEED SCRIPT (CLEAN DATABASE - SUPER ADMIN ONLY)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Helper Function to Seed Initial Super Admin (ananda.poji@gmail.com)
DO $$
DECLARE
    v_admin_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    v_email TEXT := 'ananda.poji@gmail.com';
    v_password TEXT := 'KobarExpo2026SuperAdmin!';
    v_nama TEXT := 'Ananda Poji (Super Admin)';
    v_encrypted_pw TEXT;
BEGIN
    -- Check if user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        v_encrypted_pw := crypt(v_password, gen_salt('bf'));

        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_admin_id,
            'authenticated',
            'authenticated',
            v_email,
            v_encrypted_pw,
            now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('nama', v_nama),
            now(),
            now()
        );

        INSERT INTO public.profiles (
            id,
            nama,
            email,
            role,
            created_at
        ) VALUES (
            v_admin_id,
            v_nama,
            v_email,
            'super_admin',
            now()
        ) ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
    ELSE
        -- Ensure role is super_admin in public.profiles
        UPDATE public.profiles
        SET role = 'super_admin'
        WHERE email = v_email;
    END IF;
END $$;

-- Database is clean and ready. No sample events or sample registrations.
