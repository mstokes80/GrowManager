#!/bin/sh
# MinIO initialization script
# Sets the bucket policy to allow public read access for images

set -e

echo "Waiting for MinIO to be ready..."
sleep 5

# Configure MinIO client
mc alias set myminio http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}

# Create bucket if it doesn't exist
mc mb myminio/${BUCKET_NAME} --ignore-existing

# Set bucket policy to allow public read access
mc anonymous set download myminio/${BUCKET_NAME}

echo "MinIO bucket '${BUCKET_NAME}' is now publicly readable"