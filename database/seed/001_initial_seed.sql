-- Seed Wilaya de Sétif
INSERT INTO wilayas (id, code, name_fr, name_ar, name_en)
VALUES ('00000000-0000-0000-0000-000000000019', 19, 'Sétif', 'سطيف', 'Setif')
ON CONFLICT (code) DO NOTHING;

-- Seed Communes for Sétif
INSERT INTO communes (id, wilaya_id, name_fr, name_ar, name_en)
VALUES 
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000019', 'Sétif', 'سطيف', 'Setif'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000019', 'El Eulma', 'العلمة', 'El Eulma'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000019', 'Ain Arnat', 'عين أرنات', 'Ain Arnat'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000019', 'Ain Oulmene', 'عين ولمان', 'Ain Oulmene'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000019', 'Bougaa', 'بوقاعة', 'Bougaa')
ON CONFLICT (wilaya_id, name_fr) DO NOTHING;

-- Roles
INSERT INTO roles (id, name) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'CITIZEN'),
    ('00000000-0000-0000-0000-000000000002', 'GUARD'),
    ('00000000-0000-0000-0000-000000000003', 'ADMIN'),
    ('00000000-0000-0000-0000-000000000004', 'SUPER_ADMIN')
ON CONFLICT (name) DO NOTHING;

-- Permissions
INSERT INTO permissions (name) VALUES 
    ('CREATE_RESERVATION'),
    ('VIEW_RESERVATIONS'),
    ('CANCEL_RESERVATION'),
    ('CHECK_IN_RESERVATION'),
    ('MANAGE_STADIUMS'),
    ('MANAGE_FIELDS'),
    ('MANAGE_USERS'),
    ('VIEW_REPORTS'),
    ('MANAGE_SEASONS'),
    ('MANAGE_PRICING')
ON CONFLICT (name) DO NOTHING;

-- Role Permissions Mapping
DO $$
DECLARE
    role_citizen UUID := '00000000-0000-0000-0000-000000000001';
    role_guard UUID := '00000000-0000-0000-0000-000000000002';
    role_admin UUID := '00000000-0000-0000-0000-000000000003';
    role_super_admin UUID := '00000000-0000-0000-0000-000000000004';
BEGIN
    -- CITIZEN
    INSERT INTO role_permissions (role_id, permission_id) 
    SELECT role_citizen, id FROM permissions WHERE name IN ('CREATE_RESERVATION', 'VIEW_RESERVATIONS', 'CANCEL_RESERVATION')
    ON CONFLICT DO NOTHING;
    
    -- GUARD
    INSERT INTO role_permissions (role_id, permission_id) 
    SELECT role_guard, id FROM permissions WHERE name IN ('VIEW_RESERVATIONS', 'CHECK_IN_RESERVATION')
    ON CONFLICT DO NOTHING;
    
    -- ADMIN
    INSERT INTO role_permissions (role_id, permission_id) 
    SELECT role_admin, id FROM permissions WHERE name IN ('CREATE_RESERVATION', 'VIEW_RESERVATIONS', 'CANCEL_RESERVATION', 'CHECK_IN_RESERVATION', 'MANAGE_STADIUMS', 'MANAGE_FIELDS', 'VIEW_REPORTS')
    ON CONFLICT DO NOTHING;

    -- SUPER_ADMIN
    INSERT INTO role_permissions (role_id, permission_id) 
    SELECT role_super_admin, id FROM permissions
    ON CONFLICT DO NOTHING;
END $$;

-- Default Season
INSERT INTO seasons (name, starts_on, ends_on, status)
VALUES ('Saison 2024-2025', '2024-09-01', '2025-08-31', 'ACTIVE');
