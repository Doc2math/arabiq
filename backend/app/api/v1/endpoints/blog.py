# ── backend/app/api/v1/endpoints/blog.py ─────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid, re, os, json, shutil
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from app.db.session import get_db
from app.models.models import User, BlogPost
from app.api.deps import get_current_user

router = APIRouter(tags=["blog"])

LANGS = ["fr", "en", "es", "de", "nl"]
UPLOAD_DIR = Path("uploads/blog")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ─── Schémas ──────────────────────────────────────────────────────────────────

class PostCreate(BaseModel):
    title_fr:   str
    excerpt_fr: str
    content_fr: str
    category:   str = "Actualités"
    emoji:      str = "📝"
    color:      str = "#6C3FC5"
    image_url:  Optional[str] = None
    featured:   bool = False
    published:  bool = False

class PostUpdate(BaseModel):
    title_fr:   Optional[str] = None
    excerpt_fr: Optional[str] = None
    content_fr: Optional[str] = None
    # Corrections manuelles par langue
    title:      Optional[dict] = None
    excerpt:    Optional[dict] = None
    content:    Optional[dict] = None
    category:   Optional[str] = None
    emoji:      Optional[str] = None
    color:      Optional[str] = None
    image_url:  Optional[str] = None
    featured:   Optional[bool] = None
    published:  Optional[bool] = None


# ─── Utilitaires ──────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = text.lower().strip()
    for src, dst in [('àáâãäå','a'),('èéêë','e'),('ìíîï','i'),('òóôõö','o'),('ùúûü','u'),('ç','c')]:
        for c in src: text = text.replace(c, dst)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')

def estimate_read_time(content: str) -> int:
    return max(1, round(len(content.split()) / 200))

def get_field(field: dict, lang: str) -> str:
    return field.get(lang) or field.get("fr") or ""

def post_to_dict(post: BlogPost, author_name: str, lang: str = "fr") -> dict:
    return {
        "id":               str(post.id),
        "slug":             post.slug,
        "title":            get_field(post.title, lang),
        "excerpt":          get_field(post.excerpt, lang),
        "content":          get_field(post.content, lang),
        "title_all":        post.title,
        "excerpt_all":      post.excerpt,
        "content_all":      post.content,
        "category":         post.category,
        "emoji":            post.emoji,
        "color":            post.color,
        "image_url":        post.image_url,
        "featured":         post.featured,
        "published":        post.published,
        "translated_langs": post.translated_langs or [],
        "author_name":      author_name,
        "created_at":       post.created_at,
        "updated_at":       post.updated_at,
        "read_time":        estimate_read_time(get_field(post.content, lang)),
    }

async def get_unique_slug(db: AsyncSession, base_slug: str) -> str:
    slug = base_slug
    i = 1
    while True:
        existing = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
        if not existing.scalar_one_or_none():
            return slug
        slug = f"{base_slug}-{i}"
        i += 1


# ─── Traduction GPT ───────────────────────────────────────────────────────────

async def translate_with_gpt(text: str, target_lang: str, field_type: str) -> str:
    """Traduit un texte vers la langue cible via GPT-4o-mini."""
    from openai import AsyncOpenAI
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        return text

    lang_names = {"en": "English", "es": "Spanish", "de": "German", "nl": "Dutch"}
    lang_name = lang_names.get(target_lang, target_lang)

    instructions = {
        "title":   "Translate this blog article title. Keep it concise and impactful.",
        "excerpt": "Translate this blog article excerpt. Keep the same tone and length.",
        "content": "Translate this blog article content written in Markdown. Preserve all Markdown formatting (##, **, *, >, -, etc.). Do not add or remove formatting.",
    }
    instruction = instructions.get(field_type, "Translate this text.")

    client = AsyncOpenAI(api_key=key)
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=4000,
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": f"You are a professional translator specializing in educational content about Arabic language learning. {instruction} Translate from French to {lang_name}. Return ONLY the translated text, nothing else."
            },
            {"role": "user", "content": text}
        ]
    )
    return response.choices[0].message.content.strip()


# ─── Auth admin ───────────────────────────────────────────────────────────────

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    return current_user


# ─── Routes publiques ─────────────────────────────────────────────────────────

@router.get("/blog/posts")
async def list_posts(
    lang:     str = Query("fr"),
    category: Optional[str] = Query(None),
    search:   Optional[str] = Query(None),
    limit:    int = Query(20, ge=1, le=100),
    offset:   int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    q = select(BlogPost).where(BlogPost.published == True).order_by(desc(BlogPost.created_at))
    if category:
        q = q.where(BlogPost.category == category)
    q = q.offset(offset).limit(limit)
    result = await db.execute(q)
    posts = result.scalars().all()

    out = []
    for p in posts:
        # Filtre recherche côté Python (JSON)
        if search:
            title = get_field(p.title, lang).lower()
            excerpt = get_field(p.excerpt, lang).lower()
            if search.lower() not in title and search.lower() not in excerpt:
                continue
        author = await db.get(User, p.author_id)
        out.append(post_to_dict(p, author.username if author else "LangDad", lang))
    return out


@router.get("/blog/posts/{slug}")
async def get_post(
    slug: str,
    lang: str = Query("fr"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BlogPost).where(BlogPost.slug == slug, BlogPost.published == True)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Article introuvable.")
    author = await db.get(User, post.author_id)
    return post_to_dict(post, author.username if author else "LangDad", lang)


# ─── Routes admin ─────────────────────────────────────────────────────────────

@router.get("/admin/blog/posts")
async def admin_list_posts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(select(BlogPost).order_by(desc(BlogPost.created_at)))
    posts = result.scalars().all()
    out = []
    for p in posts:
        author = await db.get(User, p.author_id)
        out.append(post_to_dict(p, author.username if author else "LangDad", "fr"))
    return out


@router.post("/admin/blog/posts", status_code=201)
async def create_post(
    body: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    slug = await get_unique_slug(db, slugify(body.title_fr))
    now = datetime.now(timezone.utc)

    post = BlogPost(
        id=str(uuid.uuid4()),
        slug=slug,
        title={"fr": body.title_fr},
        excerpt={"fr": body.excerpt_fr},
        content={"fr": body.content_fr},
        category=body.category,
        emoji=body.emoji,
        color=body.color,
        image_url=body.image_url,
        featured=body.featured,
        published=body.published,
        translated_langs=[],
        author_id=current_user.id,
        created_at=now,
        updated_at=now,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post_to_dict(post, current_user.username, "fr")


@router.put("/admin/blog/posts/{post_id}")
async def update_post(
    post_id: str,
    body: PostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    post = await db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Article introuvable.")

    # Mise à jour du contenu français
    if body.title_fr is not None:
        post.title = {**post.title, "fr": body.title_fr}
        post.slug = await get_unique_slug(db, slugify(body.title_fr))
    if body.excerpt_fr is not None:
        post.excerpt = {**post.excerpt, "fr": body.excerpt_fr}
    if body.content_fr is not None:
        post.content = {**post.content, "fr": body.content_fr}

    # Corrections manuelles multilingues
    if body.title   is not None: post.title   = {**post.title,   **body.title}
    if body.excerpt is not None: post.excerpt = {**post.excerpt, **body.excerpt}
    if body.content is not None: post.content = {**post.content, **body.content}

    if body.category  is not None: post.category  = body.category
    if body.emoji     is not None: post.emoji     = body.emoji
    if body.color     is not None: post.color     = body.color
    if body.image_url is not None: post.image_url = body.image_url
    if body.featured  is not None: post.featured  = body.featured
    if body.published is not None: post.published = body.published

    post.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(post)
    author = await db.get(User, post.author_id)
    return post_to_dict(post, author.username if author else "LangDad", "fr")


@router.post("/admin/blog/posts/{post_id}/translate")
async def translate_post(
    post_id: str,
    langs: list[str] = Query(default=["en", "es", "de", "nl"]),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Traduit l'article depuis le français vers les langues demandées via GPT."""
    post = await db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Article introuvable.")

    fr_title   = post.title.get("fr", "")
    fr_excerpt = post.excerpt.get("fr", "")
    fr_content = post.content.get("fr", "")

    if not fr_title or not fr_content:
        raise HTTPException(status_code=400, detail="Le contenu français est requis avant de traduire.")

    new_title   = dict(post.title)
    new_excerpt = dict(post.excerpt)
    new_content = dict(post.content)
    translated  = list(post.translated_langs or [])

    for lang in langs:
        if lang == "fr" or lang not in LANGS:
            continue
        new_title[lang]   = await translate_with_gpt(fr_title,   lang, "title")
        new_excerpt[lang] = await translate_with_gpt(fr_excerpt,  lang, "excerpt")
        new_content[lang] = await translate_with_gpt(fr_content,  lang, "content")
        if lang not in translated:
            translated.append(lang)

    post.title            = new_title
    post.excerpt          = new_excerpt
    post.content          = new_content
    post.translated_langs = translated
    post.updated_at       = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(post)
    author = await db.get(User, post.author_id)
    return post_to_dict(post, author.username if author else "LangDad", "fr")


@router.post("/admin/blog/posts/{post_id}/image")
async def upload_image(
    post_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Upload une image pour un article."""
    post = await db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Article introuvable.")

    # Validation
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Format non supporté. Utilisez JPEG, PNG ou WebP.")

    # Taille max 5MB
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image trop lourde (max 5MB).")

    # Sauvegarder
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{post_id}.{ext}"
    filepath = UPLOAD_DIR / filename

    with open(filepath, "wb") as f:
        f.write(content)

    # Mettre à jour l'URL
    image_url = f"/uploads/blog/{filename}"
    post.image_url = image_url
    post.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {"image_url": image_url}


@router.delete("/admin/blog/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    post = await db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Article introuvable.")

    # Supprimer l'image si elle existe
    if post.image_url:
        img_path = Path(post.image_url.lstrip("/"))
        if img_path.exists():
            img_path.unlink()

    await db.delete(post)
    await db.commit()