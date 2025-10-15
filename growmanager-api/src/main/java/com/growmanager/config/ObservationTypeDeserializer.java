package com.growmanager.config;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.growmanager.entity.Observation;

import java.io.IOException;

public class ObservationTypeDeserializer extends JsonDeserializer<Observation.ObservationType> {


    @Override
    public Observation.ObservationType deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JacksonException {
        String value = p.getText();
        if (value == null) {
            return null;
        }

        for (Observation.ObservationType type : Observation.ObservationType.values()) {
            if (type.getValue().equalsIgnoreCase(value)) {
                return type;
            }
        }

        try {
            return Observation.ObservationType.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new IOException("Invalid observation type: " + value);
        }
    }
}
