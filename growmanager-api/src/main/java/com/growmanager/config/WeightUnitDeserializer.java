package com.growmanager.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.growmanager.entity.Harvest.WeightUnit;

import java.io.IOException;

/**
 * JSON deserializer for WeightUnit enum.
 * Deserializes string value to WeightUnit enum.
 */
public class WeightUnitDeserializer extends JsonDeserializer<WeightUnit> {

    @Override
    public WeightUnit deserialize(JsonParser p, DeserializationContext ctxt)
            throws IOException {
        String value = p.getText();
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        // Try to match by lowercase value
        for (WeightUnit unit : WeightUnit.values()) {
            if (unit.getValue().equalsIgnoreCase(value)) {
                return unit;
            }
        }

        // Try standard enum conversion
        try {
            return WeightUnit.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid weight unit: " + value);
        }
    }
}