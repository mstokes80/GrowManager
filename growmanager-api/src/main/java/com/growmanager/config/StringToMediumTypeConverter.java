package com.growmanager.config;

import com.growmanager.entity.Grow.MediumType;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Spring Converter to convert String to MediumType for form data binding.
 * This is used when binding multipart/form-data requests with @ModelAttribute.
 * Handles both enum names (SOIL) and database values (soil).
 */
@Component
public class StringToMediumTypeConverter implements Converter<String, MediumType> {

    @Override
    public MediumType convert(String source) {
        if (source == null || source.trim().isEmpty()) {
            return null;
        }

        // Try to match by lowercase value first (from frontend: "soil")
        for (MediumType type : MediumType.values()) {
            if (type.getValue().equalsIgnoreCase(source)) {
                return type;
            }
        }

        // Try standard enum conversion (handles "SOIL", "COCO", etc.)
        try {
            return MediumType.valueOf(source.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid medium type: " + source);
        }
    }
}