
// --- AZIONARIATO LOGIC ---

const azionariatoData = [
    { partner: 'BELARDI Alfonso', type: 'A', shares: 151461, det: 0.06975526407899342, cap: 302922 },
    { partner: 'VANDI Sergio', type: 'A', shares: 151461, det: 0.06975526407899342, cap: 302922 },
    { partner: 'MURGIA Jean-Pierre', type: 'A', shares: 151461, det: 0.06975526407899342, cap: 302922 },
    { partner: 'BOSI Giannino Stefano', type: 'A', shares: 151461, det: 0.06975526407899342, cap: 302922 },
    { partner: 'CANTON Marco', type: 'A', shares: 151461, det: 0.06975526407899342, cap: 302922 },
    { partner: 'HEMAWITI Susik', type: 'A', shares: 147915, det: 0.06812215610780539, cap: 295830 },
    { partner: 'VIGNOLLE Giorgio', type: 'A', shares: 75733, det: 0.03487878341285485, cap: 151466 },
    { partner: 'STERZI Marco', type: 'A', shares: 75733, det: 0.03487878341285485, cap: 151466 },
    { partner: 'TUBIA Edoardo', type: 'A', shares: 151461, det: 0.06975526407899342, cap: 302922 },
    { partner: 'TUBIA Enrico', type: 'A', shares: 151461, det: 0.06975526407899342, cap: 302922 },
    { partner: 'GLENELG SA', type: 'A', shares: 302933, det: 0.13951559420076268, cap: 605866 },
    { partner: 'ALIX Marylène', type: 'B', shares: 67701, det: 0.031179651087817548, cap: 135402 },
    { partner: 'STERZI Adonella', type: 'B', shares: 40402, det: 0.018607114566254628, cap: 80804 },
    { partner: 'STERZI Marco', type: 'B', shares: 40401, det: 0.018606654016911372, cap: 80802 },
    { partner: 'TUBIA Enrico', type: 'B', shares: 73805, det: 0.033990844279056055, cap: 147610 },
    { partner: 'DESIDERIO Salvatore', type: 'B', shares: 180220, det: 0.08300020264171103, cap: 360440 },
    { partner: 'M.M.M FINANCE SARL.', type: 'B', shares: 106250, det: 0.04893336772101763, cap: 212500 }
];

let azionariatoChartInstance = null;

function renderAzionariato() {
    const tbody = document.getElementById('partners-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let subTotDetA = 0;
    let subTotSottA = 0;
    let subTotVersA = 0;
    
    let subTotDetB = 0;
    let subTotSottB = 0;
    let subTotVersB = 0;
    
    const colors = [
        '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', 
        '#06b6d4', '#14b8a6', '#f43f5e', '#84cc16', '#6366f1', 
        '#d946ef', '#0ea5e9', '#f97316', '#22c55e', '#a855f7',
        '#eab308', '#ef4444'
    ];
    
    const labels = [];
    const values = [];
    const bgColors = [];
    
    let currentClass = "A";
    
    const formatCurrency = (val) => {
        return "&euro; " + val.toLocaleString("it-IT", {minimumFractionDigits: 2, maximumFractionDigits: 2});
    };
    
    azionariatoData.forEach((item, index) => {
        if (item.type !== currentClass && index > 0) {
            const subTr = document.createElement("tr");
            subTr.style.backgroundColor = "rgba(59,130,246,0.05)";
            subTr.innerHTML = `
                <td></td>
                <td style="font-weight: bold; color: #3b82f6; text-align: right;">Subtotale Classe A</td>
                <td></td>
                <td style="font-weight: bold; color: #3b82f6;">${(subTotDetA * 100).toFixed(2)}%</td>
                <td style="font-weight: bold; color: #3b82f6;">${formatCurrency(subTotSottA)}</td>
                <td style="font-weight: bold; color: #3b82f6;">${formatCurrency(subTotVersA)}</td>
            `;
            tbody.appendChild(subTr);
            currentClass = item.type;
        }
        
        const idStr = String(index + 1).padStart(2, "0");
        let displayName = currentUserRole === "ADMIN" ? item.partner : "Azionista " + idStr;
        let displayNameWithId = currentUserRole === "ADMIN" ? idStr + " - " + item.partner : displayName;
        
        labels.push(displayNameWithId);
        values.push(item.det * 100);
        bgColors.push(colors[index % colors.length]);
        
        if (item.type === "A") {
            subTotDetA += item.det;
            subTotSottA += item.cap;
            subTotVersA += item.cap;
        } else {
            subTotDetB += item.det;
            subTotSottB += item.cap;
            subTotVersB += item.cap;
        }
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><div style="width: 12px; height: 12px; border-radius: 3px; background-color: ${bgColors[index]};"></div></td>
            <td style="font-weight: 600; color: var(--text-primary);">${displayNameWithId}</td>
            <td><span style="padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; background: ${item.type === "A" ? "rgba(59,130,246,0.2)" : "rgba(16,185,129,0.2)"}; color: ${item.type === "A" ? "#3b82f6" : "#10b981"};"><span data-i18n="azionariato.class${item.type}">Class ${item.type}</span></span></td>
            <td style="font-weight: bold;">${(item.det * 100).toFixed(2)}%</td>
            <td>${formatCurrency(item.cap)}</td>
            <td style="color: #10b981;">${formatCurrency(item.cap)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    const subTrB = document.createElement("tr");
    subTrB.style.backgroundColor = "rgba(16,185,129,0.05)";
    subTrB.innerHTML = `
        <td></td>
        <td style="font-weight: bold; color: #10b981; text-align: right;">Subtotale Classe B</td>
        <td></td>
        <td style="font-weight: bold; color: #10b981;">${(subTotDetB * 100).toFixed(2)}%</td>
        <td style="font-weight: bold; color: #10b981;">${formatCurrency(subTotSottB)}</td>
        <td style="font-weight: bold; color: #10b981;">${formatCurrency(subTotVersB)}</td>
    `;
    tbody.appendChild(subTrB);
    
    const totDet = subTotDetA + subTotDetB;
    const totSott = subTotSottA + subTotSottB;
    const totVers = subTotVersA + subTotVersB;
    
    const tfoot = document.getElementById("partners-table-foot");
    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td></td>
                <td style="font-size: 1.1rem; text-align: right;">TOTALE GENERALE</td>
                <td></td>
                <td style="color: #f59e0b; font-size: 1.1rem;">${(totDet * 100).toFixed(0)}%</td>
                <td style="font-size: 1.1rem;">${formatCurrency(totSott)}</td>
                <td style="color: #10b981; font-size: 1.1rem;">${formatCurrency(totVers)}</td>
            </tr>
        `;
    }
    
    updateAzionariatoChartData(labels, values, bgColors);
}

function updateAzionariatoChartData(labels, values, bgColors) {
    const ctx = document.getElementById("azionariatoChart");
    if (!ctx) return;
    
    const type = document.getElementById("chartType").value;
    
    if (azionariatoChartInstance) {
        azionariatoChartInstance.destroy();
    }
    
    const chartConfig = {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: bgColors,
                borderWidth: type === "pie" ? 0 : 1,
                borderColor: type === "bar" ? bgColors : undefined
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: type === "pie",
                    position: "right",
                    labels: { color: getComputedStyle(document.body).getPropertyValue("--text-primary") || "#fff" }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ": " + context.raw.toFixed(2) + "%";
                        }
                    }
                },
                datalabels: {
                    color: "#fff",
                    font: { weight: "bold", size: 12 },
                    formatter: function(value, context) {
                        return value > 3 ? context.chart.data.labels[context.dataIndex] : "";
                    },
                    display: type === "pie"
                }
            }
        }
    };
    
    if (type === "bar") {
        chartConfig.options.scales = {
            y: {
                beginAtZero: true,
                ticks: { color: getComputedStyle(document.body).getPropertyValue("--text-secondary") || "#ccc" },
                grid: { color: "rgba(255,255,255,0.1)" }
            },
            x: {
                ticks: { color: getComputedStyle(document.body).getPropertyValue("--text-secondary") || "#ccc", maxRotation: 45, minRotation: 45 },
                grid: { display: false }
            }
        };
        chartConfig.options.plugins.legend.display = false;
    }
    
    if (typeof ChartDataLabels !== "undefined") {
        chartConfig.plugins = [ChartDataLabels];
    }
    
    azionariatoChartInstance = new Chart(ctx, chartConfig);
}

function updateAzionariatoChart() {
    renderAzionariato();
}

function openSchemaModal() {
    document.getElementById("schema-modal").style.display = "flex";
}

function closeSchemaModal() {
    document.getElementById("schema-modal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("schema-modal");
    if(modal) {
        modal.addEventListener("click", (e) => {
            if(e.target === modal) {
                closeSchemaModal();
            }
        });
    }
});
