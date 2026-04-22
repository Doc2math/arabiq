import asyncio
import asyncpg

async def test():
    conn = await asyncpg.connect(
        "postgresql://arabiq:arabiq2024@localhost:5432/arabiq_platform"
    )
    result = await conn.fetchval("SELECT 1")
    print(f"OK: {result}")
    await conn.close()

asyncio.run(test())