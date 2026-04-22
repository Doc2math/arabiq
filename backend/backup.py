import subprocess
from datetime import datetime
import os

def backup():
    os.makedirs("backups", exist_ok=True)
    date = datetime.now().strftime("%Y-%m-%d_%H-%M")
    filename = f"backups/backup_{date}.sql"
    subprocess.run([
        "pg_dump", "-U", "arabiq", "arabiq_platform", "-f", filename
    ])
    print(f"✓ Backup créé : {filename}")

if __name__ == "__main__":
    backup()