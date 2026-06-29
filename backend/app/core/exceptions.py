"""
PrimeX Services CRM — Custom Exception Classes & Handlers.

Centralises error handling for consistent API error responses.
"""

from __future__ import annotations

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


# ── Domain Exceptions ─────────────────────────────────────────────────────────
class PrimeXException(Exception):
    """Base exception for all PrimeX domain errors."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(PrimeXException):
    def __init__(self, resource: str, id: str | int | None = None) -> None:
        msg = f"{resource} not found" if id is None else f"{resource} '{id}' not found"
        super().__init__(msg, status.HTTP_404_NOT_FOUND)


class ConflictError(PrimeXException):
    def __init__(self, message: str) -> None:
        super().__init__(message, status.HTTP_409_CONFLICT)


class AuthenticationError(PrimeXException):
    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class PermissionError(PrimeXException):
    def __init__(self, message: str = "Insufficient permissions") -> None:
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class ValidationError(PrimeXException):
    def __init__(self, message: str) -> None:
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


# ── Exception Handlers ────────────────────────────────────────────────────────
async def primex_exception_handler(
    request: Request, exc: PrimeXException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "type": type(exc).__name__},
    )


async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = []
    for error in exc.errors():
        errors.append(
            {
                "field": ".".join(str(loc) for loc in error["loc"][1:]),
                "message": error["msg"],
                "type": error["type"],
            }
        )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors},
    )
