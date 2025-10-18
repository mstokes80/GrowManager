package com.growmanager.config;

import com.growmanager.entity.Observation.ObservationType;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Spring Converter to convert String to ObservationType for form data binding.
 * This is used when binding multipart/form-data requests with @ModelAttribute.
 * Handles both enum names (HEALTH_CHECK) and database values (health_check).
 */
@Component
public class StringToObservationTypeConverter implements Converter<String, ObservationType> {

    @Override
    public ObservationType convert(String source) {
        if (source == null || source.trim().isEmpty()) {
            return null;
        }

        // Try to match by lowercase value first (from frontend: "progress")
        for (ObservationType type : ObservationType.values()) {
            if (type.getValue().equalsIgnoreCase(source)) {
                return type;
            }
        }

        // Try standard enum conversion (handles "PROGRESS", "HEALTH_CHECK", etc.)
        try {
            return ObservationType.valueOf(source.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid observation type: " + source);
        }
    }
}