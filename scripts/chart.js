function renderCharts(data) {
    const generos = {};
    const residencias = {};
    const edades = {};

    data.forEach(row => {
        const genero = row["¿Qué género eres?"] || "No especificado";
        const residencia = row["¿De dónde eres?"] || "No especificado";
        const edad = row["¿Qué edad tienes?"] || "No especificado";

        generos[genero] = (generos[genero] || 0) + 1;
        residencias[residencia] = (residencias[residencia] || 0) + 1;
        edades[edad] = (edades[edad] || 0) + 1;
    });

    createPieChart("chart-genero", "Género", generos);
    createPieChart("chart-residencia", "Lugar de origen", residencias);
    createPieChart("chart-edad", "Edad", edades);
}

function createPieChart(canvasId, label, dataObj) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, {
        type: "pie",  
        data: {
            labels: Object.keys(dataObj),
            datasets: [{
                label: label,
                data: Object.values(dataObj),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#8BC34A', '#00BCD4', '#E91E63', '#795548'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: label }
            }
        }
    });
}

if (typeof loadView === 'function') {
        loadView('report');
    }