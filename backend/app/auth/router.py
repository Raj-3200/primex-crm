"""PrimeX Services CRM — Auth Router."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserProfileResponse,
)
from app.auth.service import AuthService
from app.core.database import get_db
from app.core.dependencies import CurrentUser, AdminOnly

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Authenticate with email and password. Returns JWT access + refresh tokens."""
    return await AuthService(db).login(data)


@router.post("/register", response_model=UserProfileResponse, status_code=201)
async def register(
    data: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[object, Depends(AdminOnly)],
) -> UserProfileResponse:
    """Register a new user (Admin only)."""
    return await AuthService(db).register(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    data: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Exchange a refresh token for new access + refresh tokens (rotation)."""
    return await AuthService(db).refresh_tokens(data.refresh_token)


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: CurrentUser) -> UserProfileResponse:
    """Get the current authenticated user's profile."""
    from app.auth.service import AuthService
    return AuthService._to_profile(current_user)


@router.put("/me", response_model=UserProfileResponse)
async def update_me(
    data: UpdateProfileRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserProfileResponse:
    """Update current user's profile (name, phone)."""
    return await AuthService(db).update_profile(current_user, data)


@router.post("/change-password", status_code=204)
async def change_password(
    data: ChangePasswordRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Change current user's password. Revokes all refresh tokens."""
    await AuthService(db).change_password(current_user, data)
