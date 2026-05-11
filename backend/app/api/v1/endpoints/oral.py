from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI
from datetime import datetime, timezone
import tempfile, os, io, json
from dotenv import load_dotenv
from app.db.session import get_db
from app.models.models import User
from app.api.deps import get_current_user

load_dotenv()

router = APIRouter(prefix="/oral", tags=["oral"])

QUOTA_FREE    = 0
QUOTA_PREMIUM = 200

LANG_NAMES = {
    "fr": "français",
    "en": "English",
    "es": "español",
    "de": "Deutsch",
    "nl": "Nederlands",
}

# ─── Constantes phonétiques ───────────────────────────────────────────────────

HARAKAT = "\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\u0653\u0654\u0655\u0656\u0657\u0658\u0670"
TATWEEL = "\u0640"

LONG_TO_SHORT = {
    "\u0627": "\u064E",
    "\u0648": "\u064F",
    "\u064A": "\u0650",
}

VOYELLE_NAMES = {
    "\u064E": "fatha (a)",
    "\u064F": "damma (o/ou)",
    "\u0650": "kasra (i)",
    "\u0651": "shadda",
    "\u0652": "sukun",
}

HALLUCINATIONS_CONNUES = [
    "اشتركوا في القناة",
    "اشترك في القناة",
    "تابعونا",
    "للمزيد",
    "سبحان الله",
    "الله أكبر",
    "صلى الله",
    "بسم الله",
]


def get_openai_client() -> AsyncOpenAI:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY non configurée")
    return AsyncOpenAI(api_key=key)


def strip_harakat(text: str) -> str:
    result = text
    for ch in HARAKAT + TATWEEL:
        result = result.replace(ch, "")
    return result.strip()


def normalize_long_vowels(text: str) -> str:
    result = ""
    i = 0
    while i < len(text):
        ch = text[i]
        if i + 1 < len(text) and text[i + 1] in LONG_TO_SHORT:
            long_ch = text[i + 1]
            short_equiv = LONG_TO_SHORT[long_ch]
            if ch == short_equiv:
                result += ch
                i += 2
                continue
        if ch in LONG_TO_SHORT:
            result += LONG_TO_SHORT[ch]
        else:
            result += ch
        i += 1
    return result.strip()


def extract_consonants(text: str) -> str:
    return strip_harakat(text).strip()


def extract_vowels_normalized(text: str) -> str:
    normalized = normalize_long_vowels(text)
    return "".join(ch for ch in normalized if ch in HARAKAT)


def is_hallucination(transcription: str, expected: str) -> bool:
    clean     = strip_harakat(transcription)
    exp_clean = strip_harakat(expected)
    if not clean:
        return True
    if len(clean) > max(len(exp_clean) * 8, 20):
        return True
    for phrase in HALLUCINATIONS_CONNUES:
        if strip_harakat(phrase) in clean:
            return True
    words = clean.split()
    if len(words) >= 2 and len(set(words)) == 1:
        return True
    return False


def analyze_pronunciation(expected: str, transcribed: str) -> dict:
    from difflib import SequenceMatcher

    exp_norm   = normalize_long_vowels(expected)
    trans_norm = normalize_long_vowels(transcribed)
    exp_cons   = extract_consonants(exp_norm)
    trans_cons = extract_consonants(trans_norm)
    exp_voy    = extract_vowels_normalized(expected)
    trans_voy  = extract_vowels_normalized(transcribed)

    score_cons   = SequenceMatcher(None, exp_cons, trans_cons).ratio() * 100 if exp_cons and trans_cons else (100.0 if not exp_cons else 0.0)
    score_voy    = SequenceMatcher(None, exp_voy, trans_voy).ratio() * 100   if exp_voy and trans_voy   else (100.0 if not exp_voy   else 0.0)
    score_strict = SequenceMatcher(None, exp_norm, trans_norm).ratio() * 100

    score_global = round(score_cons * 0.5 + score_voy * 0.3 + score_strict * 0.2, 1)

    bonne_lettre  = score_cons >= 80
    bonne_voyelle = score_voy >= 75 or not exp_voy

    if score_global >= 80:
        cas = "parfait"
    elif bonne_lettre and not bonne_voyelle:
        cas = "bonne_lettre_mauvaise_voyelle"
    elif not bonne_lettre and bonne_voyelle:
        cas = "mauvaise_lettre_bonne_voyelle"
    elif score_cons >= 55:
        cas = "proche"
    else:
        cas = "mauvaise_lettre_mauvaise_voyelle"

    voyelle_attendue  = VOYELLE_NAMES.get(exp_voy[0],   exp_voy[0])   if exp_voy   else None
    voyelle_prononcee = VOYELLE_NAMES.get(trans_voy[0], trans_voy[0]) if trans_voy else None

    print(f"ANALYSE: cons={score_cons:.0f}% voy={score_voy:.0f}% strict={score_strict:.0f}% → global={score_global} | cas={cas}")

    return {
        "score_global":      score_global,
        "score_consonnes":   round(score_cons, 1),
        "score_voyelles":    round(score_voy, 1),
        "cas":               cas,
        "bonne_lettre":      bonne_lettre,
        "bonne_voyelle":     bonne_voyelle,
        "voyelle_attendue":  voyelle_attendue,
        "voyelle_prononcee": voyelle_prononcee,
    }


def build_system_prompt(lang_name: str) -> str:
    return f"""Tu es un expert en phonétique arabe et en correction pédagogique pour non-arabophones débutants.

Ta mission est d'analyser avec précision et bienveillance la prononciation arabe d'un élève débutant.

RÈGLES GÉNÉRALES :
1. Ne jamais inventer des erreurs inexistantes.
2. Être tolérant avec les très petites variations naturelles.
3. IMPORTANT : Ne jamais pénaliser une voyelle longue à la place d'une courte (ma/maa, mi/mii, mo/moo) — erreur mineure de durée, pas de nature.
4. Priorité : exactitude des lettres → exactitude des voyelles → ordre des sons.
5. Niveau débutant → tolérance élevée, encouragements fréquents.

CONFUSIONS FRÉQUENTES CHEZ NON-ARABOPHONES :
- Visuelles : ب/ت/ث | ج/ح/خ | د/ذ | ر/ز | س/ش | ص/ض | ط/ظ | ع/غ | ف/ق
- Phonétiques : ح↔ه | ق↔ك | ع↔أ | ص↔س | ض↔د | ط↔ت

LANGUE DE RÉPONSE : Tu dois répondre UNIQUEMENT en {lang_name}. Tous les messages pour l'élève doivent être en {lang_name}.

FORMAT DE SORTIE — JSON STRICT UNIQUEMENT, sans markdown :
{{
  "elements_corrects": ["..."],
  "erreurs_detectees": [
    {{
      "type": "...",
      "attendu": "...",
      "prononce": "...",
      "explication": "...",
      "gravite": "faible|moyenne|forte"
    }}
  ],
  "recommandation_principale": "une seule recommandation concrète en {lang_name}, max 15 mots",
  "feedback_court_pour_eleve": "message bienveillant et encourageant en {lang_name}, max 12 mots"
}}"""


def build_user_message(
    expected_arabic: str,
    translation: str,
    transcription: str,
    exercise_type: str,
    analyse: dict,
    lang_name: str,
) -> str:
    context_type = {
        "letter":   "une lettre isolée avec sa voyelle",
        "word":     "un mot arabe",
        "sentence": "une phrase arabe",
    }.get(exercise_type, "un mot")

    cas           = analyse["cas"]
    score         = analyse["score_global"]
    score_cons    = analyse["score_consonnes"]
    score_voy     = analyse["score_voyelles"]
    voy_attendue  = analyse.get("voyelle_attendue")  or "inconnue"
    voy_prononcee = analyse.get("voyelle_prononcee") or "inconnue"

    cas_context = {
        "parfait":                         f"L'élève a très bien prononcé. Score: {score}/100. Félicite-le.",
        "bonne_lettre_mauvaise_voyelle":   f"Lettre correcte ({score_cons}%) mais voyelle incorrecte ({score_voy}%). Voyelle attendue: {voy_attendue}. Voyelle prononcée: {voy_prononcee}.",
        "mauvaise_lettre_bonne_voyelle":   f"Voyelle correcte ({score_voy}%) mais lettre incorrecte ({score_cons}%).",
        "proche":                           f"Proche mais pas tout à fait correct. Score: {score}/100. Consonnes: {score_cons}%. Voyelles: {score_voy}%.",
        "mauvaise_lettre_mauvaise_voyelle": f"Lettre et voyelle incorrectes. Score: {score}/100.",
    }

    return f"""Exercice : {context_type}
Texte attendu : {expected_arabic} (traduction : {translation})
Transcription Whisper : {transcription}
Score calculé : {score}/100

Contexte : {cas_context.get(cas, '')}

Réponds en {lang_name}. Produis le JSON d'analyse."""


# ─── Quota ────────────────────────────────────────────────────────────────────

async def check_and_increment_quota(user: User, db: AsyncSession) -> int:
    now = datetime.now(timezone.utc)
    if not user.oral_evaluations_reset_date or \
       user.oral_evaluations_reset_date.month != now.month or \
       user.oral_evaluations_reset_date.year  != now.year:
        user.oral_evaluations_this_month = 0
        user.oral_evaluations_reset_date = now

    is_premium = user.is_premium or user.role in ("admin", "superadmin")
    quota = QUOTA_PREMIUM if is_premium else QUOTA_FREE

    if quota == 0:
        raise HTTPException(status_code=403, detail="L'évaluation orale est réservée aux abonnés premium.")

    if user.oral_evaluations_this_month >= quota:
        raise HTTPException(status_code=429, detail=f"Quota mensuel atteint ({quota} évaluations). Renouvellement le 1er du mois prochain.")

    user.oral_evaluations_this_month += 1
    await db.commit()
    remaining = quota - user.oral_evaluations_this_month
    print(f"QUOTA: {user.oral_evaluations_this_month}/{quota} | restantes: {remaining}")
    return remaining


# ─── Endpoint évaluation ──────────────────────────────────────────────────────

@router.post("/evaluate")
async def evaluate_oral(
    audio: UploadFile = File(...),
    expected_arabic: str = Form(...),
    translation: str = Form(...),
    exercise_type: str = Form(default="letter"),
    lang: str = Form(default="fr"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    remaining = await check_and_increment_quota(current_user, db)
    lang_name = LANG_NAMES.get(lang, "français")

    audio_bytes = await audio.read()
    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Fichier audio trop court ou vide.")

    # ── Whisper ──────────────────────────────────────────────────────────────
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        client = get_openai_client()
        with open(tmp_path, "rb") as audio_file:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="ar",
                response_format="text",
                prompt=f"الكلمة المتوقعة: {expected_arabic}",
            )
        transcription = transcript.strip() if isinstance(transcript, str) else str(transcript).strip()
        print(f"WHISPER: '{transcription}' | attendu: '{expected_arabic}'")
    except Exception as e:
        print(f"ERREUR WHISPER: {e}")
        raise HTTPException(status_code=502, detail=f"Erreur Whisper : {str(e)}")
    finally:
        os.unlink(tmp_path)

    # ── Détection hallucination ───────────────────────────────────────────────
    if is_hallucination(transcription, expected_arabic):
        print(f"HALLUCINATION: '{transcription}'")
        return {
            "score": 0,
            "feedback": "Je n'ai pas bien entendu. Parle plus près du micro.",
            "recommandation": "Rapproche-toi du micro et prononce clairement.",
            "error_detail": None,
            "cas": "non_entendu",
            "quota_restant": remaining,
        }

    # ── Analyse phonétique ────────────────────────────────────────────────────
    analyse = analyze_pronunciation(expected_arabic, transcription)
    score   = analyse["score_global"]
    cas     = analyse["cas"]

    # ── Fallbacks selon langue ────────────────────────────────────────────────
    fallbacks_fr = {
        "parfait":                         ("Excellent ! Parfaite prononciation !", "Continue comme ça !", None),
        "bonne_lettre_mauvaise_voyelle":   ("Bonne lettre ! Travaille la voyelle.", f"Prononce la voyelle {analyse.get('voyelle_attendue', '')}.", "voyelle incorrecte"),
        "mauvaise_lettre_bonne_voyelle":   ("Bonne voyelle ! Mais ce n'est pas la bonne lettre.", "Réécoute bien la lettre et réessaie.", "lettre incorrecte"),
        "proche":                           ("Presque ! Tu es sur la bonne voie.", "Réécoute et réessaie lentement.", "prononciation approchante"),
        "mauvaise_lettre_mauvaise_voyelle": ("Continue, tu vas y arriver !", "Écoute bien le modèle et réessaie.", "lettre et voyelle à retravailler"),
    }

    # ── GPT feedback ─────────────────────────────────────────────────────────
    system_prompt = build_system_prompt(lang_name)
    user_message  = build_user_message(expected_arabic, translation, transcription, exercise_type, analyse, lang_name)
    client = get_openai_client()
    try:
        gpt_response = await client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=300,
            temperature=0.4,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
        )
        gpt_data       = json.loads(gpt_response.choices[0].message.content)
        feedback       = gpt_data.get("feedback_court_pour_eleve", fallbacks_fr[cas][0])
        recommandation = gpt_data.get("recommandation_principale",  fallbacks_fr[cas][1])
        erreurs        = gpt_data.get("erreurs_detectees", [])
        error_detail   = erreurs[0].get("explication") if erreurs else None
        print(f"GPT [{lang}]: '{feedback}' | reco: '{recommandation}'")
    except Exception as e:
        print(f"ERREUR GPT: {e}")
        feedback, recommandation, error_detail = fallbacks_fr.get(cas, fallbacks_fr["proche"])

    return {
        "score":           score,
        "feedback":        feedback,
        "recommandation":  recommandation,
        "error_detail":    error_detail,
        "cas":             cas,
        "score_consonnes": analyse["score_consonnes"],
        "score_voyelles":  analyse["score_voyelles"],
        "quota_restant":   remaining,
    }


# ─── Endpoint quota ───────────────────────────────────────────────────────────

@router.get("/quota")
async def get_quota(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now        = datetime.now(timezone.utc)
    is_premium = current_user.is_premium or current_user.role in ("admin", "superadmin")
    quota      = QUOTA_PREMIUM if is_premium else QUOTA_FREE
    used       = current_user.oral_evaluations_this_month or 0
    if not current_user.oral_evaluations_reset_date or \
       current_user.oral_evaluations_reset_date.month != now.month:
        used = 0
    return {
        "quota_total":   quota,
        "quota_used":    used,
        "quota_restant": max(0, quota - used),
        "is_premium":    is_premium,
    }


# ─── TTS ─────────────────────────────────────────────────────────────────────

@router.post("/tts")
async def text_to_speech(
    text: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    if elevenlabs_key:
        import httpx
        voice_id = os.getenv("ELEVENLABS_ARABIC_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.post(
                    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                    headers={"xi-api-key": elevenlabs_key, "Content-Type": "application/json"},
                    json={"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.75, "similarity_boost": 0.85}},
                )
            if res.status_code == 200:
                return StreamingResponse(io.BytesIO(res.content), media_type="audio/mpeg", headers={"Content-Disposition": "inline; filename=tts.mp3"})
        except Exception as e:
            print(f"ERREUR ElevenLabs: {e}")

    try:
        client = get_openai_client()
        tts_response = await client.audio.speech.create(model="tts-1", voice="onyx", input=text, speed=0.85)
        return StreamingResponse(io.BytesIO(tts_response.content), media_type="audio/mpeg", headers={"Content-Disposition": "inline; filename=tts.mp3"})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"TTS indisponible : {str(e)}")