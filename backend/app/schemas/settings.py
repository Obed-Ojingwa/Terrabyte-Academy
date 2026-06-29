from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.lms import UserSummary


class PlatformSettingResponse(BaseModel):
    id: UUID
    key: str
    value: str
    description: Optional[str] = None
    updated_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    updated_by_user: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class PlatformSettingCreateUpdate(BaseModel):
    value: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CertificateTemplateResponse(BaseModel):
    id: UUID
    name: str
    title: str
    subtitle: Optional[str] = None
    body: Optional[str] = None
    issuer_left: Optional[str] = None
    issuer_right: Optional[str] = None
    company_name: Optional[str] = None
    company_registration: Optional[str] = None
    logo_url: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CertificateTemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=255)
    subtitle: Optional[str] = None
    body: Optional[str] = None
    issuer_left: Optional[str] = None
    issuer_right: Optional[str] = None
    company_name: Optional[str] = None
    company_registration: Optional[str] = None
    logo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CertificateTemplateUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    body: Optional[str] = None
    issuer_left: Optional[str] = None
    issuer_right: Optional[str] = None
    company_name: Optional[str] = None
    company_registration: Optional[str] = None
    logo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ActivityLogResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
