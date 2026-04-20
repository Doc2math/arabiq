@echo off
echo Creation de la structure du projet Langdad...

cd /d "%~dp0"

REM ── app routes ────────────────────────────────────────────────
mkdir src\app\(auth)\login
mkdir src\app\(auth)\register
mkdir src\app\(dashboard)\dashboard
mkdir src\app\(dashboard)\module\[id]
mkdir src\app\(dashboard)\lesson\[id]
mkdir src\app\(dashboard)\module-report\[id]

REM ── components ────────────────────────────────────────────────
mkdir src\components\ui
mkdir src\components\lesson
mkdir src\components\layout

REM ── lib ───────────────────────────────────────────────────────
mkdir src\lib

REM ── store ─────────────────────────────────────────────────────
mkdir src\store

REM ── types ─────────────────────────────────────────────────────
mkdir src\types

REM ── hooks ─────────────────────────────────────────────────────
mkdir src\hooks

REM ── Fichiers de base ──────────────────────────────────────────

REM types/index.ts
echo export {} > src\types\index.ts

REM lib/api.ts
echo import axios from 'axios'; > src\lib\api.ts
echo. >> src\lib\api.ts
echo export const api = axios.create({ >> src\lib\api.ts
echo   baseURL: process.env.NEXT_PUBLIC_API_URL ^|^| 'http://localhost:8000', >> src\lib\api.ts
echo   headers: { 'Content-Type': 'application/json' }, >> src\lib\api.ts
echo }); >> src\lib\api.ts

REM store/authStore.ts
echo import { create } from 'zustand'; > src\store\authStore.ts
echo export const useAuthStore = create^(^(set^) =^> ^({}^)^); >> src\store\authStore.ts

REM Pages vides
echo export default function LoginPage() { return null; } > src\app\(auth)\login\page.tsx
echo export default function RegisterPage() { return null; } > src\app\(auth)\register\page.tsx
echo export default function DashboardPage() { return null; } > src\app\(dashboard)\dashboard\page.tsx
echo export default function ModulePage() { return null; } > "src\app\(dashboard)\module\[id]\page.tsx"
echo export default function LessonPage() { return null; } > "src\app\(dashboard)\lesson\[id]\page.tsx"
echo export default function ModuleReportPage() { return null; } > "src\app\(dashboard)\module-report\[id]\page.tsx"

REM .env.local
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

echo.
echo [OK] Structure creee avec succes !
echo.
echo Prochaine etape : npm run dev
pause