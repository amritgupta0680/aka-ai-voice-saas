import json
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.schema import Appointment


async def check_availability_in_db(tenant_id: str, date_time: str) -> str:
    """Checks if a given appointment slot is already booked for a tenant."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Appointment).where(
                Appointment.tenant_id == tenant_id,
                Appointment.appointment_time == date_time,
                Appointment.status == "Confirmed"
            )
        )
        existing = result.scalars().first()
        if existing:
            return json.dumps({
                "available": False, 
                "message": f"Slot {date_time} is already booked for patient {existing.patient_name}."
            })
        return json.dumps({"available": True, "message": f"Slot {date_time} is available."})


async def create_appointment_in_db(tenant_id: str, patient_name: str, service: str, date_time: str) -> str:
    """Checks slot availability first, and creates a new appointment record if available."""
    async with AsyncSessionLocal() as session:
        try:
            # 1. Check if the slot is already taken
            result = await session.execute(
                select(Appointment).where(
                    Appointment.tenant_id == tenant_id,
                    Appointment.appointment_time == date_time,
                    Appointment.status == "Confirmed"
                )
            )
            existing = result.scalars().first()
            
            if existing:
                print(f"[DB Action Conflict]: Slot '{date_time}' already booked for '{existing.patient_name}'")
                return json.dumps({
                    "status": "conflict",
                    "message": f"Slot {date_time} is already taken. Please ask the caller to choose a different time."
                })

            # 2. Insert new appointment if slot is open
            appointment = Appointment(
                tenant_id=tenant_id,
                patient_name=patient_name,
                service_type=service,
                appointment_time=date_time,
                status="Confirmed"
            )
            session.add(appointment)
            await session.commit()
            print(f"[DB Action Success]: Booked appointment for '{patient_name}' at '{date_time}'")
            return json.dumps({
                "status": "success",
                "appointment_id": appointment.id[:8].upper(),
                "message": f"Appointment successfully booked for {patient_name} on {date_time}."
            })

        except Exception as e:
            print(f"[DB Action Error]: {e}")
            return json.dumps({"status": "error", "message": "Failed to record appointment in database."})