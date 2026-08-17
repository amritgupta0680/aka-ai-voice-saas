import asyncio
from app.core.database import engine, Base, AsyncSessionLocal
from app.models.schema import Tenant, AIAgent
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def test_db_setup():
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully!")

    print("Seeding sample multi-tenant data...")
    async with AsyncSessionLocal() as session:
        # Create a sample company
        tenant = Tenant(company_name="Apex Dental Care")
        session.add(tenant)
        await session.flush()  # Gets the generated tenant.id

        # Create an AI Agent for Apex Dental
        agent = AIAgent(
            tenant_id=tenant.id,
            agent_name="Dr. Ava Receptionist",
            system_prompt="You are Dr. Ava, a friendly dental clinic receptionist answering inbound phone calls."
        )
        session.add(agent)
        await session.commit()

        # Query back using selectinload for async relationship loading
        stmt = select(Tenant).options(selectinload(Tenant.agents)).where(Tenant.id == tenant.id)
        result = await session.execute(stmt)
        saved_tenant = result.scalars().first()

        print(f"Verified DB Tenant: '{saved_tenant.company_name}' (ID: {saved_tenant.id})")
        if saved_tenant.agents:
            print(f"Attached Agent: '{saved_tenant.agents[0].agent_name}'")

if __name__ == "__main__":
    asyncio.run(test_db_setup())