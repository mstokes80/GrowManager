package com.growmanager.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.growmanager.entity.Plant;

import java.io.IOException;

/**
 * Custom Jackson deserializer for PlantStatus enum.
 * Accepts both uppercase enum names and lowercase values.
 */
public class PlantStatusDeserializer extends JsonDeserializer<Plant.PlantStatus> {

    @Override
    public Plant.PlantStatus deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getText();
        if (value == null) {
            return null;
        }

        // Try to match by lowercase value first (from frontend)
        for (Plant.PlantStatus status : Plant.PlantStatus.values()) {
            if (status.getValue().equalsIgnoreCase(value)) {
                return status;
            }
        }

        // Try to match by enum name (uppercase)
        try {
            return Plant.PlantStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IOException("Invalid PlantStatus value: " + value);
        }
    }
}