package com.growmanager.entity.converter;

import com.growmanager.entity.Grow;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for EnvironmentType enum.
 * Converts between the enum and its lowercase database value.
 */
@Converter(autoApply = true)
public class EnvironmentTypeConverter implements AttributeConverter<Grow.EnvironmentType, String> {

    @Override
    public String convertToDatabaseColumn(Grow.EnvironmentType environmentType) {
        if (environmentType == null) {
            return null;
        }
        return environmentType.getValue();
    }

    @Override
    public Grow.EnvironmentType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        for (Grow.EnvironmentType type : Grow.EnvironmentType.values()) {
            if (type.getValue().equals(dbData)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unknown environment type: " + dbData);
    }
}