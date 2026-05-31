---
name: spark-pipeline
description: "Design and implement Apache Spark data pipelines — batch and streaming ETL"
governance: "Constitution ENG-004: Engineering Excellence & Software Craftsmanship Standard"
---
---

# Spark Pipeline

Design and implement Apache Spark data pipelines — batch and streaming ETL
using PySpark/SparkSQL — following medallion architecture patterns with
validation, error handling, and production-grade reliability.

## What problem this solves
Data pipelines that "work on sample data" fail in production with null values,
schema drift, and silent data loss. This skill produces Spark pipelines with
schema enforcement, audit columns, error handling, and idempotent writes —
reliable enough for production data engineering.

## When to use
When building ETL/ELT pipelines for data lakes. When processing large datasets
(> 1GB) that require distributed processing. When implementing medallion
architecture (Bronze → Silver → Gold).

## Input
Data source details (CSV, JSON, Parquet, JDBC, Kafka), target schema, business
transformation rules, partitioning requirements.

## Output
```python
# spark_jobs/bronze_ingestion.py
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.types import StructType, StructField, StringType, DoubleType
from pyspark.sql.functions import input_file_name, current_timestamp, lit
from datetime import datetime

spark = SparkSession.builder \
    .appName("Bronze Ingestion — Trades") \
    .config("spark.sql.sources.partitionOverwriteMode", "dynamic") \
    .getOrCreate()

# Define explicit schema (inferSchema=False — schema is explicit)
trade_schema = StructType([
    StructField("trade_id", StringType(), False),
    StructField("customer_id", StringType(), False),
    StructField("coin_id", StringType(), False),
    StructField("trade_type", StringType(), False),
    StructField("quantity", DoubleType(), False),
    StructField("price", DoubleType(), False),
    StructField("trade_date", StringType(), False),
])

class BronzeIngestion:
    """Ingest raw data into Bronze layer — append-only, immutable."""

    def __init__(self, source_path: str, bronze_path: str):
        self.source_path = source_path
        self.bronze_path = bronze_path
        self.ingestion_ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def read_source(self) -> DataFrame:
        """Read source data with explicit schema."""
        return (
            spark.read
            .option("header", "false")       # CSV has no header
            .option("delimiter", ";")          # Semicolon-delimited
            .schema(trade_schema)              # Enforce schema
            .csv(self.source_path)
        )

    def add_audit_columns(self, df: DataFrame) -> DataFrame:
        """Add audit columns required on every table."""
        return df.withColumns({
            "record_source": input_file_name(),
            "ingestion_timestamp": current_timestamp(),
            "source_file": input_file_name(),
        })

    def validate_row_counts(self, df: DataFrame, source_count: int) -> None:
        """Validate ingestion row count matches source."""
        bronze_count = df.count()
        if bronze_count != source_count:
            raise ValueError(
                f"Row count mismatch: source={source_count}, bronze={bronze_count}. "
                f"Difference: {abs(source_count - bronze_count)} rows"
            )
        print(f"✅ Row count validated: {bronze_count:,} rows ingested")

    def write_bronze(self, df: DataFrame) -> None:
        """Write to Bronze layer — append-only, partitioned by date."""
        (
            df.write
            .mode("append")                    # Append-only — never overwrite Bronze
            .format("parquet")
            .partitionBy("ingestion_date")
            .option("compression", "snappy")
            .save(self.bronze_path)
        )

    def run(self) -> None:
        """Execute full Bronze ingestion pipeline."""
        print(f"🔄 Starting Bronze ingestion: {self.ingestion_ts}")

        # 1. Read source
        raw_df = self.read_source()
        source_count = raw_df.count()
        print(f"📥 Source rows: {source_count:,}")

        # 2. Add audit columns
        enriched_df = self.add_audit_columns(raw_df)

        # 3. Add ingestion date for partitioning
        enriched_df = enriched_df.withColumn(
            "ingestion_date", current_timestamp().cast("date")
        )

        # 4. Validate
        self.validate_row_counts(enriched_df, source_count)

        # 5. Write
        self.write_bronze(enriched_df)
        print(f"✅ Bronze ingestion complete: {self.bronze_path}")


# --- Usage ---
if __name__ == "__main__":
    ingestion = BronzeIngestion(
        source_path="./data/trades/",
        bronze_path="./data/bronze/trades/"
    )
    ingestion.run()
```

## Steps
1. Analyze source: format, schema, volume, delimiter, headers
2. Define explicit schema (StructType) — never use inferSchema in production
3. Design pipeline class with methods: read → transform → validate → write
4. Add audit columns to every table: `record_source`, `ingestion_timestamp`, `source_file`
5. Validate: row counts (source vs. output), schema compliance, null checks on key columns
6. Configure write: mode (append for Bronze, overwrite for Silver/Gold), format (Parquet/Delta), partitioning
7. Handle errors: schema mismatch (log + quarantine), null PK (reject), row count mismatch (alert)
8. Test with sample data, then full dataset; verify with spark-submit or notebook

## Rules
- `inferSchema=False` — schema must be explicit; inferred schemas cause production failures
- Bronze: append-only, immutable — never modify Bronze data
- Every table must have audit columns: `record_source`, `ingestion_timestamp`, `source_file`
- Validate row counts after every write — catch silent data loss
- Partition by date for time-series data; limit to < 1000 partitions
- Use Parquet with Snappy compression as default format
- Coordinate with Junia for architecture and Bernabé for pipeline orchestration
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
