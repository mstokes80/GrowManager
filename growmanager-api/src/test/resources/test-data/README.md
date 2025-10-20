# Analytics Test Data Generator

This directory contains SQL scripts for generating test data for analytics testing.

## generate-analytics-test-data.sql

Generates comprehensive test data including:
- **Activity Logs**: 10 per plant (training, pruning, defoliation, transplants, pest control)
- **Feeding Events**: ~200 per plant (watering, nutrients, foliar sprays over 18 weeks)
- **Harvest Records**: 1 per plant (with realistic weights, THC/CBD percentages, terpene profiles)

### Prerequisites

Before running this script, ensure you have:
1. A user account in the database
2. An active grow (status: 'active', 'flowering', or 'drying')
3. At least one plant associated with that grow

### Running the Script

#### Option 1: Using psql command line

```bash
psql -U growmanager -d growmanager -f generate-analytics-test-data.sql
```

#### Option 2: Using Docker

```bash
docker exec -i growmanager-postgres psql -U growmanager -d growmanager < generate-analytics-test-data.sql
```

#### Option 3: Using the helper script

```bash
./run-test-data-generator.sh
```

### What the script does

1. **Finds the first user** in your database
2. **Finds the first active grow** for that user
3. **Finds all plants** associated with that grow
4. **Generates realistic data** spanning 18 weeks (126 days) of a grow cycle:
   - **Weeks 1-8**: Vegetative stage with light feeding, training, and transplants
   - **Weeks 9-17**: Flowering stage with bloom nutrients and maintenance
   - **Week 18**: Final flush and harvest

### Data Generated

The script creates timeline-based data that's perfect for testing:
- **Activity logs** show plant care activities at realistic intervals
- **Feeding events** follow a realistic schedule (watering every 2-3 days, nutrients as needed)
- **Harvest records** include realistic yields and quality metrics

All timestamps are calculated relative to the grow's `start_date`, ensuring your analytics charts have meaningful data across the entire grow cycle.

### Notes

- The script uses `random()` to add variation to measurements
- All data is linked to a single user for easy testing
- The script will raise informative errors if prerequisites aren't met
- You can run the script multiple times, but it will create duplicate data (you may want to clear old test data first)

### Clearing Test Data

To remove all generated test data (WARNING: this removes ALL data for the tables):

```sql
TRUNCATE activity_logs, feeding_events, harvests CASCADE;
```

Or to remove data for a specific grow:

```sql
DELETE FROM activity_logs WHERE user_id = '<your-user-id>';
DELETE FROM feeding_events WHERE user_id = '<your-user-id>';
DELETE FROM harvests WHERE grow_id = '<your-grow-id>';
```