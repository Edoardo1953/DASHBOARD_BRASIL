import re

with open('translations.js', 'r', encoding='utf-8') as f:
    content = f.read()

# First, clean up if they exist
content = re.sub(r'\s*\"nav\.editLayout\": \".*?\",', '', content)
content = re.sub(r'\s*\"action\.saveLayout\": \".*?\",', '', content)

# Inject correctly
# IT
content = re.sub(r'(it:\s*\{[^}]+?\"nav\.changePassword\":\s*\"Modifica Password\",)', r'\1\n        "nav.editLayout": "Modifica Layout",\n        "action.saveLayout": "Salva Layout",', content)
# EN
content = re.sub(r'(en:\s*\{[^}]+?\"nav\.changePassword\":\s*\"Change Password\",)', r'\1\n        "nav.editLayout": "Edit Layout",\n        "action.saveLayout": "Save Layout",', content)
# FR
content = re.sub(r'(fr:\s*\{[^}]+?\"nav\.changePassword\":\s*\"Modifier Mot de passe\",)', r'\1\n        "nav.editLayout": "Modifier Disposition",\n        "action.saveLayout": "Enregistrer Disposition",', content)

with open('translations.js', 'w', encoding='utf-8') as f:
    f.write(content)
