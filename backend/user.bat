echo import asyncio > list_users.py
echo from app.db.session import AsyncSessionLocal >> list_users.py
echo from app.models.models import User >> list_users.py
echo from sqlalchemy import select >> list_users.py
echo. >> list_users.py
echo async def run(): >> list_users.py
echo     async with AsyncSessionLocal() as db: >> list_users.py
echo         result = await db.execute(select(User)) >> list_users.py
echo         for u in result.scalars().all(): >> list_users.py
echo             print(u.email, u.username, u.is_admin) >> list_users.py
echo. >> list_users.py
echo asyncio.run(run()) >> list_users.py
python list_users.py