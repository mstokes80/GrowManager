package com.growmanager.config;

import com.growmanager.entity.Grow.MediumType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for MediumType enum.
 * Converts between MediumType enum and lowercase string values for database storage.
 */
@Converter(autoApply = true)
public class MediumTypeConverter implements AttributeConverter<MediumType, String> {

    @Override
    public String convertToDatabaseColumn(MediumType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public MediumType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }

        for (MediumType type : MediumType.values()) {
            if (type.getValue().equals(dbData)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unknown medium_type value: " + dbData);
    }
}