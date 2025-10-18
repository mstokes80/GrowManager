package com.growmanager.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.growmanager.entity.Cultivar;

import java.io.IOException;

/**
 * Custom Jackson deserializer for CultivarType enum.
 * Accepts both uppercase enum names and lowercase values.
 */
public class CultivarTypeDeserializer extends JsonDeserializer<Cultivar.CultivarType> {

    @Override
    public Cultivar.CultivarType deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getText();
        if (value == null) {
            return null;
        }

        // Try to match by lowercase value first (from frontend)
        for (Cultivar.CultivarType type : Cultivar.CultivarType.values()) {
            if (type.getValue().equalsIgnoreCase(value)) {
                return type;
            }
        }

        // Try to match by enum name (uppercase)
        try {
            return Cultivar.CultivarType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IOException("Invalid CultivarType value: " + value);
        }
    }
}