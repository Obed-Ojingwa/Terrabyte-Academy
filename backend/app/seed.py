import asyncio
from sqlalchemy import select

from app.core.security import hash_password
from app.database import AsyncSessionLocal, Base, engine
from app.models.user import Permission, Role, User
from app.models.settings import CertificateTemplate, PlatformSetting


async def seed_database() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        roles = ["super_admin", "admin", "tutor", "student"]
        existing_roles: dict[str, Role] = {}

        for role_name in roles:
            result = await session.execute(select(Role).where(Role.name == role_name))
            role = result.scalar_one_or_none()
            if role is None:
                role = Role(name=role_name)
                session.add(role)
            existing_roles[role_name] = role

        await session.flush()

        permissions = [
            ("manage_content", "Create and edit learning content"),
            ("manage_courses", "Manage courses"),
            ("manage_payments", "Manage payments"),
            ("manage_users", "Manage users"),
        ]

        for perm_name, description in permissions:
            result = await session.execute(select(Permission).where(Permission.name == perm_name))
            permission = result.scalar_one_or_none()
            if permission is None:
                permission = Permission(name=perm_name, description=description)
                session.add(permission)
                await session.flush()

            for role_name in ["super_admin", "admin", "tutor"]:
                role = existing_roles[role_name]
                await session.refresh(role, attribute_names=["permissions"])
                if permission not in role.permissions:
                    role.permissions.append(permission)

        admin_email = "admin@terrabyteacademy.com"
        result = await session.execute(select(User).where(User.email == admin_email))
        admin_user = result.scalar_one_or_none()
        if admin_user is None:
            admin_user = User(
                email=admin_email,
                password_hash=hash_password("Admin@12345"),
                first_name="Terrabyte",
                last_name="Admin",
                role_id=existing_roles["super_admin"].id,
                is_active=True,
                is_verified=True,
            )
            session.add(admin_user)
            await session.flush()

        default_settings = [
            ("company_name", "Terrabyte Academy", "Platform display name"),
            ("company_registration", "", "Company registration number"),
            ("support_email", "support@terrabyteacademy.com", "Main support email"),
        ]
        for key, value, description in default_settings:
            result = await session.execute(select(PlatformSetting).where(PlatformSetting.key == key))
            setting = result.scalar_one_or_none()
            if setting is None:
                setting = PlatformSetting(
                    key=key,
                    value=value,
                    description=description,
                    updated_by=admin_user.id if admin_user else None,
                )
                session.add(setting)

        template_name = "default"
        result = await session.execute(select(CertificateTemplate).where(CertificateTemplate.name == template_name))
        default_template = result.scalar_one_or_none()
        if default_template is None:
            default_template = CertificateTemplate(
                name=template_name,
                title="Certificate of Completion",
                subtitle="This certificate is awarded to",
                body="{student_name} has successfully completed the course {course_title}.",
                issuer_left="Training Coordinator",
                issuer_right="CEO",
                company_name="Terrabyte Academy",
                company_registration="",
                logo_url="",
                created_by=admin_user.id if admin_user else None,
            )
            session.add(default_template)

        await session.commit()


def sync_seed_database() -> None:
    asyncio.run(seed_database())
