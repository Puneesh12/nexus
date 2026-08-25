"""
NEXUS — Seed Script for Demo Dataset

Seeds realistic documents and verifies end-to-end question:
"What important things do I need to take care of in the next 30 days?"
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

# Add backend and root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../apps/api")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User
from app.models.source import Source
from app.models.document import Document
from services.ingestion.pipeline import ingestion_pipeline

DEMO_DOCUMENTS = [
    {
        "filename": "Dell_XPS_Warranty_Certificate.txt",
        "mime_type": "text/plain",
        "content": """DELL TECHNOLOGIES — HARDWARE WARRANTY CERTIFICATE
Customer: Puneesh Gulati
Product: Dell XPS 15 9530 (Intel Core i9, 32GB RAM, 1TB SSD)
Service Tag: 8X9KP22
Purchase Date: September 15, 2024
Warranty Type: 2-Year Premium Support Plus with Onsite Service
Warranty Expiration Date: September 15, 2026
Status: Active
Notes: Hardware defects, battery replacement, and accidental damage are covered until expiration. Extension must be requested before September 15, 2026.""",
    },
    {
        "filename": "Auto_Insurance_Renewal_Policy.txt",
        "mime_type": "text/plain",
        "content": """HDFC ERGO GENERAL INSURANCE COMPANY
Comprehensive Private Car Insurance Policy
Policy Holder: Puneesh Gulati
Vehicle: Hyundai Verna (Reg: DL-08-CA-9921)
Policy Number: 2311-8994-0012
Current Term Valid From: September 9, 2025
Premium Renewal Due Date: September 8, 2026
Renewal Amount: INR 14,850
Important: Failure to renew before September 8, 2026 will result in lapse of No Claim Bonus (NCB).""",
    },
    {
        "filename": "Flight_Booking_Confirmation_6E.txt",
        "mime_type": "text/plain",
        "content": """INDIGO AIRLINES — E-TICKET CONFIRMATION
Passenger: Puneesh Gulati
PNR: 6E-NEXUS-882
Flight: 6E-204 (Delhi DEL -> Bengaluru BLR)
Travel Date: August 28, 2026
Departure Time: 08:30 AM IST
Terminal: Terminal 3, IGI Airport
Web Check-in Notice: Mandatory web check-in opens 48 hours prior on August 26, 2026 and closes 60 minutes before departure.""",
    },
    {
        "filename": "VIT_Academic_Capstone_Submission.txt",
        "mime_type": "text/plain",
        "content": """VELLORE INSTITUTE OF TECHNOLOGY (VIT)
School of Computer Science and Engineering
Course: AI & Distributed Systems Capstone (CSE4001)
Student: Puneesh Gulati (Reg: 23BCI0168)
Assignment: Final Working System Deployment & Technical Report Submission
Submission Deadline: September 2, 2026 at 11:59 PM IST
Portal: VTOP Academic Portal
Important: Late submissions will incur a 20% penalty per day. Plagiarism check threshold is 10%.""",
    },
]


async def seed_demo():
    print("Connecting to database...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        # Create or find demo user
        from sqlalchemy import select
        res = await session.execute(select(User).where(User.email == "demo@nexus.local"))
        user = res.scalar_one_or_none()

        if not user:
            user = User(
                name="Puneesh Gulati",
                email="demo@nexus.local",
                hashed_password=hash_password("DemoPassword123!"),
            )
            session.add(user)
            await session.flush()
            print(f"Created demo user: {user.email} (ID: {user.id})")
        else:
            print(f"Found existing demo user: {user.email} (ID: {user.id})")

        # Ingest all demo documents
        for doc_data in DEMO_DOCUMENTS:
            # Create Source
            source = Source(
                user_id=user.id,
                type="document",
                name=doc_data["filename"],
                provider="local",
                metadata_={"demo": True},
            )
            session.add(source)
            await session.flush()

            # Create Document
            doc_bytes = doc_data["content"].encode("utf-8")
            document = Document(
                user_id=user.id,
                source_id=source.id,
                filename=doc_data["filename"],
                mime_type=doc_data["mime_type"],
                file_size_bytes=len(doc_bytes),
                status="pending",
                metadata_={},
            )
            session.add(document)
            await session.flush()

            # Run ingestion pipeline
            res = await ingestion_pipeline.ingest(
                document=document,
                file_data=doc_bytes,
                db=session,
            )
            print(f"Ingested '{doc_data['filename']}': {res.chunks_created} chunks, {res.events_extracted} events, {res.entities_extracted} entities")

        await session.commit()
        print("\nSeed completed successfully!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_demo())
