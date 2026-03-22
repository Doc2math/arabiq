import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const fr = {
  translation: {
    app: { name: 'ArabiQ', tagline: "Maîtrisez l'arabe, une lettre à la fois." },
    nav: { home: 'Accueil', learn: 'Apprendre', profile: 'Profil', settings: 'Paramètres' },
    auth: {
      login: 'Se connecter', register: 'Créer un compte', logout: 'Déconnexion',
      email: 'Email', password: 'Mot de passe', username: "Nom d'utilisateur",
      nativeLanguage: 'Votre langue', loginTitle: 'Bon retour !',
      registerTitle: 'Commencez votre voyage', noAccount: 'Pas encore de compte ?',
      hasAccount: 'Déjà un compte ?',
      errors: { invalidCredentials: 'Email ou mot de passe incorrect.', emailTaken: 'Email déjà utilisé.' },
    },
    dashboard: {
      welcome: 'Bonjour, {{name}} !', continueLesson: 'Continuer',
      streak: '{{count}} jour de suite', xp: '{{count}} XP', level: 'Niveau {{level}}',
    },
    lesson: {
      check: 'Vérifier', continue: 'Continuer', correct: 'Excellent !',
      incorrect: 'Pas tout à fait…', skip: 'Passer', complete: 'Leçon terminée !',
      xpEarned: '+{{xp}} XP',
    },
    modules: {
      locked: 'Verrouillé', completed: 'Terminé', inProgress: 'En cours',
      lessons: '{{count}} leçons',
    },
    errors: { generic: 'Une erreur est survenue.', network: 'Problème de connexion.' },
  },
}

const es = {
  translation: {
    app: { name: 'ArabiQ', tagline: 'Domina el árabe, una letra a la vez.' },
    nav: { home: 'Inicio', learn: 'Aprender', profile: 'Perfil', settings: 'Ajustes' },
    auth: {
      login: 'Iniciar sesión', register: 'Crear cuenta', logout: 'Cerrar sesión',
      email: 'Correo', password: 'Contraseña', username: 'Nombre de usuario',
      nativeLanguage: 'Tu idioma', loginTitle: '¡Bienvenido de vuelta!',
      registerTitle: 'Comienza tu viaje', noAccount: '¿No tienes cuenta?',
      hasAccount: '¿Ya tienes cuenta?',
      errors: { invalidCredentials: 'Email o contraseña incorrectos.', emailTaken: 'Email ya en uso.' },
    },
    dashboard: {
      welcome: '¡Hola, {{name}}!', continueLesson: 'Continuar',
      streak: '{{count}} día seguido', xp: '{{count}} XP', level: 'Nivel {{level}}',
    },
    lesson: {
      check: 'Verificar', continue: 'Continuar', correct: '¡Excelente!',
      incorrect: 'No del todo…', skip: 'Saltar', complete: '¡Lección completada!',
      xpEarned: '+{{xp}} XP',
    },
    modules: { locked: 'Bloqueado', completed: 'Completado', inProgress: 'En progreso', lessons: '{{count}} lecciones' },
    errors: { generic: 'Ocurrió un error.', network: 'Problema de conexión.' },
  },
}

const en = {
  translation: {
    app: { name: 'ArabiQ', tagline: 'Master Arabic, one letter at a time.' },
    nav: { home: 'Home', learn: 'Learn', profile: 'Profile', settings: 'Settings' },
    auth: {
      login: 'Sign in', register: 'Create account', logout: 'Sign out',
      email: 'Email', password: 'Password', username: 'Username',
      nativeLanguage: 'Your language', loginTitle: 'Welcome back!',
      registerTitle: 'Start your journey', noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      errors: { invalidCredentials: 'Incorrect email or password.', emailTaken: 'Email already taken.' },
    },
    dashboard: {
      welcome: 'Hello, {{name}}!', continueLesson: 'Continue',
      streak: '{{count}} day streak', xp: '{{count}} XP', level: 'Level {{level}}',
    },
    lesson: {
      check: 'Check', continue: 'Continue', correct: 'Excellent!',
      incorrect: 'Not quite…', skip: 'Skip', complete: 'Lesson complete!',
      xpEarned: '+{{xp}} XP',
    },
    modules: { locked: 'Locked', completed: 'Completed', inProgress: 'In progress', lessons: '{{count}} lessons' },
    errors: { generic: 'Something went wrong.', network: 'Connection problem.' },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { fr, es, en },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'es', 'en'],
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  })

export default i18n