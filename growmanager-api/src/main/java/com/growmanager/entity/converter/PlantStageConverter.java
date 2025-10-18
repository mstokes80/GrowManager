package com.growmanager.entity.converter;

import com.growmanager.entity.Plant;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for PlantStage enum.
 * Converts between PlantStage enum values and their lowercase database representations.
 * This converter is automatically applied to all PlantStage fields in entities.
 */
@Converter(autoApply = true)
public class PlantStageConverter implements AttributeConverter<Plant.PlantStage, String> {

    @Override
    public String convertToDatabaseColumn(Plant.PlantStage plantStage) {
        if (plantStage == null) {
            return null;
        }
        return plantStage.getValue();
    }

    @Override
    public Plant.PlantStage convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        // Try to match by lowercase value
        for (Plant.PlantStage stage : Plant.PlantStage.values()) {
            if (stage.getValue().equals(dbData)) {
                return stage;
            }
        }

        throw new IllegalArgumentException("Unknown plant stage: " + dbData);
    }
}