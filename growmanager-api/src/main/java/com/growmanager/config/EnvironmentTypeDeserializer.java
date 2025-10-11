package com.growmanager.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.growmanager.entity.Grow;

import java.io.IOException;

/**
 * Custom Jackson deserializer for EnvironmentType enum.
 * Accepts both uppercase enum names and lowercase values.
 */
public class EnvironmentTypeDeserializer extends JsonDeserializer<Grow.EnvironmentType> {

    @Override
    public Grow.EnvironmentType deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getText();
        if (value == null) {
            return null;
        }

        // Try to match by lowercase value first (from frontend)
        for (Grow.EnvironmentType type : Grow.EnvironmentType.values()) {
            if (type.getValue().equalsIgnoreCase(value)) {
                return type;
            }
        }

        // Try to match by enum name (uppercase)
        try {
            return Grow.EnvironmentType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IOException("Invalid EnvironmentType value: " + value);
        }
    }
}