#!/bin/bash

# ============================================================================
# Analytics Test Data Generator - Execution Script
# ============================================================================
# This script executes the SQL test data generator against the PostgreSQL database
# Usage: ./run-test-data-generator.sh
# ============================================================================

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/generate-analytics-test-data.sql"

# Database connection settings (modify if needed)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-growmanager}"
DB_USER="${DB_USER:-growmanager}"

echo "=========================================="
echo "Analytics Test Data Generator"
echo "=========================================="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "Error: SQL file not found at $SQL_FILE"
    exit 1
fi

echo "Checking database connection..."

# Try to connect using psql
if command -v psql &> /dev/null; then
    echo "Using psql to execute script..."
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"
    exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo ""
        echo "=========================================="
        echo "✅ Test data generated successfully!"
        echo "=========================================="
    else
        echo ""
        echo "❌ Error: Script execution failed with exit code $exit_code"
        exit $exit_code
    fi
else
    # Fallback: try using docker
    echo "psql not found, trying Docker..."

    CONTAINER_NAME="${CONTAINER_NAME:-growmanager-postgres}"

    if docker ps | grep -q "$CONTAINER_NAME"; then
        echo "Using Docker container: $CONTAINER_NAME"
        cat "$SQL_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
        exit_code=$?

        if [ $exit_code -eq 0 ]; then
            echo ""
            echo "=========================================="
            echo "✅ Test data generated successfully!"
            echo "=========================================="
        else
            echo ""
            echo "❌ Error: Script execution failed with exit code $exit_code"
            exit $exit_code
        fi
    else
        echo "Error: Neither psql command nor Docker container '$CONTAINER_NAME' found"
        echo ""
        echo "Please either:"
        echo "  1. Install PostgreSQL client tools (psql)"
        echo "  2. Ensure Docker is running with container name '$CONTAINER_NAME'"
        echo "  3. Set CONTAINER_NAME environment variable to your postgres container name"
        exit 1
    fi
fi