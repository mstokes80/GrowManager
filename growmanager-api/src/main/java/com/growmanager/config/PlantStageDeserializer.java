package com.growmanager.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.growmanager.entity.Plant;

import java.io.IOException;

/**
 * Custom Jackson deserializer for PlantStage enum.
 * Accepts both uppercase enum names and lowercase values.
 */
public class PlantStageDeserializer extends JsonDeserializer<Plant.PlantStage> {

    @Override
    public Plant.PlantStage deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getText();
        if (value == null) {
            return null;
        }

        // Try to match by lowercase value first (from frontend)
        for (Plant.PlantStage stage : Plant.PlantStage.values()) {
            if (stage.getValue().equalsIgnoreCase(value)) {
                return stage;
            }
        }

        // Try to match by enum name (uppercase)
        try {
            return Plant.PlantStage.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IOException("Invalid PlantStage value: " + value);
        }
    }
}