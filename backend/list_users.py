import asyncio 
from app.db.session import AsyncSessionLocal 
from app.models.models import User 
from sqlalchemy import select 
 
async def run(): 
    async with AsyncSessionLocal() as db: 
        result = await db.execute(select(User)) 
        for u in result.scalars().all(): 
            print(u.email, u.username, u.is_admin) 
 
asyncio.run(run()) 
