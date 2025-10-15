package com.growmanager.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.growmanager.entity.Harvest.WeightUnit;

import java.io.IOException;

/**
 * JSON serializer for WeightUnit enum.
 * Serializes WeightUnit to its lowercase string value.
 */
public class WeightUnitSerializer extends JsonSerializer<WeightUnit> {

    @Override
    public void serialize(WeightUnit value, JsonGenerator gen, SerializerProvider serializers)
            throws IOException {
        if (value != null) {
            gen.writeString(value.getValue());
        }
    }
}