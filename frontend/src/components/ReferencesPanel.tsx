'use client'

import { useState, useEffect } from 'react'

const C = {
  violet:   '#6C3FC5', violetLt: '#EDE8FB', violetDk: '#4A2A8A',
  orange:   '#F07C1E', orangeLt: '#FEF0E3',
  green:    '#2BA84A', greenLt:  '#E3F7E8',
  blue:     '#1976D2', blueLt:   '#E6F1FB',
  red:      '#E24B4A', redLt:    '#FCEBEB',
  gold:     '#F9A825', goldLt:   '#FFF8E1',
  bg:       '#F8F7FF', white:    '#FFFFFF',
  text:     '#1A1A2E', text2:    '#5A5A7A', text3: '#9A9AB0',
  border:   '#E8E4F8',
}

// ── Audio MP3 ──────────────────────────────────────────────────
const AUDIO_BASE = '/assets/audio'

// Fichiers disponibles — compléter au fur et à mesure
const LETTER_AUDIO: Record<string, string> = {
  'م': `${AUDIO_BASE}/letters/mim.mp3`,
  'ك': `${AUDIO_BASE}/letters/kaf.mp3`,
  'ت': `${AUDIO_BASE}/letters/ta.mp3`,
  'ب': `${AUDIO_BASE}/letters/ba.mp3`,
}

const WORD_AUDIO: Record<string, string> = {
  'مَكْتَبٌ': `${AUDIO_BASE}/words/maktab.mp3`,
  'كِتَابٌ':  `${AUDIO_BASE}/words/kitab.mp3`,
  'بَابٌ':    `${AUDIO_BASE}/words/bab.mp3`,
  'كَتَبَ':   `${AUDIO_BASE}/words/kataba.mp3`,
}

let _audio: HTMLAudioElement | null = null

function playAudio(ar: string) {
  if (typeof window === 'undefined') return

  // Chercher le fichier : mot d'abord, puis lettre, puis lettre sans harakat
  const clean = ar.replace(/[\u064B-\u065F\u0670]/g, '')
  const src   = WORD_AUDIO[ar] ?? LETTER_AUDIO[ar] ?? LETTER_AUDIO[clean]

  if (_audio) { _audio.pause(); _audio.currentTime = 0 }

  if (src) {
    _audio = new Audio(src)
    _audio.play().catch(() => tts(ar))
  } else {
    tts(ar)
  }
}

function tts(text: string) {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ar-SA'; u.rate = 0.75
  const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('ar'))
  if (v) u.voice = v
  window.speechSynthesis.speak(u)
}

// ── Info liaison ───────────────────────────────────────────────
const JOIN_INFO = {
  both: {
    label: "S'attache des deux côtés",
    desc:  "Cette lettre se connecte à la lettre précédente ET à la suivante.",
    icon: '↔', color: '#2BA84A', bg: '#E3F7E8',
  },
  right_only: {
    label: "S'attache à droite seulement",
    desc:  "Cette lettre se connecte à la lettre précédente, mais JAMAIS à la suivante. Elle coupe le mot après elle.",
    icon: '→', color: '#F07C1E', bg: '#FEF0E3',
  },
}

// ── 28 Lettres — ordre arabe RTL ──────────────────────────────
// (de ا à ي, affichées de droite à gauche dans la grille)
const ALPHABET = [
  { name:'Alif',      ar:'ا', isolated:'ا', initial:'ا',   medial:'ا',   final:'ا',   phoneme:'/a/',   join:'right_only', color:'#6C3FC5', bg:'#EDE8FB' },
  { name:'Ba',        ar:'ب', isolated:'ب', initial:'بـ',  medial:'ـبـ', final:'ـب',  phoneme:'/b/',   join:'both',       color:'#1976D2', bg:'#E6F1FB' },
  { name:'Ta',        ar:'ت', isolated:'ت', initial:'تـ',  medial:'ـتـ', final:'ـت',  phoneme:'/t/',   join:'both',       color:'#F07C1E', bg:'#FEF0E3' },
  { name:'Tha',       ar:'ث', isolated:'ث', initial:'ثـ',  medial:'ـثـ', final:'ـث',  phoneme:'/θ/',   join:'both',       color:'#2BA84A', bg:'#E3F7E8' },
  { name:'Jim',       ar:'ج', isolated:'ج', initial:'جـ',  medial:'ـجـ', final:'ـج',  phoneme:'/dʒ/',  join:'both',       color:'#9C27B0', bg:'#F3E5F5' },
  { name:'Ha',        ar:'ح', isolated:'ح', initial:'حـ',  medial:'ـحـ', final:'ـح',  phoneme:'/ħ/',   join:'both',       color:'#E24B4A', bg:'#FCEBEB' },
  { name:'Kha',       ar:'خ', isolated:'خ', initial:'خـ',  medial:'ـخـ', final:'ـخ',  phoneme:'/x/',   join:'both',       color:'#F07C1E', bg:'#FEF0E3' },
  { name:'Dal',       ar:'د', isolated:'د', initial:'د',   medial:'ـد',  final:'ـد',  phoneme:'/d/',   join:'right_only', color:'#1976D2', bg:'#E6F1FB' },
  { name:'Dhal',      ar:'ذ', isolated:'ذ', initial:'ذ',   medial:'ـذ',  final:'ـذ',  phoneme:'/ð/',   join:'right_only', color:'#2BA84A', bg:'#E3F7E8' },
  { name:'Ra',        ar:'ر', isolated:'ر', initial:'ر',   medial:'ـر',  final:'ـر',  phoneme:'/r/',   join:'right_only', color:'#6C3FC5', bg:'#EDE8FB' },
  { name:'Zay',       ar:'ز', isolated:'ز', initial:'ز',   medial:'ـز',  final:'ـز',  phoneme:'/z/',   join:'right_only', color:'#E91E63', bg:'#FCE4EC' },
  { name:'Sin',       ar:'س', isolated:'س', initial:'سـ',  medial:'ـسـ', final:'ـس',  phoneme:'/s/',   join:'both',       color:'#1976D2', bg:'#E6F1FB' },
  { name:'Shin',      ar:'ش', isolated:'ش', initial:'شـ',  medial:'ـشـ', final:'ـش',  phoneme:'/ʃ/',   join:'both',       color:'#E24B4A', bg:'#FCEBEB' },
  { name:'Sad',       ar:'ص', isolated:'ص', initial:'صـ',  medial:'ـصـ', final:'ـص',  phoneme:'/sˤ/',  join:'both',       color:'#2BA84A', bg:'#E3F7E8' },
  { name:'Dad',       ar:'ض', isolated:'ض', initial:'ضـ',  medial:'ـضـ', final:'ـض',  phoneme:'/dˤ/',  join:'both',       color:'#6C3FC5', bg:'#EDE8FB' },
  { name:'Ta emph.',  ar:'ط', isolated:'ط', initial:'طـ',  medial:'ـطـ', final:'ـط',  phoneme:'/tˤ/',  join:'both',       color:'#F07C1E', bg:'#FEF0E3' },
  { name:'Dha emph.', ar:'ظ', isolated:'ظ', initial:'ظـ',  medial:'ـظـ', final:'ـظ',  phoneme:'/ðˤ/', join:'both',       color:'#1976D2', bg:'#E6F1FB' },
  { name:'Ayn',       ar:'ع', isolated:'ع', initial:'عـ',  medial:'ـعـ', final:'ـع',  phoneme:'/ʕ/',   join:'both',       color:'#E24B4A', bg:'#FCEBEB' },
  { name:'Ghayn',     ar:'غ', isolated:'غ', initial:'غـ',  medial:'ـغـ', final:'ـغ',  phoneme:'/ɣ/',   join:'both',       color:'#2BA84A', bg:'#E3F7E8' },
  { name:'Fa',        ar:'ف', isolated:'ف', initial:'فـ',  medial:'ـفـ', final:'ـف',  phoneme:'/f/',   join:'both',       color:'#9C27B0', bg:'#F3E5F5' },
  { name:'Qaf',       ar:'ق', isolated:'ق', initial:'قـ',  medial:'ـقـ', final:'ـق',  phoneme:'/q/',   join:'both',       color:'#6C3FC5', bg:'#EDE8FB' },
  { name:'Kaf',       ar:'ك', isolated:'ك', initial:'كـ',  medial:'ـكـ', final:'ـك',  phoneme:'/k/',   join:'both',       color:'#1976D2', bg:'#E6F1FB' },
  { name:'Lam',       ar:'ل', isolated:'ل', initial:'لـ',  medial:'ـلـ', final:'ـل',  phoneme:'/l/',   join:'both',       color:'#2BA84A', bg:'#E3F7E8' },
  { name:'Mim',       ar:'م', isolated:'م', initial:'مـ',  medial:'ـمـ', final:'ـم',  phoneme:'/m/',   join:'both',       color:'#6C3FC5', bg:'#EDE8FB' },
  { name:'Nun',       ar:'ن', isolated:'ن', initial:'نـ',  medial:'ـنـ', final:'ـن',  phoneme:'/n/',   join:'both',       color:'#E24B4A', bg:'#FCEBEB' },
  { name:'Ha',        ar:'ه', isolated:'ه', initial:'هـ',  medial:'ـهـ', final:'ـه',  phoneme:'/h/',   join:'both',       color:'#F07C1E', bg:'#FEF0E3' },
  { name:'Waw',       ar:'و', isolated:'و', initial:'و',   medial:'ـو',  final:'ـو',  phoneme:'/w/',   join:'right_only', color:'#1976D2', bg:'#E6F1FB' },
  { name:'Ya',        ar:'ي', isolated:'ي', initial:'يـ',  medial:'ـيـ', final:'ـي',  phoneme:'/j/',   join:'both',       color:'#2BA84A', bg:'#E3F7E8' },
]

// ── Règles ─────────────────────────────────────────────────────
const RULES = [
  {
    id: 1, title: "Les voyelles courtes (Harakat)", color: C.violet, bg: C.violetLt,
    content: "Les harakat sont des signes diacritiques placés au-dessus ou en dessous des lettres pour indiquer la voyelle courte. Ils sont essentiels pour lire correctement.",
    rows: [
      { sign: 'َ',  name: 'Fatha', sound: '/a/', example: 'كَ', meaning: 'Ka'               },
      { sign: 'ِ',  name: 'Kasra', sound: '/i/', example: 'كِ', meaning: 'Ki'               },
      { sign: 'ُ',  name: 'Damma', sound: '/u/', example: 'كُ', meaning: 'Ku'               },
      { sign: 'ْ',  name: 'Sukun', sound: '∅',   example: 'كْ', meaning: 'K (sans voyelle)' },
    ],
    example: { ar: 'كَتَبَ', tr: 'kataba', fr: 'il a écrit', note: 'Ka-Ta-Ba : chaque lettre porte sa fatha' },
  },
  {
    id: 2, title: "Les voyelles longues", color: C.orange, bg: C.orangeLt,
    content: "Les voyelles longues se forment avec une voyelle courte + une lettre de prolongation (ا و ي). Elles durent deux fois plus longtemps que les voyelles courtes.",
    rows: [
      { sign: 'ا', name: 'Alif', sound: '/aː/', example: 'كَا', meaning: 'Kaa (long)' },
      { sign: 'و', name: 'Waw',  sound: '/uː/', example: 'كُو', meaning: 'Kuu (long)' },
      { sign: 'ي', name: 'Ya',   sound: '/iː/', example: 'كِي', meaning: 'Kii (long)' },
    ],
    example: { ar: 'كِتَابٌ', tr: 'kitaab', fr: 'livre', note: "Ki-TAAB : le alif prolonge le 'a' de ta" },
  },
  {
    id: 3, title: "Le Tanwin (nunation)", color: C.green, bg: C.greenLt,
    content: "Le tanwin est un double signe de voyelle qui ajoute un son 'n' final. Il indique que le mot est indéfini (équivalent de 'un/une' en français).",
    rows: [
      { sign: 'ً', name: 'Tanwin Fath', sound: '/an/', example: 'بَيْتً', meaning: '...an' },
      { sign: 'ٍ', name: 'Tanwin Kasr', sound: '/in/', example: 'بَيْتٍ', meaning: '...in' },
      { sign: 'ٌ', name: 'Tanwin Damm', sound: '/un/', example: 'بَيْتٌ', meaning: '...un' },
    ],
    example: { ar: 'مَكْتَبٌ', tr: 'maktabun', fr: 'un bureau', note: "Le ٌ final = 'un' → indique l'article indéfini" },
  },
  {
    id: 4, title: "Les positions des lettres", color: C.blue, bg: C.blueLt,
    content: "La plupart des lettres arabes changent de forme selon leur position dans le mot. Il existe 4 positions. 6 lettres ne s'attachent pas à gauche et restent isolées ou finales.",
    rows: [
      { sign: 'isolée',   name: 'Isolée',   sound: '', example: 'ك',   meaning: 'lettre seule'  },
      { sign: 'initiale', name: 'Initiale', sound: '', example: 'كـ',  meaning: 'début du mot'  },
      { sign: 'médiane',  name: 'Médiane',  sound: '', example: 'ـكـ', meaning: 'milieu du mot' },
      { sign: 'finale',   name: 'Finale',   sound: '', example: 'ـك',  meaning: 'fin du mot'    },
    ],
    example: { ar: 'مَكْتَبٌ', tr: 'm-ak-ta-b', fr: 'bureau', note: 'م initiale · ك و ت médianes · ب finale' },
  },
  {
    id: 5, title: "Le Sukun — consonne sans voyelle", color: C.red, bg: C.redLt,
    content: "Le sukun (ْ) indique l'absence totale de voyelle sur une lettre. Une lettre avec sukun ne peut pas commencer un mot. Elle forme un bloc consonantique avec la lettre suivante.",
    rows: [
      { sign: 'ْ', name: 'Sukun', sound: '∅', example: 'مَكْتَبٌ', meaning: 'le K est sans voyelle' },
    ],
    example: { ar: 'مَكْتَبٌ', tr: 'mak-ta-bun', fr: 'bureau', note: "كْ : Kaf + sukun → bloc KT sans voyelle entre les deux" },
  },
]

// ══════════════════════════════════════════════════════════════
// GRILLE ALPHABET
// ══════════════════════════════════════════════════════════════
function AlphabetGrid() {
  const [selected, setSelected] = useState<number | null>(null)
  const [playing,  setPlaying]  = useState<number | null>(null)

  // Ordre RTL : inverser le tableau pour afficher ا à droite
  const rtlAlphabet = [...ALPHABET].reverse()

  const handleClick = (originalIndex: number) => {
    setPlaying(originalIndex)
    playAudio(ALPHABET[originalIndex].ar)
    setTimeout(() => setPlaying(null), 1000)
    setSelected(selected === originalIndex ? null : originalIndex)
  }

  return (
    <div>
      <p style={{ fontSize: 11, color: C.text3, marginBottom: 12, textAlign: 'center' }}>
        🔊 Cliquer sur une lettre pour l&apos;entendre · Cliquer à nouveau pour fermer
      </p>

      {/* Grille RTL — 4 colonnes, ordre de droite à gauche */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 7,
        direction: 'rtl',  // ← ordre RTL
      }}>
        {rtlAlphabet.map((letter) => {
          // Retrouver l'index original
          const origIdx = ALPHABET.findIndex(l => l.ar === letter.ar)
          const isSel   = selected === origIdx
          const isPlay  = playing  === origIdx

          return (
            <button key={letter.ar} onClick={() => handleClick(origIdx)}
              style={{
                // Couleur de fond : propre à chaque lettre
                background: isSel
                  ? letter.color
                  : isPlay
                    ? letter.bg
                    : letter.bg,          // ← fond coloré même au repos
                border: `2px solid ${isSel ? letter.color : letter.color + '60'}`,
                borderRadius: 12,
                padding: '10px 4px',
                cursor: 'pointer',
                transition: 'all .15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                direction: 'ltr',        // ← texte LTR dans la carte
                transform: isPlay ? 'scale(1.1)' : 'scale(1)',
                boxShadow: isPlay ? `0 4px 14px ${letter.color}50` : 'none',
              }}>

              {/* Grande lettre arabe */}
              <span style={{
                fontFamily: "'Noto Naskh Arabic','Amiri',serif",
                fontSize: 38,            // ← augmenté de 30 à 38
                lineHeight: 1.1,
                direction: 'rtl',
                color: isSel ? C.white : letter.color,
              }}>
                {letter.ar}
              </span>

              {/* Nom */}
              <span style={{
                fontSize: 8, fontWeight: 700, lineHeight: 1,
                color: isSel ? 'rgba(255,255,255,0.95)' : C.text,
              }}>
                {letter.name}
              </span>

              {/* Phonème */}
              <span style={{
                fontSize: 7.5,
                color: isSel ? 'rgba(255,255,255,0.75)' : C.text2,
              }}>
                {letter.phoneme}
              </span>

              {isPlay && (
                <span style={{ fontSize: 9, color: isSel ? C.white : letter.color }}>🔊</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Détail lettre sélectionnée */}
      {selected !== null && (() => {
        const l    = ALPHABET[selected]
        const join = JOIN_INFO[l.join as keyof typeof JOIN_INFO]
        return (
          <div style={{
            marginTop: 14,
            background: l.bg,
            border: `2px solid ${l.color}50`,
            borderRadius: 16, padding: 14,
          }}>
            {/* En-tête */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <span style={{
                fontFamily: "'Noto Naskh Arabic','Amiri',serif",
                fontSize: 56, color: l.color, direction: 'rtl', lineHeight: 1,
              }}>
                {l.ar}
              </span>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 2 }}>{l.name}</p>
                <p style={{ fontSize: 12, color: C.text2 }}>
                  Phonème : <strong style={{ color: l.color }}>{l.phoneme}</strong>
                </p>
              </div>
            </div>

            {/* Info liaison */}
            <div style={{
              background: join.bg,
              border: `1.5px solid ${join.color}40`,
              borderRadius: 10, padding: '10px 12px', marginBottom: 14,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: join.color, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>
                {join.icon}
              </span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: join.color, marginBottom: 3 }}>{join.label}</p>
                <p style={{ fontSize: 11, color: C.text2, lineHeight: 1.6 }}>{join.desc}</p>
              </div>
            </div>

            {/* 4 positions */}
            <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>
              4 Positions dans le mot
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[
                { label: 'Isolée',   form: l.isolated },
                { label: 'Initiale', form: l.initial  },
                { label: 'Médiane',  form: l.medial   },
                { label: 'Finale',   form: l.final    },
              ].map((pos, pi) => {
                const unavail = l.join === 'right_only' && (pi === 1 || pi === 2)
                return (
                  <div key={pi} style={{
                    background: unavail ? '#F0F0F0' : C.white,
                    border: `1.5px solid ${unavail ? C.border : l.color + '40'}`,
                    borderRadius: 10, padding: '8px 4px',
                    textAlign: 'center' as const,
                    opacity: unavail ? 0.45 : 1,
                  }}>
                    <div style={{
                      fontFamily: "'Noto Naskh Arabic','Amiri',serif",
                      fontSize: 24, color: unavail ? C.text3 : l.color,
                      direction: 'rtl', lineHeight: 1.3,
                    }}>
                      {pos.form}
                    </div>
                    <div style={{ fontSize: 9, color: C.text3, marginTop: 4, fontWeight: 600 }}>
                      {pos.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Note non-liante */}
            {l.join === 'right_only' && (
              <div style={{
                marginTop: 10, padding: '8px 12px',
                background: '#FEF0E3', borderRadius: 8,
                borderLeft: '3px solid #F07C1E',
              }}>
                <p style={{ fontSize: 11, color: '#7A3A00', lineHeight: 1.6 }}>
                  ⚠️ Cette lettre ne se connecte jamais à la lettre suivante.
                  Les positions <strong>Initiale</strong> et <strong>Médiane</strong> sont identiques à la forme isolée.
                </p>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// LISTE DES RÈGLES
// ══════════════════════════════════════════════════════════════
function RulesList() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {RULES.map(rule => {
        const isOpen = open === rule.id
        return (
          <div key={rule.id} style={{
            border: `2px solid ${isOpen ? rule.color : C.border}`,
            borderRadius: 14, overflow: 'hidden', transition: 'border-color .2s',
          }}>
            {/* En-tête */}
            <button onClick={() => setOpen(isOpen ? null : rule.id)}
              style={{
                width: '100%', padding: '12px 14px', border: 'none', cursor: 'pointer',
                background: isOpen ? `${rule.color}10` : C.white,
                display: 'flex', alignItems: 'center', gap: 10, transition: 'background .2s',
              }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: isOpen ? rule.color : rule.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
                color: isOpen ? C.white : rule.color,
              }}>
                {rule.id}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text, flex: 1, textAlign: 'left' as const }}>
                {rule.title}
              </span>
              <span style={{
                fontSize: 12, color: isOpen ? rule.color : C.text3,
                display: 'inline-block', transition: 'transform .2s',
                transform: isOpen ? 'rotate(180deg)' : 'none',
              }}>▾</span>
            </button>

            {/* Contenu */}
            {isOpen && (
              <div style={{ padding: '0 14px 14px', background: C.white }}>
                {/* Description */}
                <div style={{
                  background: rule.bg, borderLeft: `3px solid ${rule.color}`,
                  borderRadius: '0 10px 10px 0', padding: '10px 12px', marginBottom: 12,
                }}>
                  <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.7 }}>{rule.content}</p>
                </div>

                {/* Tableau */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                  {rule.rows.map((r, ri) => (
                    <div key={ri} style={{
                      display: 'grid', gridTemplateColumns: '36px 1fr 52px 1fr',
                      gap: 6, alignItems: 'center',
                      background: ri % 2 === 0 ? C.bg : C.white,
                      padding: '7px 8px', borderRadius: 8,
                    }}>
                      <div style={{
                        fontFamily: "'Noto Naskh Arabic','Amiri',serif",
                        fontSize: 20, color: rule.color,
                        textAlign: 'center' as const, direction: 'rtl', lineHeight: 1,
                      }}>{r.sign}</div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{r.name}</span>
                        {r.sound && <span style={{ fontSize: 10, color: C.text3 }}> {r.sound}</span>}
                      </div>
                      <div style={{
                        fontFamily: "'Noto Naskh Arabic','Amiri',serif",
                        fontSize: 18, color: rule.color,
                        textAlign: 'center' as const, direction: 'rtl',
                        background: `${rule.color}12`, borderRadius: 6, padding: '2px 4px',
                      }}>{r.example}</div>
                      <div style={{ fontSize: 10, color: C.text2, fontStyle: 'italic' }}>{r.meaning}</div>
                    </div>
                  ))}
                </div>

                {/* Exemple cliquable */}
                <div style={{
                  background: `${rule.color}10`, border: `1.5px solid ${rule.color}30`,
                  borderRadius: 10, padding: '10px 12px',
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: rule.color, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>
                    Exemple
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
                    <button onClick={() => playAudio(rule.example.ar)} title="Écouter"
                      style={{
                        fontFamily: "'Noto Naskh Arabic','Amiri',serif",
                        fontSize: 28, color: rule.color, direction: 'rtl',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      }}>
                      {rule.example.ar}
                    </button>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{rule.example.tr}</p>
                      <p style={{ fontSize: 11, color: C.text2 }}>{rule.example.fr}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 10, color: C.text3, marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
                    💡 {rule.example.note}
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL — POPUP CENTRÉ
// ══════════════════════════════════════════════════════════════
interface ReferencesPanelProps {
  initialTab?: 'alphabet' | 'rules'
  onClose: () => void
}

export function ReferencesPanel({ initialTab = 'alphabet', onClose }: ReferencesPanelProps) {
  const [tab, setTab] = useState<'alphabet' | 'rules'>(initialTab)

  useEffect(() => { setTab(initialTab) }, [initialTab])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(26,26,46,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 560, maxHeight: '88vh',
        background: C.white, borderRadius: 22,
        boxShadow: '0 24px 80px rgba(26,26,46,.3)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${C.violetDk}, ${C.violet})`,
          padding: '16px 20px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 2 }}>📖 Références</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Aide-mémoire — Alphabet & Règles</p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            cursor: 'pointer', color: C.white, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', borderBottom: `2px solid ${C.border}`, background: C.bg, flexShrink: 0 }}>
          {([
            { key: 'alphabet' as const, label: '🔤 Alphabet', sub: '28 lettres' },
            { key: 'rules'    as const, label: '📋 Règles',   sub: `${RULES.length} règles` },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '11px 8px', border: 'none', cursor: 'pointer',
                background: 'transparent',
                borderBottom: tab === t.key ? `3px solid ${C.violet}` : '3px solid transparent',
                marginBottom: -2, transition: 'all .15s',
              }}>
              <div style={{ fontSize: 13, fontWeight: tab === t.key ? 700 : 600, color: tab === t.key ? C.violet : C.text2 }}>
                {t.label}
              </div>
              <div style={{ fontSize: 10, color: C.text3 }}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 20px' }}>
          {tab === 'alphabet' ? <AlphabetGrid /> : <RulesList />}
        </div>

        {/* Pied */}
        <div style={{
          padding: '8px 14px', borderTop: `1px solid ${C.border}`,
          background: C.bg, flexShrink: 0, textAlign: 'center' as const,
        }}>
          <p style={{ fontSize: 10, color: C.text3 }}>
            <strong>Échap</strong> ou clic extérieur pour fermer
          </p>
        </div>
      </div>
    </div>
  )
}