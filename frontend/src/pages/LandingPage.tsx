import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FEATURES = [
  { icon: '🔤', title: 'Alphabet augmenté',    desc: 'Chaque lettre arabe prend vie avec animations 3D, phonétique visuelle et tracé guidé en temps réel.' },
  { icon: '🎙️', title: 'Reconnaissance vocale', desc: 'Notre IA analyse votre prononciation et la corrige avec précision grâce à Whisper et Wav2Vec2.' },
  { icon: '🧠', title: 'IA personnalisée',      desc: "Le parcours s'adapte à votre rythme — un modèle prédictif anticipe vos oublis avant qu'ils arrivent." },
  { icon: '🌍', title: 'Trilingue natif',        desc: 'Interface en français, espagnol et anglais — conçue pour 2 milliards d\'apprenants potentiels.' },
  { icon: '🏆', title: 'Neuro-gamification',    desc: 'XP, badges, streaks et défis conçus pour maintenir votre motivation sur la durée.' },
  { icon: '📖', title: '12 modules complets',   desc: "De l'alphabet à la lecture coranique — un curriculum structuré vers la maîtrise complète." },
]

const STATS = [
  { value: '280M', label: 'Francophones' },
  { value: '12',   label: 'Modules'      },
  { value: '300+', label: 'Leçons'       },
  { value: '3',    label: 'Langues'      },
]

const ARABIC_CHARS = ['ا','ب','ت','ج','د','ر','س','ع','ف','ق','ل','م','ن','ه','و','ي']
const NAV_LINKS = ['Fonctionnalités','Curriculum','Tarifs','À propos']

function LangDadLogo({ size = 48 }: { size?: number }) {
  const h = size
  const w = size * 3.6
  return (
    <svg width={w} height={h} viewBox="0 0 144 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 40 C6 24 14 13 24 10 C34 13 42 24 42 40" stroke="#1A8A8A" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="24" y1="10" x2="24" y2="40" stroke="#C9953A" strokeWidth="2" strokeLinecap="round"/>
      <line x1="6"  y1="40" x2="42" y2="40" stroke="#1A8A8A" strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="24" cy="10" r="2.6" fill="#C9953A"/>
      <text x="10" y="34" fontFamily="'Noto Naskh Arabic',serif" fontSize="15" fill="#C9953A" fontWeight="700">لد</text>
      <text x="52" y="27" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="22" fill="#2C3E50" fontWeight="600" letterSpacing="0.4">Lang</text>
      <text x="96" y="27" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="22" fill="#1A8A8A" fontWeight="600" letterSpacing="0.4">Dad</text>
      <line x1="52" y1="32" x2="138" y2="32" stroke="#E4DDD2" strokeWidth="0.8"/>
      <text x="52" y="43" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="#8A9BB0" letterSpacing="2.2">LEARN ARABIC</text>
    </svg>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const navRef      = useRef<HTMLElement>(null)
  const titleRef    = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef      = useRef<HTMLDivElement>(null)
  const badgeRef    = useRef<HTMLDivElement>(null)
  const statsRef    = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const floatRefs   = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(navRef.current, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
        .fromTo(badgeRef.current, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, '-=0.3')
        .fromTo(titleRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, '-=0.3')
        .fromTo(subtitleRef.current, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
        .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')

      gsap.fromTo(floatRefs.current.filter(Boolean),
        { opacity: 0, scale: 0.4, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 1.4, ease: 'back.out(1.6)', stagger: { amount: 1.8, from: 'random' }, delay: 0.6 }
      )
      floatRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.to(el, { y: -10 + (i % 3) * 5, x: -5 + (i % 4) * 3, rotation: -6 + (i % 5) * 3, duration: 3.5 + (i % 4) * 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.12 })
      })
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (statsRef.current)
        gsap.fromTo(statsRef.current.querySelectorAll('.stat-item'),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.08, scrollTrigger: { trigger: statsRef.current, start: 'top 82%' } })
      if (featuresRef.current)
        gsap.fromTo(featuresRef.current.querySelectorAll('.feature-card'),
          { opacity: 0, y: 40, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power2.out', stagger: 0.07, scrollTrigger: { trigger: featuresRef.current, start: 'top 78%' } })
    })
    return () => ctx.revert()
  }, [])

  const onHover = (e: React.MouseEvent<HTMLElement>) => gsap.to(e.currentTarget, { scale: 1.04, duration: 0.2, ease: 'power2.out' })
  const onLeave = (e: React.MouseEvent<HTMLElement>) => gsap.to(e.currentTarget, { scale: 1, duration: 0.25, ease: 'back.out(2)' })

  const POSITIONS = [
    {top:'7%', left:'5%', s:100},{top:'11%',left:'80%',s:80},{top:'24%',left:'91%',s:120},
    {top:'54%',left:'2%', s:70}, {top:'68%',left:'87%',s:95},{top:'80%',left:'14%',s:85},
    {top:'17%',left:'44%',s:50},{top:'38%',left:'76%',s:65},{top:'63%',left:'54%',s:45},
    {top:'88%',left:'58%',s:75},{top:'34%',left:'17%',s:58},{top:'74%',left:'33%',s:90},
    {top:'49%',left:'94%',s:48},{top:'4%', left:'28%',s:62},{top:'91%',left:'78%',s:54},
    {top:'44%',left:'41%',s:40},
  ]

  return (
    <div style={{ background:'#F7F3EE', color:'#2C3E50', fontFamily:"'Cormorant Garamond',Georgia,serif", minHeight:'100vh', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=Noto+Naskh+Arabic:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .nav-link{color:#5A7080;text-decoration:none;font-family:'DM Sans',sans-serif;font-size:14px;transition:color .2s}
        .nav-link:hover{color:#1A8A8A}
        .btn-p{display:inline-flex;align-items:center;gap:8px;background:#1A8A8A;color:#fff;padding:13px 28px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;text-decoration:none;transition:background .2s}
        .btn-p:hover{background:#0D5C5C}
        .btn-o{display:inline-flex;align-items:center;gap:8px;border:1.5px solid #1A8A8A;color:#1A8A8A;padding:13px 28px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:14px;text-decoration:none;transition:all .2s}
        .btn-o:hover{background:rgba(26,138,138,.06)}
        .nlogin{color:#5A7080;text-decoration:none;font-family:'DM Sans',sans-serif;font-size:13px;padding:8px 16px;border-radius:6px;border:1px solid #E4DDD2;transition:all .2s}
        .nlogin:hover{border-color:#1A8A8A;color:#1A8A8A}
        .nsignup{background:#1A8A8A;color:#fff;text-decoration:none;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:8px 18px;border-radius:6px;transition:background .2s}
        .nsignup:hover{background:#0D5C5C}
        .fcard{background:#fff;border:1px solid #E4DDD2;border-radius:12px;padding:32px 28px;transition:all .3s;box-shadow:0 2px 12px rgba(44,62,80,.04)}
        .fcard:hover{border-color:#2DB8B8;box-shadow:0 8px 32px rgba(26,138,138,.1);transform:translateY(-4px)}
        .af{position:absolute;font-family:'Noto Naskh Arabic',serif;color:rgba(26,138,138,.1);user-select:none;pointer-events:none;font-weight:700}
        @media(max-width:768px){.nl{display:none!important}.htitle{font-size:clamp(36px,9vw,64px)!important}.fgrid{grid-template-columns:1fr!important}.sgrid{grid-template-columns:repeat(2,1fr)!important}.cgrid{grid-template-columns:1fr!important;gap:40px!important}}
        @keyframes sp{0%,100%{opacity:.4}50%{opacity:1}}
      `}</style>

      {/* NAV */}
      <nav ref={navRef} style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'0 5%',height:70,display:'flex',alignItems:'center',justifyContent:'space-between',background:scrolled?'rgba(247,243,238,.96)':'transparent',backdropFilter:scrolled?'blur(20px)':'none',borderBottom:scrolled?'1px solid rgba(44,62,80,.08)':'1px solid transparent',transition:'all .35s ease' }}>
        <Link to="/" style={{ textDecoration:'none' }}><LangDadLogo size={44} /></Link>
        <div className="nl" style={{ display:'flex', gap:32 }}>
          {NAV_LINKS.map((l) => <a key={l} href={`#${l.toLowerCase()}`} className="nav-link">{l}</a>)}
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Link to="/login"    className="nlogin"  onMouseEnter={onHover} onMouseLeave={onLeave}>Se connecter</Link>
          <Link to="/register" className="nsignup" onMouseEnter={onHover} onMouseLeave={onLeave}>S'inscrire</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position:'relative',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'120px 5% 80px',overflow:'hidden',background:'linear-gradient(160deg,#F7F3EE 0%,#EEE8DF 50%,#E8F4F4 100%)' }}>
        <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(26,138,138,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(26,138,138,.04) 1px,transparent 1px)',backgroundSize:'48px 48px',pointerEvents:'none' }} />
        <div style={{ position:'absolute',top:'35%',left:'50%',transform:'translate(-50%,-50%)',width:700,height:700,background:'radial-gradient(circle,rgba(201,149,58,.06) 0%,transparent 65%)',pointerEvents:'none' }} />

        {/* Floating chars */}
        <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
          {ARABIC_CHARS.map((char, i) => {
            const p = POSITIONS[i] ?? { top:'50%', left:'50%', s:70 }
            return <span key={i} ref={(el) => { floatRefs.current[i] = el }} className="af" style={{ top:p.top, left:p.left, fontSize:p.s, opacity:0 }}>{char}</span>
          })}
        </div>

        <div style={{ position:'relative',zIndex:2,textAlign:'center',maxWidth:820 }}>
          <div ref={badgeRef} style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(26,138,138,.1)',border:'1px solid rgba(26,138,138,.25)',borderRadius:40,padding:'6px 18px',marginBottom:32,fontSize:12,color:'#0D5C5C',fontFamily:'DM Sans,sans-serif',letterSpacing:'.08em' }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'#1A8A8A',display:'inline-block',animation:'sp 2s ease-in-out infinite' }} />
            PHASE 1 · BÊTA OUVERTE · GRATUIT
          </div>

          <h1 ref={titleRef} className="htitle" style={{ fontSize:'clamp(44px,8vw,86px)',fontWeight:300,lineHeight:1.08,letterSpacing:'-.02em',marginBottom:28,color:'#2C3E50' }}>
            Apprenez l'arabe<br />
            <em style={{ fontStyle:'italic',color:'#1A8A8A',fontWeight:300 }}>avec intelligence</em>
          </h1>

          <p ref={subtitleRef} style={{ fontSize:18,lineHeight:1.75,color:'#5A7080',maxWidth:560,margin:'0 auto 48px',fontFamily:'DM Sans,sans-serif',fontWeight:300 }}>
            LangDad est une plateforme d'apprentissage neuro-gamifiée qui combine IA générative, reconnaissance vocale et gamification pour emmener des millions d'apprenants vers la maîtrise de l'arabe.
          </p>

          <div ref={ctaRef} style={{ display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:36 }}>
            <Link to="/register" className="btn-p" onMouseEnter={onHover} onMouseLeave={onLeave} style={{ fontSize:15,padding:'14px 32px' }}>Commencer gratuitement →</Link>
            <a href="#fonctionnalités" className="btn-o" onMouseEnter={onHover} onMouseLeave={onLeave} style={{ fontSize:15,padding:'14px 32px' }}>Découvrir le projet</a>
          </div>

          <p style={{ fontSize:13,color:'#8A9BB0',fontFamily:'DM Sans,sans-serif' }}>Pour les francophones · hispanophones · anglophones</p>
        </div>

        <div style={{ position:'absolute',bottom:32,left:'50%',width:1,height:52,background:'linear-gradient(to bottom,transparent,#1A8A8A)',animation:'sp 2s ease-in-out infinite' }} />
      </section>

      {/* STATS */}
      <section ref={statsRef} style={{ background:'#fff',borderTop:'1px solid #E4DDD2',borderBottom:'1px solid #E4DDD2',padding:'60px 5%' }}>
        <div className="sgrid" style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',maxWidth:800,margin:'0 auto' }}>
          {STATS.map(({ value, label }, i) => (
            <div key={label} className="stat-item" style={{ textAlign:'center',padding:'20px 16px',borderRight:i<3?'1px solid #E4DDD2':'none' }}>
              <div style={{ fontSize:48,fontWeight:300,color:'#1A8A8A',lineHeight:1,marginBottom:6,letterSpacing:'-.02em' }}>{value}</div>
              <div style={{ fontSize:12,color:'#8A9BB0',fontFamily:'DM Sans,sans-serif',letterSpacing:'.1em',textTransform:'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="fonctionnalités" ref={featuresRef} style={{ padding:'100px 5%',background:'#F7F3EE' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:64 }}>
            <p style={{ fontSize:11,letterSpacing:'.18em',color:'#1A8A8A',fontFamily:'DM Sans,sans-serif',textTransform:'uppercase',marginBottom:14 }}>Fonctionnalités</p>
            <h2 style={{ fontSize:'clamp(28px,4.5vw,48px)',fontWeight:300,color:'#2C3E50',lineHeight:1.18,letterSpacing:'-.01em' }}>
              Une expérience d'apprentissage<br /><em style={{ color:'#1A8A8A',fontStyle:'italic' }}>sans précédent</em>
            </h2>
          </div>
          <div className="fgrid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="fcard">
                <div style={{ fontSize:34,marginBottom:18 }}>{icon}</div>
                <h3 style={{ fontSize:18,fontWeight:500,color:'#2C3E50',marginBottom:10,fontFamily:'DM Sans,sans-serif' }}>{title}</h3>
                <p style={{ fontSize:14.5,lineHeight:1.72,color:'#5A7080',fontFamily:'DM Sans,sans-serif',fontWeight:300 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section id="curriculum" style={{ padding:'100px 5%',background:'#fff' }}>
        <div className="cgrid" style={{ maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'center' }}>
          <div>
            <p style={{ fontSize:11,letterSpacing:'.18em',color:'#1A8A8A',fontFamily:'DM Sans,sans-serif',textTransform:'uppercase',marginBottom:14 }}>Curriculum</p>
            <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)',fontWeight:300,color:'#2C3E50',lineHeight:1.22,marginBottom:20 }}>
              12 modules pour aller<br /><em style={{ color:'#C9953A',fontStyle:'italic' }}>de zéro à ambassadeur</em>
            </h2>
            <p style={{ fontSize:15.5,lineHeight:1.8,color:'#5A7080',fontFamily:'DM Sans,sans-serif',fontWeight:300,marginBottom:32 }}>
              Un parcours progressif de l'alphabet aux textes coraniques, avec immersion progressive de 10% à 100% en arabe.
            </p>
            <Link to="/register" className="btn-p" onMouseEnter={onHover} onMouseLeave={onLeave}>Voir le programme →</Link>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {[
              { num:'01', title:"L'Alphabet Augmenté",  badge:'Disponible', bg:'rgba(26,138,138,.1)',  tc:'#0D5C5C' },
              { num:'02', title:'Les Premiers Pas',     badge:'Disponible', bg:'rgba(26,138,138,.1)',  tc:'#0D5C5C' },
              { num:'03', title:'Le Voyageur Temporel', badge:'Bientôt',    bg:'rgba(201,149,58,.1)', tc:'#8A6320' },
              { num:'04', title:"L'Éloquence",          badge:'Bientôt',    bg:'rgba(201,149,58,.1)', tc:'#8A6320' },
              { num:'··', title:'Modules 5 → 12',       badge:'En cours',   bg:'rgba(44,62,80,.06)',  tc:'#8A9BB0' },
            ].map(({ num, title, badge, bg, tc }) => (
              <div key={num} style={{ display:'flex',alignItems:'center',gap:16,padding:'14px 18px',background:'#F7F3EE',border:'1px solid #E4DDD2',borderRadius:8,transition:'border-color .2s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2DB8B8' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E4DDD2' }}
              >
                <span style={{ fontSize:12,color:'#8A9BB0',fontFamily:'DM Sans,sans-serif',minWidth:24 }}>{num}</span>
                <span style={{ flex:1,fontSize:15,color:'#2C3E50',fontFamily:'DM Sans,sans-serif' }}>{title}</span>
                <span style={{ fontSize:11,color:tc,background:bg,padding:'3px 10px',borderRadius:20,fontFamily:'DM Sans,sans-serif',letterSpacing:'.04em' }}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding:'120px 5%',textAlign:'center',background:'linear-gradient(160deg,#F7F3EE 0%,#E8F4F4 100%)',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:500,height:500,background:'radial-gradient(circle,rgba(26,138,138,.06) 0%,transparent 70%)',pointerEvents:'none' }} />
        <div style={{ position:'relative',zIndex:2 }}>
          <span style={{ fontFamily:'Noto Naskh Arabic,serif',fontSize:64,color:'rgba(201,149,58,.2)',display:'block',marginBottom:20 }}>بسم الله</span>
          <h2 style={{ fontSize:'clamp(28px,4.5vw,50px)',fontWeight:300,color:'#2C3E50',marginBottom:18,letterSpacing:'-.01em' }}>
            Prêt à commencer<br /><em style={{ color:'#1A8A8A',fontStyle:'italic' }}>votre voyage ?</em>
          </h2>
          <p style={{ fontSize:16,color:'#5A7080',fontFamily:'DM Sans,sans-serif',fontWeight:300,maxWidth:460,margin:'0 auto 40px' }}>
            Rejoignez LangDad gratuitement et commencez le Module 1 aujourd'hui. Aucune carte bancaire requise.
          </p>
          <Link to="/register" className="btn-p" style={{ fontSize:15,padding:'15px 36px' }} onMouseEnter={onHover} onMouseLeave={onLeave}>
            Créer mon compte gratuit →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid #E4DDD2',padding:'36px 5%',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16,background:'#fff' }}>
        <LangDadLogo size={36} />
        <p style={{ fontSize:12,color:'#8A9BB0',fontFamily:'DM Sans,sans-serif' }}>© 2026 LangDad · langdad.com</p>
        <div style={{ display:'flex',gap:24 }}>
          {['CGU','Confidentialité','Contact'].map((l) => (
            <a key={l} href="#" style={{ fontSize:12,color:'#8A9BB0',fontFamily:'DM Sans,sans-serif',textDecoration:'none',transition:'color .2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#1A8A8A' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#8A9BB0' }}
            >{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}