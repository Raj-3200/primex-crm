"""
PrimeX CRM - Seed Script
Creates the default admin user in Neon DB.

Run from backend/ directory:
    python seed_admin.py

Credentials created:
    Email:    admin@primex.com
    Password: Admin@123
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))


async def main():
    try:
        # Import ALL models first so SQLAlchemy can resolve relationships
        from app.core.base_model import Base                       # noqa: F401
        from app.users.models import User, UserRole                # noqa: F401
        from app.customers.models import Customer                  # noqa: F401
        from app.orders.models import Order                        # noqa: F401
        from app.activity.models import ActivityLog                # noqa: F401
        from app.auth.models import RefreshToken                   # noqa: F401
        from app.core.database import engine, AsyncSessionLocal
        from app.core.security import hash_password
        from sqlalchemy import select
    except ImportError as e:
        print(f"[ERROR] Import failed: {e}")
        return

    print("[1/3] Connecting to Neon DB and creating tables if needed...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("      Tables ready.")

    async with AsyncSessionLocal() as session:
        print("[2/3] Checking for existing admin user...")
        result = await session.execute(
            select(User).where(User.email == "admin@primex.com")
        )
        existing = result.scalar_one_or_none()

        if existing:
            print("      Admin already exists. Skipping creation.")
        else:
            print("[3/3] Creating admin user...")
            admin = User(
                email="admin@primex.com",
                hashed_password=hash_password("Admin@123"),
                full_name="PrimeX Admin",
                role=UserRole.ADMIN,
                is_active=True,
            )
            session.add(admin)
            await session.commit()
            print("      Admin user created!")

    print("")
    print("=" * 40)
    print("  LOGIN CREDENTIALS")
    print("=" * 40)
    print("  Email   : admin@primex.com")
    print("  Password: Admin@123")
    print("  URL     : http://localhost:3000/login")
    print("=" * 40)


if __name__ == "__main__":
    asyncio.run(main())
