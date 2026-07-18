import re

with open('app2.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Subtotal A
content = content.replace(
    '<td style="font-weight: bold; color: #3b82f6; text-align: right;">Subtotale Classe A</td>',
    '<td style="font-weight: bold; color: #3b82f6; text-align: right;" data-i18n="azionariato.subtotalA">Subtotale Classe A</td>'
)

# Subtotal B
content = content.replace(
    '<td style="font-weight: bold; color: #10b981; text-align: right;">Subtotale Classe B</td>',
    '<td style="font-weight: bold; color: #10b981; text-align: right;" data-i18n="azionariato.subtotalB">Subtotale Classe B</td>'
)

# Grand Total
content = content.replace(
    '<td style="font-size: 1.1rem; text-align: right;">TOTALE GENERALE</td>',
    '<td style="font-size: 1.1rem; text-align: right;" data-i18n="azionariato.grandTotal">TOTALE GENERALE</td>'
)

# Azionista
content = content.replace(
    'let displayName = currentUserRole === "ADMIN" ? item.partner : "Azionista " + idStr;',
    'let displayName = currentUserRole === "ADMIN" ? item.partner : (typeof t === "function" ? t("azionariato.shareholder") : "Azionista") + " " + idStr;'
)

# translatePage() call
if 'translatePage();' not in content.split('updateAzionariatoChartData(labels, values, bgColors);')[1].split('}')[0]:
    content = content.replace(
        'updateAzionariatoChartData(labels, values, bgColors);\n}',
        'updateAzionariatoChartData(labels, values, bgColors);\n    if (typeof translatePage === \'function\') translatePage();\n}'
    )

with open('app2.js', 'w', encoding='utf-8') as f:
    f.write(content)
