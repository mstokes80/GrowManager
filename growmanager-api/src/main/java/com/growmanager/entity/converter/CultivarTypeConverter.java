package com.growmanager.entity.converter;

import com.growmanager.entity.Cultivar;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for CultivarType enum.
 * Converts between CultivarType enum values and their lowercase database representations.
 * This converter is automatically applied to all CultivarType fields in entities.
 */
@Converter(autoApply = true)
public class CultivarTypeConverter implements AttributeConverter<Cultivar.CultivarType, String> {

    @Override
    public String convertToDatabaseColumn(Cultivar.CultivarType cultivarType) {
        if (cultivarType == null) {
            return null;
        }
        return cultivarType.getValue();
    }

    @Override
    public Cultivar.CultivarType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        // Try to match by lowercase value
        for (Cultivar.CultivarType type : Cultivar.CultivarType.values()) {
            if (type.getValue().equals(dbData)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unknown cultivar type: " + dbData);
    }
}