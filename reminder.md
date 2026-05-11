# Traduire le site:
    1- ajouter les clés dans fr.json
    2- commande : backend>python translate_messages.py
    3- recréer les fichiers concernés pour hadocker les clés ( t("cle"))

# Lien clé elevenlabs : 
    https://elevenlabs.io/app/developers/api-keys
# Connexion 
    user:
        gaziz@hotmail.com
        Adnani60
    Admin:
        Login: admin@arabiq.com
        password:admin123
    Super Admin:
        login : superadmin@arabiq.com
        Mot de passe : SuperAdmin2024!
# Créer avec les valeurs par défaut
    python create_superadmin.py

# Créer avec des valeurs personnalisées
    python create_superadmin.py --email aziz@langdad.com --username aziz --password MonPass123!

# Promouvoir un utilisateur existant
    python create_superadmin.py --promote --email aziz@langdad.com
# Clé elevenlabs : 
    sk_9497775b2cd591d81676e10cf0f7ef70db7323d40fc9acb8
    sk_d8c95670d5b6bc36e4b0607bbb57268f2e5aef1e190c6ac7
# Générer les fichiers audio
    pour générer des audios in faut lancer le fichier generate_audio.py depuis la racine:
     langdad> python   backend/generate_audio.py 

# Obtenir mon Token:
>curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"aziz60@hotmail.com\",\"password\":\"aziz1234\"}"

# Fichiers utils
    Backend
        1.
            Lieu :   Backend
            nom:     create_superadmin.py
            utilité : Créer un super admin
            Exécution: depuis le backend
            Commande: backend>python create_superadmin.py 
        2.
            Lieu :   Backend
            nom:     generate_audio.py
            utilité : génére les fichiers audio dans le dossier frontend/public/assets 
            Exécution : depuis la racine, ici langdad
            Commande: langdad> python backend/generate_audio.py --skip-existing --api elevenlabs --key sk_d8c95670d5b6bc36e4b0607bbb57268f2e5aef1e190c6ac7
        3.
            Lieu :   Backend
            nom:     make_admin.py
            utilité : Créer un  admin
            Exécution: depuis le backend 
            Commande: backend>python make_admin.py 
        4.
            Lieu :   Backend
            nom:     seed_module.py
            utilité : Achaque modification des fichiers json qui se trouvent dans le dossier
                      backend/curriculum ce fichier met à jour la base de donnée
            Exécution: depuis le backend en mise à jour:
            Commande: backend>python seed_module.py --module 2 --degree 1 --update
        5.
            Lieu :     backend/app/services
            nom:       writing_sheets.py
            utilité :  Créer les fiches d'entrainement d'écriture manuelle en pdf
            Exécution: automatiquement par lr système. A mettre à jour pour chaque nouveau 
                       module.  
                       MODULES_LETTERS = {
                                1: MODULE1_LETTERS,
                                2: MODULE2_LETTERS,
                            }
                        Ajouter le bloc de lettre du nouveau module et ajouter sont identifiant
                        (2: MODULE2_LETTERS, pour module 2) dans le tableau :MODULES_LETTERS
        6.
            Lieu :     backend
            nom:       audio_delete.py
            utilité :  supprime tous les fichiers audio du dossier public/assets/audio
           

            


