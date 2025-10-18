package com.growmanager.entity.converter;

import com.growmanager.entity.Plant;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for PlantStatus enum.
 * Converts between PlantStatus enum values and their lowercase database representations.
 * This converter is automatically applied to all PlantStatus fields in entities.
 */
@Converter(autoApply = true)
public class PlantStatusConverter implements AttributeConverter<Plant.PlantStatus, String> {

    @Override
    public String convertToDatabaseColumn(Plant.PlantStatus plantStatus) {
        if (plantStatus == null) {
            return null;
        }
        return plantStatus.getValue();
    }

    @Override
    public Plant.PlantStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        // Try to match by lowercase value
        for (Plant.PlantStatus status : Plant.PlantStatus.values()) {
            if (status.getValue().equals(dbData)) {
                return status;
            }
        }

        throw new IllegalArgumentException("Unknown plant status: " + dbData);
    }
}