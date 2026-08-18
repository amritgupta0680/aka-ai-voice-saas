import os
from urllib.parse import urlsplit, urlunsplit
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

connect_args = {}

if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
else:
    # 1. Normalize driver prefix for asyncpg
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

    # 2. Strip libpq query parameters (sslmode, channel_binding, etc.) to prevent asyncpg keyword errors
    parsed = urlsplit(DATABASE_URL)
    DATABASE_URL = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))

    # 3. Supply SSL flag directly to asyncpg
    connect_args = {"ssl": True}

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()