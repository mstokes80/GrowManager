-- ============================================================================
-- ANALYTICS TEST DATA GENERATOR
-- ============================================================================
-- This script generates comprehensive test data for analytics testing
-- Includes: activity logs, feeding events, and harvest records
--
-- Usage: Run this script manually against your test database
-- Note: This will use the first user and first active grow found
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_grow_id UUID;
    v_plant_ids UUID[];
    v_plant_id UUID;
    v_cultivar_id UUID;
    v_start_date DATE;
    v_day_offset INTEGER;
BEGIN
    -- ========================================================================
    -- STEP 1: Get existing user, grow, and plant IDs
    -- ========================================================================

    -- Get the first user (for testing purposes)
    SELECT id INTO v_user_id FROM users ORDER BY created_at LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found. Please create a user first.';
    END IF;

    RAISE NOTICE 'Using user ID: %', v_user_id;

    -- Get the first active grow for this user
    SELECT id, start_date INTO v_grow_id, v_start_date
    FROM grows
    WHERE user_id = v_user_id
    AND status IN ('active', 'flowering', 'drying')
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_grow_id IS NULL THEN
        RAISE EXCEPTION 'No active grows found for user. Please create a grow first.';
    END IF;

    RAISE NOTICE 'Using grow ID: %, Start date: %', v_grow_id, v_start_date;

    -- Get all plants for this grow
    SELECT ARRAY_AGG(id) INTO v_plant_ids
    FROM plants
    WHERE grow_id = v_grow_id;

    IF v_plant_ids IS NULL OR array_length(v_plant_ids, 1) = 0 THEN
        RAISE EXCEPTION 'No plants found for grow. Please create plants first.';
    END IF;

    RAISE NOTICE 'Found % plants', array_length(v_plant_ids, 1);

    -- ========================================================================
    -- STEP 2: Generate Activity Logs (10 per plant)
    -- ========================================================================

    RAISE NOTICE 'Generating activity logs...';

    FOREACH v_plant_id IN ARRAY v_plant_ids LOOP

        -- Week 1: Transplanting (vegetative start)
        INSERT INTO activity_logs (plant_id, user_id, activity_type, description, notes, logged_at)
        VALUES (
            v_plant_id, v_user_id, 'transplant',
            'Transplanted seedling to 1-gallon pot',
            'Used organic potting mix with perlite',
            v_start_date + 0
        );

        -- Week 2: First training
        INSERT INTO activity_logs (plant_id, user_id, activity_type, description, notes, logged_at)
        VALUES (
            v_plant_id, v_user_id, 'training',
            'LST - Low stress training initiated',
            'Gently bent main stem to create horizontal growth',
            v_start_date + 7
        );

        -- Week 3: Defoliation
        INSERT INTO activity_logs (plant_id, user_id, activity_type, description, notes, logged_at)
        VALUES (
            v_plant_id, v_user_id, 'defoliation',
            'Removed lower fan leaves',
            'Improved air circulation and light penetration',
            v_start_date + 14
        );

        -- Week 4: More training
        INSERT INTO activity_logs (plant_id, user_id, activity_type, description, notes, logged_at)
        VALUES (
            v_plant_id, v_user_id, 'training',
            'Continued LST adjustments',
            'Spread out branches for even canopy',
            v_start_date + 21
        );

        -- Week 5: Transplant to larger pot
        INSERT INTO activity_logs (plant_id, user_id, activity_type, description, notes, logged_at)
        VALUES (
            v_plant_id, v_user_id, 'transplant',
            'Transplanted to 3-gallon fabric pot',
            'Root system was well developed',
            v_start_date + 28
        );

        -- Week 6: Pruning
        INSERT INTO activity_logs (plant_id, user_id, activity_type, description, notes, logged_at)
        VALUES (
            v_plant_id, v_user_id, 'pruning',
            'Topped plant at 4th node',
            'Creating 8 main colas',
            v_start_date + 35
        );

        -- Week 8: Pest control (preventative)
        INSERT INTO activity_logs (plant_id, user_id, activity_type, description, notes, logged_at)
        VALUES (
            v_plant_id, v_user_id, 'pest_control',
            'Applied neem oil spray',
            'Preventative measure for spider mites',
            v_start_date + 49
        );

        -- Week 9: Final transplant (flowering preparation)
        INSERT INTO activity_logs (plant_id, user_id, activity_type, description, notes, logged_at)
        VALUES (
            v_plant_id, v_user_id, 'transplant',
            'Transplanted to final 5-gallon pot',
            'Ready for flower stage',
            v_start_date + 56
        );

        -- Week 10: Defoliation before flower
        INSERT INTO activity_logs (plant_id, user_id, activity_type, description, notes, logged_at)
        VALUES (
            v_plant_id, v_user_id, 'defoliation',
            'Pre-flower defoliation',
            'Removed lower branches and fan leaves',
            v_start_date + 63
        );

        -- Week 13: Mid-flower defoliation
        INSERT INTO activity_logs (plant_id, user_id, activity_type, description, notes, logged_at)
        VALUES (
            v_plant_id, v_user_id, 'defoliation',
            'Removed yellowing fan leaves',
            'Improved bud site exposure',
            v_start_date + 84
        );

    END LOOP;

    RAISE NOTICE 'Activity logs generated: % activities per plant', 10;

    -- ========================================================================
    -- STEP 3: Generate Feeding Events (~200 per plant)
    -- ========================================================================

    RAISE NOTICE 'Generating feeding events...';

    FOREACH v_plant_id IN ARRAY v_plant_ids LOOP

        -- Early vegetative (weeks 1-4): Light feeding every 2-3 days
        FOR v_day_offset IN 1..28 LOOP
            IF v_day_offset % 2 = 0 THEN
                -- Watering
                INSERT INTO feeding_events (plant_id, user_id, feeding_type, amount_ml, ph_level, notes, fed_at)
                VALUES (
                    v_plant_id, v_user_id, 'watering',
                    500 + (random() * 200)::int,
                    6.0 + (random() * 0.5),
                    'Plain pH adjusted water',
                    v_start_date + v_day_offset
                );
            END IF;

            IF v_day_offset % 4 = 0 THEN
                -- Nutrient feeding
                INSERT INTO feeding_events (plant_id, user_id, feeding_type, amount_ml, ec_level, ph_level, nutrient_mix, notes, fed_at)
                VALUES (
                    v_plant_id, v_user_id, 'nutrients',
                    500 + (random() * 200)::int,
                    0.8 + (random() * 0.4),
                    5.8 + (random() * 0.6),
                    '["Grow A", "Grow B", "CalMag"]',
                    'Light vegetative feeding',
                    v_start_date + v_day_offset
                );
            END IF;
        END LOOP;

        -- Late vegetative (weeks 5-8): Increased feeding
        FOR v_day_offset IN 29..56 LOOP
            IF v_day_offset % 2 = 0 THEN
                -- Watering
                INSERT INTO feeding_events (plant_id, user_id, feeding_type, amount_ml, ph_level, notes, fed_at)
                VALUES (
                    v_plant_id, v_user_id, 'watering',
                    800 + (random() * 300)::int,
                    6.0 + (random() * 0.5),
                    'Plain pH adjusted water',
                    v_start_date + v_day_offset
                );
            END IF;

            IF v_day_offset % 3 = 0 THEN
                -- Nutrient feeding
                INSERT INTO feeding_events (plant_id, user_id, feeding_type, amount_ml, ec_level, ph_level, nutrient_mix, notes, fed_at)
                VALUES (
                    v_plant_id, v_user_id, 'nutrients',
                    800 + (random() * 300)::int,
                    1.2 + (random() * 0.6),
                    5.8 + (random() * 0.6),
                    '["Grow A", "Grow B", "CalMag", "Silica"]',
                    'Full strength vegetative nutrients',
                    v_start_date + v_day_offset
                );
            END IF;

            -- Occasional foliar spray
            IF v_day_offset % 7 = 0 THEN
                INSERT INTO feeding_events (plant_id, user_id, feeding_type, amount_ml, ph_level, nutrient_mix, notes, fed_at)
                VALUES (
                    v_plant_id, v_user_id, 'foliar',
                    100 + (random() * 50)::int,
                    6.0 + (random() * 0.3),
                    '["Kelp Extract"]',
                    'Foliar spray for micronutrients',
                    v_start_date + v_day_offset
                );
            END IF;
        END LOOP;

        -- Flowering (weeks 9-17): Bloom nutrients
        FOR v_day_offset IN 57..119 LOOP
            IF v_day_offset % 2 = 0 THEN
                -- Watering
                INSERT INTO feeding_events (plant_id, user_id, feeding_type, amount_ml, ph_level, notes, fed_at)
                VALUES (
                    v_plant_id, v_user_id, 'watering',
                    1000 + (random() * 400)::int,
                    6.0 + (random() * 0.5),
                    'Plain pH adjusted water',
                    v_start_date + v_day_offset
                );
            END IF;

            IF v_day_offset % 3 = 0 THEN
                -- Bloom nutrient feeding
                INSERT INTO feeding_events (plant_id, user_id, feeding_type, amount_ml, ec_level, ph_level, nutrient_mix, notes, fed_at)
                VALUES (
                    v_plant_id, v_user_id, 'nutrients',
                    1000 + (random() * 400)::int,
                    1.6 + (random() * 0.8),
                    5.8 + (random() * 0.6),
                    '["Bloom A", "Bloom B", "PK Booster", "CalMag"]',
                    'Flowering nutrients',
                    v_start_date + v_day_offset
                );
            END IF;
        END LOOP;

        -- Final flush (last week)
        FOR v_day_offset IN 120..126 LOOP
            IF v_day_offset % 2 = 0 THEN
                INSERT INTO feeding_events (plant_id, user_id, feeding_type, amount_ml, ec_level, ph_level, notes, fed_at)
                VALUES (
                    v_plant_id, v_user_id, 'watering',
                    1500 + (random() * 500)::int,
                    0.1,
                    6.5 + (random() * 0.3),
                    'Final flush with plain water',
                    v_start_date + v_day_offset
                );
            END IF;
        END LOOP;

    END LOOP;

    RAISE NOTICE 'Feeding events generated: ~200 events per plant';

    -- ========================================================================
    -- STEP 4: Generate Harvest Records (1 per plant)
    -- ========================================================================

    RAISE NOTICE 'Generating harvest records...';

    FOREACH v_plant_id IN ARRAY v_plant_ids LOOP

        -- Harvest at day 126 (18 weeks)
        INSERT INTO harvests (
            plant_id,
            grow_id,
            harvest_date,
            wet_weight,
            dry_weight,
            weight_unit,
            thc_percent,
            cbd_percent,
            terpene_profile,
            quality_rating,
            notes
        ) VALUES (
            v_plant_id,
            v_grow_id,
            v_start_date + 126,
            200 + (random() * 300)::numeric(8,2),  -- Wet weight: 200-500g
            50 + (random() * 100)::numeric(8,2),    -- Dry weight: 50-150g
            'GRAMS',
            15.0 + (random() * 10)::numeric(4,2),   -- THC: 15-25%
            0.5 + (random() * 2)::numeric(4,2),     -- CBD: 0.5-2.5%
            jsonb_build_object(
                'limonene', (random() * 2)::numeric(4,2),
                'myrcene', (random() * 3)::numeric(4,2),
                'caryophyllene', (random() * 2)::numeric(4,2),
                'pinene', (random() * 1.5)::numeric(4,2)
            ),
            7 + (random() * 3)::int,  -- Quality rating: 7-10
            'Excellent harvest. Dense, frosty buds with strong aroma.'
        );

    END LOOP;

    RAISE NOTICE 'Harvest records generated: 1 per plant';

    -- ========================================================================
    -- Summary
    -- ========================================================================

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST DATA GENERATION COMPLETE!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Grow ID: %', v_grow_id;
    RAISE NOTICE 'Number of Plants: %', array_length(v_plant_ids, 1);
    RAISE NOTICE '';
    RAISE NOTICE 'Generated per plant:';
    RAISE NOTICE '  - Activity logs: 10';
    RAISE NOTICE '  - Feeding events: ~200';
    RAISE NOTICE '  - Harvests: 1';
    RAISE NOTICE '==========================================';

END $$;