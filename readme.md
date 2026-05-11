Projet LangDad ( domaine : langdad.com )
Conseils technique:
# 1- Quand on modifie un fichier json, on doit applique la commande suivante depuis le backend
      # Créer un nouveau module
      python seed_module.py --module 1 --degree 1

      # Réinitialiser complètement (dev uniquement)
      python seed_module.py --module 1 --degree 1 --reset

      # Mettre à jour le contenu en production (progressions intactes)
      python seed_module.py --module 1 --degree 1 --update

# 2- Générer audio depuis le dossier racine langdad
   > python generate_audio.py --api elevenlabs --only syllables --key sk_da0d14a9a4ba15a1179e1679f8fa1e7c19c9bae78c5e61d6

# 3- Ouitils:
   1- 
      Clavier arabe pour ajouter les harakat
         https://www.clavier-arabe.com/
      Polices arabe
         https://arabiccalligraphygenerator.onlin

   1- Fichies:
   Backend
      Racine : langdad
      generate_audio.py : générer les fichiers audio dans public/assets/audio
      langdad/backend/curriculum/d1
      module1_d1_content.json : contenu des cours et exercices du module 1 du premier degré
      chaque module de chaque degré à son fichier json


2- connexion :
   User:
      Login: admin@arabiq.com\
      password: admin123
   Super Admin:
      login : superadmin@arabiq.com
      Mot de passe : SuperAdmin2024! 