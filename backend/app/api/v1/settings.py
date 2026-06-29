from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import require_super_admin
from app.database import get_db
from app.models.settings import ActivityLog, CertificateTemplate, PlatformSetting
from app.schemas.settings import (
    ActivityLogResponse,
    CertificateTemplateCreate,
    CertificateTemplateResponse,
    CertificateTemplateUpdate,
    PlatformSettingCreateUpdate,
    PlatformSettingResponse,
)
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/admin", tags=["Admin"])


async def _record_activity(
    db: AsyncSession,
    user_id: str,
    action: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    description: str | None = None,
) -> None:
    log = ActivityLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
    )
    db.add(log)
    await db.flush()


@router.get("/settings", response_model=list[PlatformSettingResponse])
async def list_platform_settings(current_user=Depends(require_super_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PlatformSetting).options(joinedload(PlatformSetting.updated_by_user)).order_by(PlatformSetting.key))
    return result.scalars().all()


@router.get("/settings/{key}", response_model=PlatformSettingResponse)
async def get_platform_setting(key: str, current_user=Depends(require_super_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PlatformSetting).options(joinedload(PlatformSetting.updated_by_user)).where(PlatformSetting.key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting


@router.put("/settings/{key}", response_model=PlatformSettingResponse)
async def update_platform_setting(
    key: str,
    payload: PlatformSettingCreateUpdate,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PlatformSetting).where(PlatformSetting.key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        setting = PlatformSetting(key=key, value=payload.value, description=payload.description, updated_by=current_user.id)
        db.add(setting)
    else:
        setting.value = payload.value
        setting.description = payload.description
        setting.updated_by = current_user.id
    await _record_activity(
        db,
        str(current_user.id),
        "update_platform_setting",
        resource_type="platform_setting",
        resource_id=key,
        description=f"Updated setting {key}",
    )
    await db.commit()
    await db.refresh(setting)
    return setting


@router.get("/certificate-templates", response_model=list[CertificateTemplateResponse])
async def list_certificate_templates(current_user=Depends(require_super_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CertificateTemplate).order_by(CertificateTemplate.name))
    return result.scalars().all()


@router.post("/certificate-templates", response_model=CertificateTemplateResponse, status_code=201)
async def create_certificate_template(
    payload: CertificateTemplateCreate,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(CertificateTemplate).where(CertificateTemplate.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Certificate template already exists")

    template = CertificateTemplate(
        name=payload.name,
        title=payload.title,
        subtitle=payload.subtitle,
        body=payload.body,
        issuer_left=payload.issuer_left,
        issuer_right=payload.issuer_right,
        company_name=payload.company_name,
        company_registration=payload.company_registration,
        logo_url=payload.logo_url,
        created_by=current_user.id,
    )
    db.add(template)
    await _record_activity(
        db,
        str(current_user.id),
        "create_certificate_template",
        resource_type="certificate_template",
        resource_id=payload.name,
        description=f"Created certificate template {payload.name}",
    )
    await db.commit()
    await db.refresh(template)
    return template


@router.get("/certificate-templates/{template_id}", response_model=CertificateTemplateResponse)
async def get_certificate_template(template_id: str, current_user=Depends(require_super_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CertificateTemplate).where(CertificateTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Certificate template not found")
    return template


@router.put("/certificate-templates/{template_id}", response_model=CertificateTemplateResponse)
async def update_certificate_template(
    template_id: str,
    payload: CertificateTemplateUpdate,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CertificateTemplate).where(CertificateTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Certificate template not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(template, field, value)
    await _record_activity(
        db,
        str(current_user.id),
        "update_certificate_template",
        resource_type="certificate_template",
        resource_id=template_id,
        description=f"Updated certificate template {template.name}",
    )
    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/certificate-templates/{template_id}")
async def delete_certificate_template(template_id: str, current_user=Depends(require_super_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CertificateTemplate).where(CertificateTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Certificate template not found")
    await _record_activity(
        db,
        str(current_user.id),
        "delete_certificate_template",
        resource_type="certificate_template",
        resource_id=template_id,
        description=f"Deleted certificate template {template.name}",
    )
    await db.delete(template)
    await db.commit()
    return {"message": "Certificate template deleted"}


@router.get("/activity-logs", response_model=list[ActivityLogResponse])
async def list_activity_logs(
    user_id: str | None = Query(None),
    action: str | None = Query(None),
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(ActivityLog)
    if user_id:
        query = query.where(ActivityLog.user_id == user_id)
    if action:
        query = query.where(ActivityLog.action == action)
    result = await db.execute(query.order_by(ActivityLog.created_at.desc()))
    return result.scalars().all()
