package com.growmanager.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.growmanager.entity.Cultivar;

import java.io.IOException;

/**
 * Custom Jackson serializer for CultivarType enum.
 * Serializes to lowercase value for JSON responses.
 */
public class CultivarTypeSerializer extends JsonSerializer<Cultivar.CultivarType> {

    @Override
    public void serialize(Cultivar.CultivarType value, JsonGenerator gen, SerializerProvider serializers)
            throws IOException {
        if (value == null) {
            gen.writeNull();
        } else {
            gen.writeString(value.getValue());
        }
    }
}