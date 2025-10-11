package com.growmanager.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.growmanager.entity.Grow;

import java.io.IOException;

/**
 * Custom Jackson deserializer for GrowStatus enum.
 * Accepts both uppercase enum names and lowercase values.
 */
public class GrowStatusDeserializer extends JsonDeserializer<Grow.GrowStatus> {

    @Override
    public Grow.GrowStatus deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getText();
        if (value == null) {
            return null;
        }

        // Try to match by lowercase value first (from frontend)
        for (Grow.GrowStatus status : Grow.GrowStatus.values()) {
            if (status.getValue().equalsIgnoreCase(value)) {
                return status;
            }
        }

        // Try to match by enum name (uppercase)
        try {
            return Grow.GrowStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IOException("Invalid GrowStatus value: " + value);
        }
    }
}