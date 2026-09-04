import os
from pathlib import Path
from typing import BinaryIO

import boto3
from botocore.config import Config
from fastapi import HTTPException

from app.config import settings


class StorageService:
    """Uses S3-compatible object storage with a safe local fallback for local/dev use."""

    def __init__(self):
        self.endpoint_url = getattr(settings, "S3_ENDPOINT_URL", "") or None
        self.bucket = getattr(settings, "S3_BUCKET_NAME", "") or settings.AWS_BUCKET
        if self.endpoint_url:
            self.access_key = getattr(settings, "S3_ACCESS_KEY", "") or ""
            self.secret_key = getattr(settings, "S3_SECRET_KEY", "") or ""
        else:
            self.access_key = getattr(settings, "S3_ACCESS_KEY", "") or settings.AWS_ACCESS_KEY
            self.secret_key = getattr(settings, "S3_SECRET_KEY", "") or settings.AWS_SECRET_KEY
        self.region = getattr(settings, "S3_REGION", "") or settings.AWS_REGION
        self.local_root = Path(getattr(settings, "LOCAL_STORAGE_DIR", os.path.join(os.getcwd(), "storage")))
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

    def _ensure_local_path(self, key: str) -> Path:
        normalized_key = key.lstrip("/")
        path = self.local_root / normalized_key
        path.parent.mkdir(parents=True, exist_ok=True)
        return path

    def upload_file(self, file_name: str, file_obj: BinaryIO | bytes, content_type: str | None = None) -> str:
        normalized_name = file_name.lstrip("/")
        if not self.client:
            path = self._ensure_local_path(normalized_name)
            payload = bytes(file_obj) if isinstance(file_obj, (bytes, bytearray)) else file_obj.read()
            path.write_bytes(payload)
            return normalized_name
        if not self.bucket:
            raise HTTPException(status_code=503, detail="Object storage bucket is not configured")
        payload = bytes(file_obj) if isinstance(file_obj, (bytes, bytearray)) else file_obj.read()
        self.client.put_object(
            Bucket=self.bucket,
            Key=normalized_name,
            Body=payload,
            ContentType=content_type or "application/octet-stream",
        )
        return normalized_name

    def get_public_url(self, key: str) -> str:
        normalized_key = key.lstrip("/")
        if self.client:
            if self.endpoint_url:
                if not self.bucket:
                    raise HTTPException(status_code=503, detail="Object storage bucket is not configured")
                return f"{self.endpoint_url.rstrip('/')}/{self.bucket}/{normalized_key}"
            if self.bucket and self.region:
                return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{normalized_key}"
            return normalized_key

        base_url = (getattr(settings, "BACKEND_BASE_URL", "") or "http://localhost:8000").rstrip("/")
        return f"{base_url}/storage/{normalized_key}"
