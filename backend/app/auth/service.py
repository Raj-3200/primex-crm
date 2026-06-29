"""PrimeX Services CRM — Auth Service."""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.repository import RefreshTokenRepository, UserRepository
from app.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserProfileResponse,
)
from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.config import settings
from app.users.models import User, UserRole
import jwt


def _hash_token(token: str) -> str:
    """SHA-256 hash of the refresh token for safe DB storage."""
    return hashlib.sha256(token.encode()).hexdigest()


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.user_repo = UserRepository(db)
        self.token_repo = RefreshTokenRepository(db)

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")
        if not user.is_active:
            raise AuthenticationError("Account is deactivated. Contact admin.")

        return await self._generate_tokens(user)

    async def register(self, data: RegisterRequest) -> UserProfileResponse:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise ConflictError("A user with this email already exists")

        try:
            role = UserRole(data.role.upper())
        except ValueError:
            role = UserRole.TECHNICIAN

        user = await self.user_repo.create(
            {
                "email": data.email,
                "hashed_password": hash_password(data.password),
                "full_name": data.full_name,
                "phone": data.phone,
                "role": role,
            }
        )
        return self._to_profile(user)

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("Refresh token has expired. Please log in again.")
        except jwt.InvalidTokenError:
            raise AuthenticationError("Invalid refresh token")

        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")

        token_hash = _hash_token(refresh_token)
        stored = await self.token_repo.get_by_token_hash(token_hash)
        if not stored:
            raise AuthenticationError("Refresh token has been revoked")

        # Revoke the used token (rotation)
        stored.is_revoked = True

        user = await self.user_repo.get_active_by_id(payload["sub"])
        if not user:
            raise AuthenticationError("User not found")

        return await self._generate_tokens(user)

    async def change_password(self, user: User, data: ChangePasswordRequest) -> None:
        if not verify_password(data.current_password, user.hashed_password):
            raise AuthenticationError("Current password is incorrect")
        await self.user_repo.update(
            str(user.id), {"hashed_password": hash_password(data.new_password)}
        )
        # Revoke all refresh tokens on password change
        await self.token_repo.revoke_all_for_user(str(user.id))

    async def update_profile(
        self, user: User, data: UpdateProfileRequest
    ) -> UserProfileResponse:
        update_data = data.model_dump(exclude_none=True)
        updated = await self.user_repo.update(str(user.id), update_data)
        return self._to_profile(updated or user)

    async def _generate_tokens(self, user: User) -> TokenResponse:
        token_data = {"sub": str(user.id), "role": user.role.value}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Store hashed refresh token
        await self.token_repo.create(
            {
                "token_hash": _hash_token(refresh_token),
                "user_id": str(user.id),
                "expires_at": datetime.now(timezone.utc)
                + timedelta(days=settings.refresh_token_expire_days),
            }
        )

        return TokenResponse(
            access_token=access_token, refresh_token=refresh_token
        )

    @staticmethod
    def _to_profile(user: User) -> UserProfileResponse:
        return UserProfileResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
        )
