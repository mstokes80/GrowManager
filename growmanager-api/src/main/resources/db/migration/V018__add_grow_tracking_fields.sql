-- Add canopy size, stage tracking dates, lights, and temperature unit fields to grows table

-- Add canopy square footage for yield per square foot calculations
ALTER TABLE grows ADD COLUMN canopy_square_ft DECIMAL(8, 2);

-- Add stage transition tracking dates
ALTER TABLE grows ADD COLUMN vegetative_date DATE;
ALTER TABLE grows ADD COLUMN flower_date DATE;

-- Add lights array for tracking light equipment
ALTER TABLE grows ADD COLUMN lights JSONB;

-- Add temperature unit of measurement (C or F)
ALTER TABLE grows ADD COLUMN temp_uom VARCHAR(1);

-- Add comments for documentation
COMMENT ON COLUMN grows.canopy_square_ft IS 'Canopy area in square feet for yield density calculations';
COMMENT ON COLUMN grows.vegetative_date IS 'Date when grow transitioned to vegetative stage';
COMMENT ON COLUMN grows.flower_date IS 'Date when grow transitioned to flowering stage';
COMMENT ON COLUMN grows.lights IS 'Array of light equipment descriptions used in this grow';
COMMENT ON COLUMN grows.temp_uom IS 'Temperature unit of measurement: C for Celsius, F for Fahrenheit';