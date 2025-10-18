package com.growmanager.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA Converter for EnvironmentalSnapshot.SnapshotSource enum.
 * Converts between enum values and lowercase string database values.
 */
@Converter(autoApply = true)
public class SnapshotSourceConverter implements AttributeConverter<EnvironmentalSnapshot.SnapshotSource, String> {

    @Override
    public String convertToDatabaseColumn(EnvironmentalSnapshot.SnapshotSource source) {
        if (source == null) {
            return null;
        }
        return source.getValue();
    }

    @Override
    public EnvironmentalSnapshot.SnapshotSource convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        for (EnvironmentalSnapshot.SnapshotSource source : EnvironmentalSnapshot.SnapshotSource.values()) {
            if (source.getValue().equals(dbData)) {
                return source;
            }
        }

        throw new IllegalArgumentException("Unknown snapshot source: " + dbData);
    }
}