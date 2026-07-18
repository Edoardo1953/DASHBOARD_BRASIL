import re

with open('translations.js', 'r', encoding='utf-8') as f:
    content = f.read()

if '"nav.changePassword"' not in content:
    # it
    content = content.replace('"nav.logout": "Logout",', '"nav.logout": "Logout",\n        "nav.azionariato": "Azionariato",\n        "nav.changePassword": "Modifica Password",', 1)
    # en
    content = content.replace('"nav.logout": "Logout",', '"nav.logout": "Logout",\n        "nav.azionariato": "Shareholders",\n        "nav.changePassword": "Change Password",', 1)
    # fr
    content = content.replace('"nav.logout": "Déconnexion",', '"nav.logout": "Déconnexion",\n        "nav.azionariato": "Actionnariat",\n        "nav.changePassword": "Modifier Mot de passe",', 1)

with open('translations.js', 'w', encoding='utf-8') as f:
    f.write(content)
