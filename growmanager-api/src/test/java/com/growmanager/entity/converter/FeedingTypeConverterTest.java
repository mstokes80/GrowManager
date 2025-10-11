package com.growmanager.entity.converter;

import com.growmanager.entity.FeedingEvent.FeedingType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Test suite for FeedingTypeConverter.
 * Tests the conversion between FeedingType enum and database column values.
 */
class FeedingTypeConverterTest {

    private FeedingTypeConverter converter;

    @BeforeEach
    void setUp() {
        converter = new FeedingTypeConverter();
    }

    // Tests for convertToDatabaseColumn
    @Test
    @DisplayName("Should convert WATERING enum to database column value")
    void testConvertToDatabaseColumn_Watering() {
        String result = converter.convertToDatabaseColumn(FeedingType.WATERING);
        assertThat(result).isEqualTo("watering");
    }

    @Test
    @DisplayName("Should convert NUTRIENTS enum to database column value")
    void testConvertToDatabaseColumn_Nutrients() {
        String result = converter.convertToDatabaseColumn(FeedingType.NUTRIENTS);
        assertThat(result).isEqualTo("nutrients");
    }

    @Test
    @DisplayName("Should convert FOLIAR enum to database column value")
    void testConvertToDatabaseColumn_Foliar() {
        String result = converter.convertToDatabaseColumn(FeedingType.FOLIAR);
        assertThat(result).isEqualTo("foliar");
    }

    @Test
    @DisplayName("Should handle null enum value for database conversion")
    void testConvertToDatabaseColumn_NullValue() {
        String result = converter.convertToDatabaseColumn(null);
        assertThat(result).isNull();
    }

    // Tests for convertToEntityAttribute
    @Test
    @DisplayName("Should convert watering database value to enum")
    void testConvertToEntityAttribute_Watering() {
        FeedingType result = converter.convertToEntityAttribute("watering");
        assertThat(result).isEqualTo(FeedingType.WATERING);
    }

    @Test
    @DisplayName("Should convert nutrients database value to enum")
    void testConvertToEntityAttribute_Nutrients() {
        FeedingType result = converter.convertToEntityAttribute("nutrients");
        assertThat(result).isEqualTo(FeedingType.NUTRIENTS);
    }

    @Test
    @DisplayName("Should convert foliar database value to enum")
    void testConvertToEntityAttribute_Foliar() {
        FeedingType result = converter.convertToEntityAttribute("foliar");
        assertThat(result).isEqualTo(FeedingType.FOLIAR);
    }

    @Test
    @DisplayName("Should handle null database value for entity conversion")
    void testConvertToEntityAttribute_NullValue() {
        FeedingType result = converter.convertToEntityAttribute(null);
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("Should throw exception for invalid database values")
    void testConvertToEntityAttribute_InvalidValue() {
        assertThatThrownBy(() -> converter.convertToEntityAttribute("INVALID"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown feeding type");
    }

    @Test
    @DisplayName("Should throw exception for uppercase database values")
    void testConvertToEntityAttribute_UppercaseValues() {
        // The converter expects exact matches, so uppercase should fail
        assertThatThrownBy(() -> converter.convertToEntityAttribute("WATERING"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown feeding type");
    }

    // Test round-trip conversion
    @Test
    @DisplayName("Should successfully round-trip convert all FeedingType values")
    void testRoundTripConversion() {
        for (FeedingType feedingType : FeedingType.values()) {
            String dbValue = converter.convertToDatabaseColumn(feedingType);
            FeedingType backToEnum = converter.convertToEntityAttribute(dbValue);
            assertThat(backToEnum).isEqualTo(feedingType);
        }
    }
}