import re

with open('translations.js', 'r', encoding='utf-8') as f:
    content = f.read()

# First, clean up the duplicate entries
content = re.sub(r'\s*\"nav\.azionariato\": \"Shareholders\",\n\s*\"nav\.changePassword\": \"Change Password\",', '', content)
content = re.sub(r'\s*\"nav\.azionariato\": \"Azionariato\",\n\s*\"nav\.changePassword\": \"Modifica Password\",', '', content)
content = re.sub(r'\s*\"nav\.azionariato\": \"Actionnariat\",\n\s*\"nav\.changePassword\": \"Modifier Mot de passe\",', '', content)

# Inject correctly
# IT
content = re.sub(r'(it:\s*\{[^}]+?\"nav\.logout\":\s*\"Logout\",)', r'\1\n        "nav.azionariato": "Azionariato",\n        "nav.changePassword": "Modifica Password",', content)
# EN
content = re.sub(r'(en:\s*\{[^}]+?\"nav\.logout\":\s*\"Logout\",)', r'\1\n        "nav.azionariato": "Shareholders",\n        "nav.changePassword": "Change Password",', content)
# FR
content = re.sub(r'(fr:\s*\{[^}]+?\"nav\.logout\":\s*\"D[^\"]+connexion\",)', r'\1\n        "nav.azionariato": "Actionnariat",\n        "nav.changePassword": "Modifier Mot de passe",', content)

with open('translations.js', 'w', encoding='utf-8') as f:
    f.write(content)
