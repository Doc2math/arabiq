from app.db.session import AsyncSessionLocal
from app.models.models import User
from app.core.security import hash_password
import asyncio, uuid
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        async with db.begin():
            result = await db.execute(select(User).where(User.email == 'admin@arabiq.com'))
            user = result.scalar_one_or_none()
            if user:
                user.hashed_password = hash_password('admin123')
                print('OK — mot de passe reinitialise')
            else:
                new_user = User(
                    id=uuid.uuid4(),
                    email='admin@arabiq.com',
                    username='admin',
                    hashed_password=hash_password('admin123'),
                    is_admin=True,
                    is_active=True,
                    is_verified=True,
                )
                db.add(new_user)
                print('OK — admin cree')

asyncio.run(main())