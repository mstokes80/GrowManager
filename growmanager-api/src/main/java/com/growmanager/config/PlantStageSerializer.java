package com.growmanager.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.growmanager.entity.Plant;

import java.io.IOException;

/**
 * Custom Jackson serializer for PlantStage enum.
 * Serializes to lowercase value for JSON responses.
 */
public class PlantStageSerializer extends JsonSerializer<Plant.PlantStage> {

    @Override
    public void serialize(Plant.PlantStage value, JsonGenerator gen, SerializerProvider serializers)
            throws IOException {
        if (value == null) {
            gen.writeNull();
        } else {
            gen.writeString(value.getValue());
        }
    }
}