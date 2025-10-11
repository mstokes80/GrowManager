package com.growmanager.entity.converter;

import com.growmanager.entity.Grow;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for GrowStatus enum.
 * Converts between the enum and its lowercase database value.
 */
@Converter(autoApply = true)
public class GrowStatusConverter implements AttributeConverter<Grow.GrowStatus, String> {

    @Override
    public String convertToDatabaseColumn(Grow.GrowStatus growStatus) {
        if (growStatus == null) {
            return null;
        }
        return growStatus.getValue();
    }

    @Override
    public Grow.GrowStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        for (Grow.GrowStatus status : Grow.GrowStatus.values()) {
            if (status.getValue().equals(dbData)) {
                return status;
            }
        }

        throw new IllegalArgumentException("Unknown grow status: " + dbData);
    }
}