package com.growmanager.entity.converter;

import com.growmanager.entity.ActivityLog.ActivityType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Test suite for ActivityTypeConverter.
 * Tests the conversion between ActivityType enum and database column values.
 */
class ActivityTypeConverterTest {

    private ActivityTypeConverter converter;

    @BeforeEach
    void setUp() {
        converter = new ActivityTypeConverter();
    }

    // Tests for convertToDatabaseColumn
    @Test
    @DisplayName("Should convert TRAINING enum to database column value")
    void testConvertToDatabaseColumn_Training() {
        String result = converter.convertToDatabaseColumn(ActivityType.TRAINING);
        assertThat(result).isEqualTo("training");
    }

    @Test
    @DisplayName("Should convert PRUNING enum to database column value")
    void testConvertToDatabaseColumn_Pruning() {
        String result = converter.convertToDatabaseColumn(ActivityType.PRUNING);
        assertThat(result).isEqualTo("pruning");
    }

    @Test
    @DisplayName("Should convert DEFOLIATION enum to database column value")
    void testConvertToDatabaseColumn_Defoliation() {
        String result = converter.convertToDatabaseColumn(ActivityType.DEFOLIATION);
        assertThat(result).isEqualTo("defoliation");
    }

    @Test
    @DisplayName("Should convert TRANSPLANT enum to database column value")
    void testConvertToDatabaseColumn_Transplant() {
        String result = converter.convertToDatabaseColumn(ActivityType.TRANSPLANT);
        assertThat(result).isEqualTo("transplant");
    }

    @Test
    @DisplayName("Should convert PEST_CONTROL enum to database column value")
    void testConvertToDatabaseColumn_PestControl() {
        String result = converter.convertToDatabaseColumn(ActivityType.PEST_CONTROL);
        assertThat(result).isEqualTo("pest_control");
    }

    @Test
    @DisplayName("Should convert OTHER enum to database column value")
    void testConvertToDatabaseColumn_Other() {
        String result = converter.convertToDatabaseColumn(ActivityType.OTHER);
        assertThat(result).isEqualTo("other");
    }

    @Test
    @DisplayName("Should handle null enum value for database conversion")
    void testConvertToDatabaseColumn_NullValue() {
        String result = converter.convertToDatabaseColumn(null);
        assertThat(result).isNull();
    }

    // Tests for convertToEntityAttribute
    @Test
    @DisplayName("Should convert training database value to enum")
    void testConvertToEntityAttribute_Training() {
        ActivityType result = converter.convertToEntityAttribute("training");
        assertThat(result).isEqualTo(ActivityType.TRAINING);
    }

    @Test
    @DisplayName("Should convert pruning database value to enum")
    void testConvertToEntityAttribute_Pruning() {
        ActivityType result = converter.convertToEntityAttribute("pruning");
        assertThat(result).isEqualTo(ActivityType.PRUNING);
    }

    @Test
    @DisplayName("Should convert defoliation database value to enum")
    void testConvertToEntityAttribute_Defoliation() {
        ActivityType result = converter.convertToEntityAttribute("defoliation");
        assertThat(result).isEqualTo(ActivityType.DEFOLIATION);
    }

    @Test
    @DisplayName("Should convert transplant database value to enum")
    void testConvertToEntityAttribute_Transplant() {
        ActivityType result = converter.convertToEntityAttribute("transplant");
        assertThat(result).isEqualTo(ActivityType.TRANSPLANT);
    }

    @Test
    @DisplayName("Should convert pest_control database value to enum")
    void testConvertToEntityAttribute_PestControl() {
        ActivityType result = converter.convertToEntityAttribute("pest_control");
        assertThat(result).isEqualTo(ActivityType.PEST_CONTROL);
    }

    @Test
    @DisplayName("Should convert other database value to enum")
    void testConvertToEntityAttribute_Other() {
        ActivityType result = converter.convertToEntityAttribute("other");
        assertThat(result).isEqualTo(ActivityType.OTHER);
    }

    @Test
    @DisplayName("Should handle null database value for entity conversion")
    void testConvertToEntityAttribute_NullValue() {
        ActivityType result = converter.convertToEntityAttribute(null);
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("Should throw exception for invalid database values")
    void testConvertToEntityAttribute_InvalidValue() {
        assertThatThrownBy(() -> converter.convertToEntityAttribute("INVALID"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown activity type");
    }

    @Test
    @DisplayName("Should throw exception for uppercase database values")
    void testConvertToEntityAttribute_UppercaseValues() {
        // The converter expects exact matches, so uppercase should fail
        assertThatThrownBy(() -> converter.convertToEntityAttribute("TRAINING"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown activity type");
    }

    // Test round-trip conversion
    @Test
    @DisplayName("Should successfully round-trip convert all ActivityType values")
    void testRoundTripConversion() {
        for (ActivityType activityType : ActivityType.values()) {
            String dbValue = converter.convertToDatabaseColumn(activityType);
            ActivityType backToEnum = converter.convertToEntityAttribute(dbValue);
            assertThat(backToEnum).isEqualTo(activityType);
        }
    }
}