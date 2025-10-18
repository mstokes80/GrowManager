package com.growmanager.config;

import com.growmanager.entity.Harvest.WeightUnit;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Spring Converter to convert String to WeightUnit for form data binding.
 * This is used when binding multipart/form-data requests with @ModelAttribute.
 * Handles both enum names (GRAMS) and database values (grams).
 */
@Component
public class StringToWeightUnitConverter implements Converter<String, WeightUnit> {

    @Override
    public WeightUnit convert(String source) {
        if (source == null || source.trim().isEmpty()) {
            return null;
        }

        // Try to match by lowercase value first (from frontend: "grams")
        for (WeightUnit unit : WeightUnit.values()) {
            if (unit.getValue().equalsIgnoreCase(source)) {
                return unit;
            }
        }

        // Try standard enum conversion (handles "GRAMS", "OUNCES", etc.)
        try {
            return WeightUnit.valueOf(source.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid weight unit: " + source);
        }
    }
}