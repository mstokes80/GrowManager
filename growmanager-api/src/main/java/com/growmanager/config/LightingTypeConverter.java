package com.growmanager.config;

import com.growmanager.entity.Grow.LightingType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for LightingType enum.
 * Converts between LightingType enum and lowercase string values for database storage.
 */
@Converter(autoApply = true)
public class LightingTypeConverter implements AttributeConverter<LightingType, String> {

    @Override
    public String convertToDatabaseColumn(LightingType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public LightingType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }

        for (LightingType type : LightingType.values()) {
            if (type.getValue().equals(dbData)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unknown lighting_type value: " + dbData);
    }
}