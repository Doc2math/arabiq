'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const C = {
  violet: '#6C3FC5', violetLt: '#EDE8FB', violetDk: '#4A2A8A',
  orange: '#F07C1E', orangeLt: '#FEF0E3',
  green:  '#2BA84A', greenLt:  '#E3F7E8',
  blue:   '#1976D2', blueLt:   '#E6F1FB',
  bg:     '#F8F7FF', white:    '#FFFFFF',
  text:   '#1A1A2E', text2:    '#5A5A7A', text3: '#9A9AB0',
  border: '#E8E4F8',
}

// ── Contenu des articles ───────────────────────────────────────
// Pour ajouter un article : ajoutez une entrée dans ARTICLES
// Le contenu est en Markdown simplifié (## titres, **gras**, *italique*, > citation)
const ARTICLES: Record<string, any> = {
  '1': {
    title: "Comment mémoriser l'alphabet arabe en 7 jours",
    category: "Conseils",
    date: "15 avril 2026",
    readTime: "5 min",
    emoji: "🧠",
    color: C.violet,
    bg: C.violetLt,
    content: `
## Pourquoi l'alphabet arabe semble difficile

L'arabe fait peur à beaucoup d'apprenants. Pourtant, contrairement au chinois ou au japonais, l'arabe est un **alphabet** — pas des idéogrammes. Cela signifie que chaque symbole représente un son, comme en français.

La vraie difficulté ? Les lettres s'écrivent de **droite à gauche** et changent de forme selon leur position dans le mot.

## Les 7 techniques qui fonctionnent

### 1. Commencez par les groupes de lettres similaires

Plusieurs lettres arabes partagent la même forme de base et ne diffèrent que par leurs points.

> **ب (Ba), ت (Ta), ث (Tha)** ont exactement la même forme. Seuls les points changent.
> je suis ici

Apprenez-les ensemble — cela réduit l'effort de mémorisation de 60%.

### 2. Associez chaque lettre à une image

- **م (Mim)** ressemble à un petit **m** minuscule avec une queue
- **ك (Kaf)** ressemble à une **vague** avec une ligne intérieure
- **ب (Ba)** ressemble à une **barque** avec un point dans l'eau

### 3. Écrivez chaque lettre 10 fois par jour

La mémoire musculaire est puissante. Tracez chaque lettre à la main — ne vous contentez pas de la regarder.

### 4. Utilisez les fiches LangDad

Les fiches d'écriture de LangDad incluent des grilles guidées avec modèles. Imprimez-les et entraînez-vous hors écran.

### 5. Prononcez à voix haute

Associez le geste d'écriture au son. Dites *"Ba"* en écrivant **ب**. Le cerveau mémorise mieux les associations multi-sensorielles.

### 6. Révisez en spirale

Ne passez pas aux nouvelles lettres sans avoir révisé les précédentes. Le système BKT de LangDad fait cela automatiquement — il vous repose les lettres moins maîtrisées.

### 7. Formez vos premiers mots dès le Jour 3

Avec seulement **م ك ت ب**, vous pouvez écrire **مَكْتَبٌ** (bureau). Voir des mots réels booste la motivation.

## Plan sur 7 jours

| Jour | Lettres | Objectif |
|------|---------|----------|
| 1 | م ك ت ب | Reconnaissance |
| 2 | ا و ي | Voyelles longues |
| 3 | Révision + 1ers mots | Lecture simple |
| 4 | ر ز | Nouvelles lettres |
| 5 | س ش | Paires similaires |
| 6 | ن ل | Consolidation |
| 7 | Évaluation | Bilan Module 1 |

## Conclusion

La clé est la **régularité** : 15 minutes par jour valent mieux qu'une heure le week-end. Avec LangDad, chaque session est courte, progressive et mesurée.
    `,
  },

  '2': {
    title: "La différence entre Ba ب et Ta ت : l'erreur classique",
    category: "Arabe",
    date: "8 avril 2026",
    readTime: "3 min",
    emoji: "✍️",
    color: C.orange,
    bg: C.orangeLt,
    content: `
## La confusion la plus fréquente chez les débutants

Parmi les 28 lettres de l'alphabet arabe, deux créent systématiquement de la confusion chez les débutants francophones : **ب (Ba)** et **ت (Ta)**.

> Ces deux lettres ont exactement la même forme de base. Seuls les points les différencient.

## La règle simple à retenir

**ب Ba** → **1 point en dessous**
**ت Ta** → **2 points au-dessus**

C'est tout. Une lettre, un point en dessous = Ba. Deux points au-dessus = Ta.

## Pourquoi cette distinction est cruciale

En arabe, les points ne sont **jamais décoratifs**. Ils font partie intégrante de la lettre et changent complètement sa signification.

Confondre **ب** et **ت** dans un mot peut changer totalement son sens. Par exemple :
- **بَيْت** (bayt) = maison
- **تَيْت** = n'existe pas

## L'astuce mnémotechnique

Imaginez une **barque** retournée sur l'eau :
- La barque avec **un point dans l'eau** en dessous → **Ba** ب
- La barque avec **deux points dans le ciel** au-dessus → **Ta** ت

## Exercice pratique

Classez ces lettres dans la bonne colonne :

ب ت ت ب ب ت ب ت

| Ba ب | Ta ت |
|------|------|
| ? | ? |

*Réponse : Ba = positions 1, 3, 5, 7 / Ta = positions 2, 4, 6, 8*

## Et la troisième sœur : ث (Tha)

Il existe une troisième lettre de la même famille : **ث (Tha)**, avec **3 points au-dessus**.

- ب Ba → 1 point dessous
- ت Ta → 2 points dessus
- ث Tha → 3 points dessus

Ensemble, elles forment la famille **B-T-Th** — à apprendre en groupe pour mieux les distinguer.
    `,
  },

  '3': {
    title: "Pourquoi apprendre l'arabe par les lettres fonctionne mieux",
    category: "Pédagogie",
    date: "1 avril 2026",
    readTime: "7 min",
    emoji: "📚",
    color: C.green,
    bg: C.greenLt,
    content: `
## Le problème des méthodes traditionnelles

La plupart des cours d'arabe pour débutants commencent par des phrases de conversation : *"Bonjour, comment vous appelez-vous ?"*. L'apprenant répète sans comprendre la structure.

Résultat : des progrès rapides au début, puis un **mur d'incompréhension** dès qu'on sort du script.

## La méthode LangDad : lettres → syllabes → mots → phrases

LangDad suit une progression stricte inspirée de la didactique des langues à écriture non-latine :

### Étape 1 : Les lettres isolées

Vous apprenez à **reconnaître, prononcer et écrire** chaque lettre séparément. Pas de mots encore — juste les briques de base.

### Étape 2 : Les syllabes

Chaque lettre combinée à une voyelle forme une syllabe. **ب + فتحة = بَ (Ba)**. C'est ici que la lecture commence réellement.

### Étape 3 : Les mots

Des mots construits uniquement avec les lettres déjà apprises. **مَكْتَبٌ** (bureau) n'utilise que م ك ت ب — les 4 premières lettres du Module 1.

### Étape 4 : Les phrases

Des phrases simples, puis de plus en plus complexes. À ce stade, l'apprenant **lit vraiment** — il ne répète pas.

## La science derrière cette approche

### La charge cognitive

Apprendre une lettre à la fois réduit la **charge cognitive**. Le cerveau peut se concentrer sur un seul nouveau symbole plutôt que d'essayer de déchiffrer un mot entier.

### Le BKT (Bayesian Knowledge Tracing)

LangDad utilise un algorithme qui mesure votre maîtrise de chaque compétence (reconnaissance, lecture, écriture) en temps réel. Si vous hésitez sur **ك**, le système vous repose cette lettre plus souvent.

> C'est la même technologie utilisée par les meilleurs systèmes d'enseignement adaptatif au monde.


### La progression vérifiée

Vous ne passez au module suivant que lorsque le système confirme que vous maîtrisez le précédent. Pas d'avancement artificiel.

## Comparaison des méthodes

| Méthode | Avantage | Inconvénient |
|---------|----------|--------------|
| Conversation directe | Rapide au début | Pas de base solide |
| Grammaire pure | Rigoureux | Ennuyeux, démotivant |
| **LangDad (lettres)** | **Base solide, progression mesurée** | **Plus lent au début** |

## Conclusion

La méthode par lettres demande plus de patience les premières semaines. Mais les apprenants qui la suivent lisent de vrais textes arabes en quelques mois — là où d'autres restent bloqués sur des phrases apprises par cœur.
    `,
  },
}

// ── Renderer Markdown simplifié ────────────────────────────────
function renderMarkdown(content: string) {
  const lines = content.trim().split('\n')
  const elements: React.ReactNode[] = []
  let tableRows: string[][] = []
  let inTable = false
  let quoteLines: string[] = []   
  let key = 0

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: C.text, fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headers = tableRows[0]
      const rows = tableRows.slice(2)
      elements.push(
        <div key={key++} style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', background: C.violet, color: C.white, textAlign: 'left', fontWeight: 700, fontSize: 13 }}>
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? C.white : C.bg }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '9px 14px', borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text2 }}>
                      {parseInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      tableRows = []
      inTable = false
    }
  }

  // ← nouvelle fonction
  const flushQuote = () => {
    if (quoteLines.length > 0) {
      elements.push(
        <blockquote key={key++} style={{
          borderLeft: `4px solid ${C.violet}`, background: C.violetLt,
          padding: '14px 18px', borderRadius: '0 12px 12px 0', margin: '16px 0',
        }}>
          {quoteLines.map((line, i) => (
            <p key={i} style={{
              fontSize: 14, color: C.violetDk, fontStyle: 'italic',
              lineHeight: 1.7, margin: i < quoteLines.length - 1 ? '0 0 8px 0' : '0',
            }}>
              {parseInline(line)}
            </p>
          ))}
        </blockquote>
      )
      quoteLines = []
    }
  }

  for (const line of lines) {
    // Table
    if (line.startsWith('|')) {
      flushQuote()   // ← ajout
      inTable = true
      tableRows.push(line.split('|').filter(c => c !== ''))
      continue
    }
    if (inTable) flushTable()

    // Citation multi-lignes ← modifié
    if (line.startsWith('> ')) {
      quoteLines.push(line.slice(2))
      continue
    } else {
      flushQuote()  // ← flush si on sort du bloc
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 36, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${C.border}` }}>
          {line.slice(3)}
        </h2>
      )
    }
    // H3
    else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} style={{ fontSize: 17, fontWeight: 700, color: C.violet, marginTop: 24, marginBottom: 10 }}>
          {line.slice(4)}
        </h3>
      )
    }
    // Liste
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: 10, margin: '6px 0', alignItems: 'flex-start' }}>
          <span style={{ color: C.violet, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 15, color: C.text2, lineHeight: 1.7 }}>{parseInline(line.slice(2))}</span>
        </div>
      )
    }
    // Ligne vide
    else if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: 8 }} />)
    }
    // Paragraphe
    else if (line.trim()) {
      elements.push(
        <p key={key++} style={{ fontSize: 15, color: C.text2, lineHeight: 1.8, margin: '8px 0' }}>
          {parseInline(line)}
        </p>
      )
    }
  }

  if (inTable) flushTable()
  flushQuote()  // ← flush final
  return elements
}

export default function BlogArticlePage() {
  const params  = useParams<{ id: string }>()
  const article = ARTICLES[params.id]
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      const el  = document.documentElement
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
      setProgress(Math.min(100, pct))
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!article) return (
    <div style={{ minWidth: 920 ,minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: C.bg }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Article introuvable</h1>
      <Link href="/blog" style={{ color: C.violet, textDecoration: 'none', fontWeight: 600 }}>← Retour au blog</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Barre de progression lecture */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 200, background: C.border }}>
        <div style={{ height: '100%', background: article.color, width: `${progress}%`, transition: 'width .1s' }} />
      </div>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 3, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/blog"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text2, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            ← Blog
          </Link>
          <div style={{ width: 1, height: 20, background: C.border }} />
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌙</div>
            <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>LangDad</span>
          </Link>
          <div style={{ flex: 1 }} />
          <Link href="/register"
            style={{ padding: '7px 14px', borderRadius: 10, background: C.orange, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            S&apos;inscrire →
          </Link>
        </div>
      </nav>

      {/* Hero article */}
      <div style={{
        background: `linear-gradient(135deg, ${article.color}15, ${article.color}05)`,
        borderBottom: `1px solid ${article.color}20`,
        padding: '90px 20px 40px',
      }}>
        <div style={{ maxWidth: 1020, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/blog" style={{ fontSize: 13, color: C.text3, textDecoration: 'none' }}>Blog</Link>
            <span style={{ color: C.text3 }}>/</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: article.bg, color: article.color }}>
              {article.category}
            </span>
          </div>

          <div style={{ fontSize: 56, marginBottom: 16 }}>{article.emoji}</div>

          <h1 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: C.text, marginBottom: 14, lineHeight: 1.2 }}>
            {article.title}
          </h1>

          <div style={{ display: 'flex', gap: 20, color: C.text3, fontSize: 13, flexWrap: 'wrap' }}>
            <span>📅 {article.date}</span>
            <span>⏱ {article.readTime} de lecture</span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Corps de l'article */}
        <div style={{
          background: C.white, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: '36px 40px',
        }}>
          {renderMarkdown(article.content)}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 36, background: `linear-gradient(135deg, ${C.violetDk}, ${C.violet})`,
          borderRadius: 20, padding: '28px 28px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🌙</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Prêt à apprendre l&apos;arabe ?
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 18 }}>
            Commencez le Module 1 gratuitement — 11 leçons, 78 exercices.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register"
              style={{ padding: '11px 22px', borderRadius: 12, background: C.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Commencer gratuitement →
            </Link>
            <Link href="/blog"
              style={{ padding: '11px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              ← Retour au blog
            </Link>
          </div>
        </div>

        {/* Navigation articles */}
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {Number(params.id) > 1 && (
            <Link href={`/blog/${Number(params.id) - 1}`}
              style={{ padding: '12px 18px', borderRadius: 14, border: `2px solid ${C.border}`, background: C.white, color: C.text2, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              ← Article précédent
            </Link>
          )}
          {ARTICLES[String(Number(params.id) + 1)] && (
            <Link href={`/blog/${Number(params.id) + 1}`}
              style={{ padding: '12px 18px', borderRadius: 14, border: `2px solid ${C.border}`, background: C.white, color: C.text2, fontSize: 13, fontWeight: 600, textDecoration: 'none', marginLeft: 'auto' }}>
              Article suivant →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}