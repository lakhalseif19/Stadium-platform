-- Test coverage_conflict exclusions
BEGIN;

-- Setup test data
INSERT INTO wilayas (id, code, name_fr, name_ar, name_en) VALUES ('99999999-9999-9999-9999-999999999999', 99, 'Test', 'Test', 'Test') ON CONFLICT DO NOTHING;
INSERT INTO communes (id, wilaya_id, name_fr, name_ar, name_en) VALUES ('99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'Test', 'Test', 'Test') ON CONFLICT DO NOTHING;
INSERT INTO stadiums (id, commune_id, name_ar, name_fr, name_en) VALUES ('99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'Test', 'Test', 'Test');
INSERT INTO fields (id, stadium_id, booking_mode) VALUES ('99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'FULL_AND_HALF');

DO $$
DECLARE
    test_field_id UUID := '99999999-9999-9999-9999-999999999999';
    start_time TIMESTAMPTZ := '2025-01-01 10:00:00+01';
    end_time TIMESTAMPTZ := '2025-01-01 11:00:00+01';
    diff_start_time TIMESTAMPTZ := '2025-01-01 11:00:00+01';
    diff_end_time TIMESTAMPTZ := '2025-01-01 12:00:00+01';
BEGIN
    -- Test 1: FULL + FULL = Forbidden
    INSERT INTO reservations (field_id, type, coverage, starts_at, ends_at, status) 
    VALUES (test_field_id, 'SINGLE', 'FULL', start_time, end_time, 'CONFIRMED');
    
    BEGIN
        INSERT INTO reservations (field_id, type, coverage, starts_at, ends_at, status) 
        VALUES (test_field_id, 'SINGLE', 'FULL', start_time, end_time, 'CONFIRMED');
        RAISE EXCEPTION 'Test 1 Failed: Should not allow FULL + FULL';
    EXCEPTION WHEN exclusion_violation THEN
        -- Expected
    END;
    
    -- Cleanup
    DELETE FROM reservations WHERE field_id = test_field_id;
    
    -- Test 2: FULL + HALF_A = Forbidden
    INSERT INTO reservations (field_id, type, coverage, starts_at, ends_at, status) 
    VALUES (test_field_id, 'SINGLE', 'FULL', start_time, end_time, 'CONFIRMED');
    
    BEGIN
        INSERT INTO reservations (field_id, type, coverage, starts_at, ends_at, status) 
        VALUES (test_field_id, 'SINGLE', 'HALF_A', start_time, end_time, 'CONFIRMED');
        RAISE EXCEPTION 'Test 2 Failed: Should not allow FULL + HALF_A';
    EXCEPTION WHEN exclusion_violation THEN
        -- Expected
    END;
    
    -- Cleanup
    DELETE FROM reservations WHERE field_id = test_field_id;
    
    -- Test 3: HALF_A + HALF_B = Allowed
    INSERT INTO reservations (field_id, type, coverage, starts_at, ends_at, status) 
    VALUES (test_field_id, 'SINGLE', 'HALF_A', start_time, end_time, 'CONFIRMED');
    
    -- This should succeed
    INSERT INTO reservations (field_id, type, coverage, starts_at, ends_at, status) 
    VALUES (test_field_id, 'SINGLE', 'HALF_B', start_time, end_time, 'CONFIRMED');
    
    -- Cleanup
    DELETE FROM reservations WHERE field_id = test_field_id;
    
    -- Test 4: HALF_A + HALF_A = Forbidden
    INSERT INTO reservations (field_id, type, coverage, starts_at, ends_at, status) 
    VALUES (test_field_id, 'SINGLE', 'HALF_A', start_time, end_time, 'CONFIRMED');
    
    BEGIN
        INSERT INTO reservations (field_id, type, coverage, starts_at, ends_at, status) 
        VALUES (test_field_id, 'SINGLE', 'HALF_A', start_time, end_time, 'CONFIRMED');
        RAISE EXCEPTION 'Test 4 Failed: Should not allow HALF_A + HALF_A';
    EXCEPTION WHEN exclusion_violation THEN
        -- Expected
    END;
    
    -- Cleanup
    DELETE FROM reservations WHERE field_id = test_field_id;
    
    -- Test 5: Ignore CANCELLED
    INSERT INTO reservations (field_id, type, coverage, starts_at, ends_at, status) 
    VALUES (test_field_id, 'SINGLE', 'FULL', start_time, end_time, 'CANCELLED');
    
    -- This should succeed because the first one is CANCELLED
    INSERT INTO reservations (field_id, type, coverage, starts_at, ends_at, status) 
    VALUES (test_field_id, 'SINGLE', 'FULL', start_time, end_time, 'CONFIRMED');
    
    RAISE NOTICE 'All tests passed successfully!';
END $$;

ROLLBACK;
