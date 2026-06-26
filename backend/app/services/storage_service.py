import os
from typing import BinaryIO

import boto3
from botocore.config import Config
from fastapi import HTTPException

from app.config import settings


class StorageService:
    def __init__(self):
        self.endpoint_url = getattr(settings, "S3_ENDPOINT_URL", "") or None
        self.bucket = getattr(settings, "S3_BUCKET_NAME", "") or settings.AWS_BUCKET
        self.access_key = getattr(settings, "S3_ACCESS_KEY", "") or settings.AWS_ACCESS_KEY
        self.secret_key = getattr(settings, "S3_SECRET_KEY", "") or settings.AWS_SECRET_KEY
        self.region = getattr(settings, "S3_REGION", "") or settings.AWS_REGION
        self.client = self._build_client()

    def _build_client(self):
        if not self.access_key or not self.secret_key:
            return None
        config = Config(signature_version="s3v4")
        return boto3.client(
            "s3",
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region or "us-east-1",
            endpoint_url=self.endpoint_url,
            config=config,
        )

    def upload_file(self, file_name: str, file_obj: BinaryIO, content_type: str | None = None) -> str:
        if not self.client:
            raise HTTPException(status_code=500, detail="Object storage is not configured")
        self.client.put_object(
            Bucket=self.bucket,
            Key=file_name,
            Body=file_obj,
            ContentType=content_type or "application/octet-stream",
        )
        return file_name

    def get_public_url(self, key: str) -> str:
        if self.endpoint_url and self.bucket:
            return f"{self.endpoint_url.rstrip('/')}/{self.bucket}/{key}"
        return key
