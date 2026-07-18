import re

with open('translations.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace in EN section
content = re.sub(r'(en:\s*\{[^}]+?\"azionariato\.schemaBtn\":\s*)\"SCHEMA\"', r'\1"STRUCTURE"', content)

with open('translations.js', 'w', encoding='utf-8') as f:
    f.write(content)
