import os
import json
import shutil
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.api.websocket import router as websocket_router
from app.core.database import engine, Base, get_db, AsyncSessionLocal
from app.models.schema import Tenant, CallLog, Appointment
from app.rag.knowledge_base import KnowledgeBaseManager

# Pre-defined tenant IDs to seed into the database on startup
PREDEFINED_TENANTS = [
    {"id": "049e114f-e40a-4e2a-a3e8-07caa56a5ddd", "company_name": "Apex Dental Care"},
    {"id": "demo-restaurant-101", "company_name": "Pizza Palace Restaurant"},
    {"id": "law-firm-202", "company_name": "Justice & Associates Law"},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[Server Startup]: Database tables initialized successfully.")

    # Seed predefined Tenants if missing
    async with AsyncSessionLocal() as session:
        for tenant_info in PREDEFINED_TENANTS:
            result = await session.execute(
                select(Tenant).where(Tenant.id == tenant_info["id"])
            )
            existing_tenant = result.scalars().first()
            if not existing_tenant:
                tenant_obj = Tenant(
                    id=tenant_info["id"],
                    company_name=tenant_info["company_name"]
                )
                session.add(tenant_obj)
                print(f"[Server Startup]: Seeded tenant '{tenant_info['company_name']}' ({tenant_info['id']}).")
        await session.commit()

    yield

    # Shutdown
    await engine.dispose()
    print("[Server Shutdown]: Database engine closed.")


app = FastAPI(
    title="AI Voice Call Center Platform",
    version="1.0.0",
    description="Multi-tenant Autonomous Customer Operations & Call Center Platform",
    lifespan=lifespan
)

# Comprehensive CORS setup for Vercel production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include WebSocket router
app.include_router(websocket_router)


# --- REQUEST & RESPONSE SCHEMAS ---

class TextKnowledgePayload(BaseModel):
    content: str


class AppointmentStatusUpdate(BaseModel):
    status: str  # "Confirmed", "Completed", "Cancelled"


class OutboundCallTrigger(BaseModel):
    customer_name: str
    target_time: str
    service_type: str


# --- HEALTH CHECK ENDPOINT ---

@app.get("/")
async def root_health_check():
    return {"status": "online", "service": "AI Voice Operations Platform API"}


# --- KNOWLEDGE MANAGEMENT ENDPOINTS ---

@app.get("/api/tenants/{tenant_id}/knowledge/files")
async def get_tenant_knowledge_files(tenant_id: str):
    """Returns uploaded document metadata and vector store status for a tenant."""
    index_folder = os.path.join("data", "vector_stores", f"tenant_{tenant_id}")
    metadata_file = os.path.join(index_folder, "metadata.json")
    
    if not os.path.exists(index_folder):
        return {
            "has_index": False,
            "uploaded_documents": [],
            "message": "No vector knowledge base indexed for this tenant yet."
        }

    uploaded_sources = []
    if os.path.exists(metadata_file):
        try:
            with open(metadata_file, "r", encoding="utf-8") as f:
                uploaded_sources = json.load(f).get("sources", [])
        except Exception:
            uploaded_sources = ["Active Knowledge Index"]

    return {
        "has_index": True,
        "tenant_id": tenant_id,
        "index_path": index_folder,
        "uploaded_documents": uploaded_sources if uploaded_sources else ["Custom Index Loaded"],
        "message": "Active vector index loaded successfully."
    }


@app.post("/api/tenants/{tenant_id}/knowledge/upload")
async def upload_tenant_knowledge_file(tenant_id: str, file: UploadFile = File(...)):
    """Uploads a PDF/TXT document and builds/updates the custom vector index for a tenant."""
    try:
        file_bytes = await file.read()
        rag_manager = KnowledgeBaseManager(tenant_id)
        chunk_count = rag_manager.create_index_from_file(file_bytes, file.filename)
        
        return {
            "status": "success",
            "message": f"Successfully processed '{file.filename}' for tenant '{tenant_id}'.",
            "chunks_indexed": chunk_count
        }
    except Exception as e:
        print(f"[Upload Error]: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")


@app.post("/api/tenants/{tenant_id}/knowledge/text")
async def add_tenant_knowledge_text(tenant_id: str, payload: TextKnowledgePayload):
    """Indexes raw plain-text policy documents for a tenant."""
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")
    
    rag_manager = KnowledgeBaseManager(tenant_id)
    chunk_count = rag_manager.create_index_from_text(payload.content)
    
    return {
        "status": "success",
        "message": f"Successfully indexed text knowledge for tenant '{tenant_id}'.",
        "chunks_indexed": chunk_count
    }


@app.delete("/api/tenants/{tenant_id}/knowledge/reset")
async def reset_tenant_knowledge(tenant_id: str):
    """Deletes all indexed vector files and metadata for the given tenant."""
    index_folder = os.path.join("data", "vector_stores", f"tenant_{tenant_id}")
    if os.path.exists(index_folder):
        shutil.rmtree(index_folder)
        print(f"[Knowledge Reset]: Cleared index directory for tenant {tenant_id}")
        return {"status": "success", "message": "Knowledge base reset successfully."}
    return {"status": "noop", "message": "No knowledge index existed to delete."}


# --- REPORTING & CRM ENDPOINTS ---

@app.get("/api/logs")
async def get_call_logs(
    tenant_id: str = Query(..., description="Target tenant ID to fetch call logs for"), 
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all saved call logs strictly isolated by tenant ID."""
    result = await db.execute(
        select(CallLog).where(CallLog.tenant_id == tenant_id).order_by(CallLog.created_at.desc())
    )
    logs = result.scalars().all()
    
    return [
        {
            "id": log.id,
            "caller_id": log.caller_id,
            "duration_seconds": log.duration_seconds,
            "sentiment_score": log.sentiment_score,
            "intent_category": log.intent_category,
            "lead_score": log.lead_score,
            "summary": log.summary,
            "transcript": log.transcript,
            "created_at": log.created_at.isoformat() if log.created_at else ""
        }
        for log in logs
    ]


@app.get("/api/appointments")
async def get_tenant_appointments(
    tenant_id: str = Query(..., description="Target tenant ID to fetch booked appointments for"), 
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all confirmed appointments strictly isolated by tenant ID."""
    result = await db.execute(
        select(Appointment).where(Appointment.tenant_id == tenant_id).order_by(Appointment.created_at.desc())
    )
    appointments = result.scalars().all()
    
    return [
        {
            "id": appt.id[:8].upper() if appt.id else "APPT",
            "patient_name": appt.patient_name,
            "service_type": appt.service_type,
            "appointment_time": appt.appointment_time,
            "status": appt.status,
            "created_at": appt.created_at.isoformat() if appt.created_at else ""
        }
        for appt in appointments
    ]


@app.patch("/api/appointments/{appointment_id}")
async def update_appointment_status(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Updates the status of a booked appointment (e.g. Cancelled, Completed)."""
    result = await db.execute(
        select(Appointment).where(Appointment.id.like(f"{appointment_id.lower()}%"))
    )
    appointment = result.scalars().first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    appointment.status = payload.status
    await db.commit()
    print(f"[CRM Action]: Updated appointment '{appointment_id}' status to '{payload.status}'")

    return {
        "status": "success",
        "message": f"Appointment status updated to '{payload.status}'."
    }


@app.delete("/api/appointments/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Deletes an appointment record from the database."""
    result = await db.execute(
        select(Appointment).where(Appointment.id.like(f"{appointment_id.lower()}%"))
    )
    appointment = result.scalars().first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    await db.delete(appointment)
    await db.commit()
    print(f"[CRM Action]: Deleted appointment '{appointment_id}'")

    return {
        "status": "success",
        "message": "Appointment deleted successfully."
    }


@app.post("/api/tenants/{tenant_id}/outbound/trigger")
async def trigger_outbound_call(tenant_id: str, payload: OutboundCallTrigger):
    """Triggers an automated proactive outreach call to confirm an upcoming reservation or appointment."""
    opening_greeting = (
        f"Hello {payload.customer_name}! This is an automated reminder from your assistant regarding "
        f"your upcoming booking for {payload.service_type} scheduled for {payload.target_time}. "
        f"Are you still able to make this time, or would you like to make changes?"
    )
    return {
        "status": "initiated",
        "tenant_id": tenant_id,
        "initial_agent_speech": opening_greeting,
        "message": f"Outbound call dispatched for {payload.customer_name}."
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=["app"])