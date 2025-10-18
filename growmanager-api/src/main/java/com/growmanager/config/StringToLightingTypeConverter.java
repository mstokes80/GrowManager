package com.growmanager.config;

import com.growmanager.entity.Grow.LightingType;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Spring Converter to convert String to LightingType for form data binding.
 * This is used when binding multipart/form-data requests with @ModelAttribute.
 * Handles both enum names (LED) and database values (led).
 */
@Component
public class StringToLightingTypeConverter implements Converter<String, LightingType> {

    @Override
    public LightingType convert(String source) {
        if (source == null || source.trim().isEmpty()) {
            return null;
        }

        // Try to match by lowercase value first (from frontend: "led")
        for (LightingType type : LightingType.values()) {
            if (type.getValue().equalsIgnoreCase(source)) {
                return type;
            }
        }

        // Try standard enum conversion (handles "LED", "HPS", etc.)
        try {
            return LightingType.valueOf(source.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid lighting type: " + source);
        }
    }
}