package com.growmanager.entity.converter;

import com.growmanager.entity.FeedingEvent;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for FeedingType enum.
 * Converts between the enum and its lowercase database value.
 */
@Converter(autoApply = true)
public class FeedingTypeConverter implements AttributeConverter<FeedingEvent.FeedingType, String> {

    @Override
    public String convertToDatabaseColumn(FeedingEvent.FeedingType feedingType) {
        if (feedingType == null) {
            return null;
        }
        return feedingType.getValue();
    }

    @Override
    public FeedingEvent.FeedingType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        for (FeedingEvent.FeedingType type : FeedingEvent.FeedingType.values()) {
            if (type.getValue().equals(dbData)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unknown feeding type: " + dbData);
    }
}