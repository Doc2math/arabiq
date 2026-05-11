"""
Endpoints Institution — app/api/v1/endpoints/institution.py
Gestion des institutions (écoles, profs) et de leurs élèves.
"""
import uuid
import re
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.security import hash_password
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.models import User, Institution, InstitutionMember, LessonProgress, ExerciseLog

router = APIRouter(prefix="/institution", tags=["institution"])

# ── Plans disponibles ─────────────────────────────────────────
PLANS = {
    "starter": {"max_students": 100,  "label": "Starter"},
    "medium":  {"max_students": 200,  "label": "Medium"},
    "school":  {"max_students": 500,  "label": "School"},
    "premium": {"max_students": 1000, "label": "Premium"},
}

def utcnow():
    return datetime.now(timezone.utc)

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text[:80]


# ── Schémas ───────────────────────────────────────────────────
class InstitutionCreate(BaseModel):
    name: str
    institution_type: str = "school"  # "school" | "teacher" | "center"
    plan: str = "starter"
    country: Optional[str] = None
    city: Optional[str] = None
    contact_email: Optional[str] = None
    website: Optional[str] = None

class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    contact_email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None

class StudentInvite(BaseModel):
    email: str
    username: str
    password: str
    group_name: Optional[str] = None

class StudentUpdate(BaseModel):
    group_name: Optional[str] = None
    is_active: Optional[bool] = None

class InstitutionOut(BaseModel):
    id: str
    name: str
    slug: str
    institution_type: str
    plan: str
    max_students: int
    subscription_status: str
    country: Optional[str]
    city: Optional[str]
    contact_email: Optional[str]
    website: Optional[str]
    logo_url: Optional[str]
    is_active: bool
    created_at: datetime
    student_count: int = 0

class StudentOut(BaseModel):
    id: str
    username: str
    email: str
    xp: int
    level: int
    is_active: bool
    group_name: Optional[str]
    joined_at: datetime


# ── Helpers ───────────────────────────────────────────────────
async def get_institution_or_403(
    current_user: User,
    db: AsyncSession,
) -> Institution:
    """Récupère l'institution de l'utilisateur courant."""
    if current_user.role not in ("institution_admin", "superadmin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès réservé aux institutions")
    if current_user.role == "superadmin":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Spécifiez l'institution via /institution/{id}")

    result = await db.execute(
        select(Institution).where(Institution.owner_id == current_user.id)
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution introuvable")
    return inst


# ── Endpoints ─────────────────────────────────────────────────

@router.post("/create", status_code=201)
async def create_institution(
    payload: InstitutionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Créer une institution. Accessible à tout utilisateur vérifié."""
    # Vérifier que l'utilisateur n'a pas déjà une institution
    existing = await db.execute(
        select(Institution).where(Institution.owner_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Vous avez déjà une institution")

    if payload.plan not in PLANS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Plan invalide. Choisissez parmi: {list(PLANS.keys())}")

    # Générer un slug unique
    base_slug = slugify(payload.name)
    slug = base_slug
    counter = 1
    while True:
        exists = await db.execute(select(Institution).where(Institution.slug == slug))
        if not exists.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    institution = Institution(
        name=payload.name,
        slug=slug,
        institution_type=payload.institution_type,
        plan=payload.plan,
        max_students=PLANS[payload.plan]["max_students"],
        country=payload.country,
        city=payload.city,
        contact_email=payload.contact_email,
        website=payload.website,
        owner_id=current_user.id,
        subscription_status="trial",
        trial_ends_at=utcnow() + timedelta(days=30),
    )
    db.add(institution)

    # Promouvoir l'utilisateur en institution_admin
    current_user.role = "institution_admin"
    current_user.institution_id = institution.id

    await db.commit()
    await db.refresh(institution)

    return {
        "message": "Institution créée avec succès",
        "institution_id": str(institution.id),
        "slug": institution.slug,
        "trial_ends_at": institution.trial_ends_at,
    }


@router.get("/me")
async def get_my_institution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère l'institution de l'utilisateur connecté."""
    result = await db.execute(
        select(Institution).where(Institution.owner_id == current_user.id)
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Aucune institution trouvée")

    # Compter les élèves
    count_result = await db.execute(
        select(func.count(InstitutionMember.id))
        .where(
            InstitutionMember.institution_id == inst.id,
            InstitutionMember.is_active == True,
        )
    )
    student_count = count_result.scalar() or 0

    return {
        "id": str(inst.id),
        "name": inst.name,
        "slug": inst.slug,
        "institution_type": inst.institution_type,
        "plan": inst.plan,
        "max_students": inst.max_students,
        "student_count": student_count,
        "subscription_status": inst.subscription_status,
        "trial_ends_at": inst.trial_ends_at,
        "subscription_ends_at": inst.subscription_ends_at,
        "country": inst.country,
        "city": inst.city,
        "contact_email": inst.contact_email,
        "website": inst.website,
        "logo_url": inst.logo_url,
        "is_active": inst.is_active,
        "created_at": inst.created_at,
    }


@router.put("/me")
async def update_my_institution(
    payload: InstitutionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mettre à jour les infos de l'institution."""
    result = await db.execute(
        select(Institution).where(Institution.owner_id == current_user.id)
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution introuvable")

    if payload.name is not None:        inst.name = payload.name
    if payload.country is not None:     inst.country = payload.country
    if payload.city is not None:        inst.city = payload.city
    if payload.contact_email is not None: inst.contact_email = payload.contact_email
    if payload.website is not None:     inst.website = payload.website
    if payload.logo_url is not None:    inst.logo_url = payload.logo_url

    await db.commit()
    return {"message": "Institution mise à jour"}


# ── Gestion des élèves ────────────────────────────────────────

@router.get("/students")
async def list_students(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liste tous les élèves de l'institution."""
    result = await db.execute(
        select(Institution).where(Institution.owner_id == current_user.id)
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution introuvable")

    members_result = await db.execute(
        select(InstitutionMember, User)
        .join(User, InstitutionMember.user_id == User.id)
        .where(InstitutionMember.institution_id == inst.id)
        .order_by(InstitutionMember.joined_at.desc())
    )
    members = members_result.all()

    return [
        {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "xp": user.xp,
            "level": user.level,
            "streak": user.streak,
            "is_active": member.is_active,
            "group_name": member.group_name,
            "joined_at": member.joined_at,
            "role": member.role,
        }
        for member, user in members
    ]


@router.post("/students/invite", status_code=201)
async def invite_student(
    payload: StudentInvite,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Créer un compte élève et l'ajouter à l'institution."""
    result = await db.execute(
        select(Institution).where(Institution.owner_id == current_user.id)
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution introuvable")

    # Vérifier la limite du plan
    count_result = await db.execute(
        select(func.count(InstitutionMember.id))
        .where(
            InstitutionMember.institution_id == inst.id,
            InstitutionMember.is_active == True,
        )
    )
    current_count = count_result.scalar() or 0
    if current_count >= inst.max_students:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Limite atteinte ({inst.max_students} élèves max pour le plan {inst.plan})"
        )

    # Vérifier email/username unique
    existing_email = await db.execute(select(User).where(User.email == payload.email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email déjà utilisé")

    existing_username = await db.execute(select(User).where(User.username == payload.username))
    if existing_username.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nom d'utilisateur déjà utilisé")

    # Créer le compte élève
   
    new_user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        role="student",
        institution_id=inst.id,
        is_active=True,
        is_verified=True,  # Vérifié automatiquement via institution
    )
    db.add(new_user)
    await db.flush()

    # Créer le lien institution
    member = InstitutionMember(
        institution_id=inst.id,
        user_id=new_user.id,
        role="student",
        group_name=payload.group_name,
    )
    db.add(member)
    await db.commit()

    return {
        "message": "Élève créé avec succès",
        "user_id": str(new_user.id),
        "username": new_user.username,
    }


@router.put("/students/{user_id}")
async def update_student(
    user_id: uuid.UUID,
    payload: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Modifier un élève (groupe, statut actif)."""
    result = await db.execute(
        select(Institution).where(Institution.owner_id == current_user.id)
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution introuvable")

    member_result = await db.execute(
        select(InstitutionMember)
        .where(
            InstitutionMember.institution_id == inst.id,
            InstitutionMember.user_id == user_id,
        )
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Élève introuvable")

    if payload.group_name is not None: member.group_name = payload.group_name
    if payload.is_active is not None:
        member.is_active = payload.is_active
        # Désactiver aussi le compte user si nécessaire
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if user:
            user.is_active = payload.is_active

    await db.commit()
    return {"message": "Élève mis à jour"}


@router.delete("/students/{user_id}")
async def remove_student(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retirer un élève de l'institution."""
    result = await db.execute(
        select(Institution).where(Institution.owner_id == current_user.id)
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution introuvable")

    member_result = await db.execute(
        select(InstitutionMember)
        .where(
            InstitutionMember.institution_id == inst.id,
            InstitutionMember.user_id == user_id,
        )
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Élève introuvable")

    await db.delete(member)

    # Retirer l'institution_id du user
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.institution_id = None

    await db.commit()
    return {"message": "Élève retiré de l'institution"}


# ── Stats classe ──────────────────────────────────────────────

@router.get("/stats")
async def get_institution_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stats globales de l'institution."""
    result = await db.execute(
        select(Institution).where(Institution.owner_id == current_user.id)
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution introuvable")

    # Tous les membres
    members_result = await db.execute(
        select(InstitutionMember, User)
        .join(User, InstitutionMember.user_id == User.id)
        .where(InstitutionMember.institution_id == inst.id)
    )
    members = members_result.all()

    user_ids = [user.id for _, user in members]
    total_students = len(user_ids)
    active_students = sum(1 for m, _ in members if m.is_active)

    # XP moyen
    avg_xp = sum(user.xp for _, user in members) / max(total_students, 1)

    # Progression moyenne
    avg_score = 0.0
    if user_ids:
        prog_result = await db.execute(
            select(func.avg(LessonProgress.score))
            .where(LessonProgress.user_id.in_(user_ids))
        )
        avg_score = prog_result.scalar() or 0.0

    return {
        "institution_name": inst.name,
        "plan": inst.plan,
        "max_students": inst.max_students,
        "total_students": total_students,
        "active_students": active_students,
        "avg_xp": round(avg_xp, 1),
        "avg_score": round(float(avg_score) * 100, 1),
        "subscription_status": inst.subscription_status,
        "trial_ends_at": inst.trial_ends_at,
    }


@router.get("/students/{user_id}/progress")
async def get_student_progress(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Institution).where(Institution.owner_id == current_user.id)
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution introuvable")

    member_result = await db.execute(
        select(InstitutionMember)
        .where(
            InstitutionMember.institution_id == inst.id,
            InstitutionMember.user_id == user_id,
        )
    )
    if not member_result.scalar_one_or_none():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Élève introuvable")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    # Progressions par leçon
    prog_result = await db.execute(
        select(LessonProgress)
        .where(LessonProgress.user_id == user_id)
        .order_by(LessonProgress.completed_at.desc())
    )
    progressions = prog_result.scalars().all()

    # Logs exercices pour BKT par compétence
    logs_result = await db.execute(
        select(ExerciseLog)
        .where(ExerciseLog.user_id == user_id)
        .order_by(ExerciseLog.created_at)
    )
    logs = logs_result.scalars().all()

    # Calcul BKT par compétence
    from app.api.v1.endpoints.bkt import BKT_PARAMS, DEFAULT_PARAMS, SKILL_NAMES, bkt_update

    skill_data: dict = {}
    for log in logs:
        sid = log.skill_id
        if sid not in skill_data:
            params = BKT_PARAMS.get(sid, DEFAULT_PARAMS)
            skill_data[sid] = {
                "mastery":   params["L0"],
                "attempts":  0,
                "correct":   0,
                "params":    params,
            }
        d = skill_data[sid]
        d["mastery"]  = bkt_update(d["mastery"], log.correct, d["params"])
        d["attempts"] += 1
        d["correct"]  += 1 if log.correct else 0

    # Classer les compétences
    mastered    = []
    in_progress = []
    weak        = []

    for sid, d in skill_data.items():
        mastery      = round(d["mastery"] * 100, 1)
        success_rate = round(d["correct"] / max(d["attempts"], 1) * 100, 1)
        entry = {
            "skill_id":    sid,
            "skill_name":  SKILL_NAMES.get(sid, sid),
            "mastery":     mastery,
            "success_rate":success_rate,
            "attempts":    d["attempts"],
            "correct":     d["correct"],
        }
        if mastery >= 80:
            mastered.append(entry)
        elif mastery >= 50:
            in_progress.append(entry)
        else:
            weak.append(entry)

    # Modules complétés
    lesson_ids = [p.lesson_id for p in progressions]
    modules_progress = {}
    if lesson_ids:
        from app.models.models import Lesson, Course, Module as ModuleModel
        lessons_result = await db.execute(
            select(Lesson, Course, ModuleModel)
            .join(Course, Lesson.course_id == Course.id)
            .join(ModuleModel, Course.module_id == ModuleModel.id)
            .where(Lesson.id.in_(lesson_ids))
        )
        for lesson, course, module in lessons_result.all():
            mid = module.id
            if mid not in modules_progress:
                modules_progress[mid] = {
                    "module_id":    mid,
                    "module_title": module.title,
                    "lessons":      [],
                    "avg_score":    0,
                }
            prog = next((p for p in progressions if p.lesson_id == lesson.id), None)
            if prog:
                modules_progress[mid]["lessons"].append({
                    "lesson_id":    lesson.id,
                    "lesson_title": lesson.title,
                    "lesson_type":  lesson.lesson_type,
                    "score":        round(prog.score * 100, 1),
                    "xp_earned":    prog.xp_earned,
                    "completed_at": prog.completed_at.isoformat(),
                })

        for mid, mp in modules_progress.items():
            scores = [l["score"] for l in mp["lessons"]]
            mp["avg_score"] = round(sum(scores) / max(len(scores), 1), 1)

    # Points forts / faibles
    strengths = [s["skill_name"] for s in sorted(mastered, key=lambda x: -x["mastery"])[:3]]
    weaknesses = [s["skill_name"] for s in sorted(weak, key=lambda x: x["mastery"])[:3]]

    return {
        "user": {
            "id":       str(user.id),
            "username": user.username,
            "email":    user.email,
            "xp":       user.xp,
            "level":    user.level,
            "streak":   user.streak,
        },
        "summary": {
            "lessons_completed": len(progressions),
            "avg_score":         round(sum(p.score for p in progressions) / max(len(progressions), 1) * 100, 1),
            "total_xp":          sum(p.xp_earned for p in progressions),
            "total_attempts":    len(logs),
            "overall_success":   round(sum(1 for l in logs if l.correct) / max(len(logs), 1) * 100, 1),
        },
        "skills": {
            "mastered":    mastered,
            "in_progress": in_progress,
            "weak":        weak,
        },
        "modules":    list(modules_progress.values()),
        "strengths":  strengths,
        "weaknesses": weaknesses,
        "progressions": [
            {
                "lesson_id":    p.lesson_id,
                "score":        round(p.score * 100, 1),
                "xp_earned":    p.xp_earned,
                "attempts":     p.attempts,
                "completed_at": p.completed_at.isoformat(),
            }
            for p in progressions[:20]
        ],
    }