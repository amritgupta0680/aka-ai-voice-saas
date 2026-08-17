import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Tenant(Base):
    """Represents a client company (e.g., Dental Clinic, Restaurant)."""
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    agents: Mapped[List["AIAgent"]] = relationship("AIAgent", back_populates="tenant", cascade="all, delete-orphan")
    call_logs: Mapped[List["CallLog"]] = relationship("CallLog", back_populates="tenant", cascade="all, delete-orphan")
    appointments: Mapped[List["Appointment"]] = relationship("Appointment", back_populates="tenant", cascade="all, delete-orphan")


class AIAgent(Base):
    """Configuration for an AI agent belonging to a specific company."""
    __tablename__ = "ai_agents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), nullable=False)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    voice_id: Mapped[str] = mapped_column(String(50), default="en-US-AriaNeural")
    knowledge_base_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="agents")
    call_logs: Mapped[List["CallLog"]] = relationship("CallLog", back_populates="agent")


class CallLog(Base):
    """Logs analytics, sentiment, and transcript for every call session."""
    __tablename__ = "call_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), nullable=False)
    agent_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("ai_agents.id"), nullable=True)
    caller_id: Mapped[str] = mapped_column(String(50), default="Web Demo Client")
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    transcript: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # JSON array of dialogue turns
    sentiment_score: Mapped[float] = mapped_column(Float, default=0.0)  # -1.0 (Negative) to +1.0 (Positive)
    intent_category: Mapped[str] = mapped_column(String(100), default="General Inquiry")
    lead_score: Mapped[int] = mapped_column(Integer, default=0)  # 0 to 100
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="call_logs")
    agent: Mapped[Optional["AIAgent"]] = relationship("AIAgent", back_populates="call_logs")


class Appointment(Base):
    """Stores booked appointments made by callers via the AI Voice Agent."""
    __tablename__ = "appointments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), nullable=False)
    patient_name: Mapped[str] = mapped_column(String(100), nullable=False)
    service_type: Mapped[str] = mapped_column(String(100), nullable=False)
    appointment_time: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Confirmed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="appointments")