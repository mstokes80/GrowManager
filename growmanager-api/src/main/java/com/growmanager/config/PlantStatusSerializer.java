package com.growmanager.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.growmanager.entity.Plant;

import java.io.IOException;

/**
 * Custom Jackson serializer for PlantStatus enum.
 * Serializes to lowercase value for JSON responses.
 */
public class PlantStatusSerializer extends JsonSerializer<Plant.PlantStatus> {

    @Override
    public void serialize(Plant.PlantStatus value, JsonGenerator gen, SerializerProvider serializers)
            throws IOException {
        if (value == null) {
            gen.writeNull();
        } else {
            gen.writeString(value.getValue());
        }
    }
}