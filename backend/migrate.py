import asyncio
from app.db.session import engine
from app.models.models import Base

async def migrate():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("OK — tables créées")

asyncio.run(migrate())