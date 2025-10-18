package com.growmanager.entity.converter;

import com.growmanager.entity.ActivityLog;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for ActivityType enum.
 * Converts between the enum and its lowercase database value.
 */
@Converter(autoApply = true)
public class ActivityTypeConverter implements AttributeConverter<ActivityLog.ActivityType, String> {

    @Override
    public String convertToDatabaseColumn(ActivityLog.ActivityType activityType) {
        if (activityType == null) {
            return null;
        }
        return activityType.getValue();
    }

    @Override
    public ActivityLog.ActivityType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        for (ActivityLog.ActivityType type : ActivityLog.ActivityType.values()) {
            if (type.getValue().equals(dbData)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unknown activity type: " + dbData);
    }
}