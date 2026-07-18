import re

with open('translations.js', 'r', encoding='utf-8') as f:
    content = f.read()

it_keys = """
        "azionariato.title": "Azionariato",
        "azionariato.schemaBtn": "SCHEMA",
        "azionariato.tableTitle": "Distribuzione Quote e Lista Investitori",
        "azionariato.colPartner": "Partner",
        "azionariato.colType": "Tipo",
        "azionariato.colDet": "Det. %",
        "azionariato.colSubscribed": "Sottoscritto",
        "azionariato.colPaid": "Versato",
        "azionariato.chartTypeLabel": "Tipo Grafico:",
        "azionariato.schemaTitle": "Struttura Societaria",
        "azionariato.classA": "Classe A",
        "azionariato.classB": "Classe B",
        "azionariato.subtotalA": "Subtotale Classe A",
        "azionariato.subtotalB": "Subtotale Classe B",
        "azionariato.grandTotal": "TOTALE GENERALE",
        "azionariato.shareholder": "Azionista",
"""

en_keys = """
        "azionariato.title": "Shareholders",
        "azionariato.schemaBtn": "SCHEMA",
        "azionariato.tableTitle": "Share Distribution and Investors List",
        "azionariato.colPartner": "Partner",
        "azionariato.colType": "Type",
        "azionariato.colDet": "Share %",
        "azionariato.colSubscribed": "Subscribed",
        "azionariato.colPaid": "Paid",
        "azionariato.chartTypeLabel": "Chart Type:",
        "azionariato.schemaTitle": "Corporate Structure",
        "azionariato.classA": "Class A",
        "azionariato.classB": "Class B",
        "azionariato.subtotalA": "Class A Subtotal",
        "azionariato.subtotalB": "Class B Subtotal",
        "azionariato.grandTotal": "GRAND TOTAL",
        "azionariato.shareholder": "Shareholder",
"""

fr_keys = """
        "azionariato.title": "Actionnariat",
        "azionariato.schemaBtn": "SCHÉMA",
        "azionariato.tableTitle": "Répartition des parts et liste des investisseurs",
        "azionariato.colPartner": "Partenaire",
        "azionariato.colType": "Type",
        "azionariato.colDet": "Part %",
        "azionariato.colSubscribed": "Souscrit",
        "azionariato.colPaid": "Payé",
        "azionariato.chartTypeLabel": "Type de graphique :",
        "azionariato.schemaTitle": "Structure de l'entreprise",
        "azionariato.classA": "Classe A",
        "azionariato.classB": "Classe B",
        "azionariato.subtotalA": "Sous-total Classe A",
        "azionariato.subtotalB": "Sous-total Classe B",
        "azionariato.grandTotal": "TOTAL GÉNÉRAL",
        "azionariato.shareholder": "Actionnaire",
"""

# Inject correctly
# IT
content = re.sub(r'(it:\s*\{[^}]+?\"nav\.editLayout\":\s*\"Modifica Layout\",)', r'\1' + it_keys, content)
# EN
content = re.sub(r'(en:\s*\{[^}]+?\"nav\.editLayout\":\s*\"Edit Layout\",)', r'\1' + en_keys, content)
# FR
content = re.sub(r'(fr:\s*\{[^}]+?\"nav\.editLayout\":\s*\"Modifier Disposition\",)', r'\1' + fr_keys, content)

with open('translations.js', 'w', encoding='utf-8') as f:
    f.write(content)
