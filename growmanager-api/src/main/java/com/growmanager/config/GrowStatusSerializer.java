package com.growmanager.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.growmanager.entity.Grow;

import java.io.IOException;

/**
 * Custom Jackson serializer for GrowStatus enum.
 * Serializes to lowercase value for JSON responses.
 */
public class GrowStatusSerializer extends JsonSerializer<Grow.GrowStatus> {

    @Override
    public void serialize(Grow.GrowStatus value, JsonGenerator gen, SerializerProvider serializers)
            throws IOException {
        if (value == null) {
            gen.writeNull();
        } else {
            gen.writeString(value.getValue());
        }
    }
}