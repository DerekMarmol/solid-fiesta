// js/probabilisticAnalysis.js

// Variables de estado globales para el módulo de análisis probabilístico
let datosExcel = [];
let datosDemograficos = {};
let proporciones = {};
let total = 0;
let columnasDisponibles = [];
let chartInstance; // Instancia de Chart.js para controlar el gráfico

// Referencias a elementos DOM (se inicializarán en initializeProbabilisticView)
let fileInput;
let fileInfo;
let errorInfo;
let analysisSection;
let chartSection;
let varDemografica;
let opcionDemografica;
let preguntaSel;
let respuestaSel;
let tipo;
let x1;
let x2;
let x2container;
let resultado; // Contenedor para los resultados del análisis
let analysisResultsPre; // Elemento <pre> dentro de 'resultado' para mostrar el texto
let graficaCanvas;

/**
 * Función auxiliar para mostrar mensajes de error en la interfaz de usuario.
 * @param {string} mensaje - El mensaje de error a mostrar.
 */
function mostrarError(mensaje) {
    if (errorInfo) {
        errorInfo.innerHTML = mensaje;
        errorInfo.style.display = 'block';
        setTimeout(() => {
            errorInfo.style.display = 'none';
        }, 5000); // Oculta el error después de 5 segundos
    } else {
        console.error("Error (elemento errorInfo no encontrado):", mensaje);
    }
}

/**
 * Maneja la carga de un archivo Excel desde el input de archivo.
 * Procesa el archivo y actualiza los datos internos de la aplicación.
 * @param {Event} event - El evento de cambio del input de archivo.
 */
function cargarArchivo(event) {
    const file = event.target.files[0];
    if (!file) {
        mostrarError("No se seleccionó ningún archivo.");
        return;
    }

    if (fileInfo) {
        fileInfo.innerHTML = '<p>Cargando archivo...</p>';
        fileInfo.style.display = 'block';
    }
    if (errorInfo) {
        errorInfo.style.display = 'none'; // Ocultar errores anteriores
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            // XLSX está disponible globalmente gracias a la carga en index.html
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                mostrarError("El archivo Excel está vacío o no contiene datos válidos.");
                return;
            }

            procesarDatos(jsonData);
            if (analysisSection) {
                analysisSection.style.display = 'block'; // Muestra la sección de análisis
            }
            mostrarInfoArchivo(file.name, jsonData.length);

        } catch (error) {
            console.error('Error al procesar el archivo:', error);
            mostrarError("Error al procesar el archivo Excel. Verifica que el archivo no esté corrupto o sea un formato válido.");
        }
    };

    reader.onerror = function() {
        mostrarError("Error al leer el archivo.");
    };

    reader.readAsArrayBuffer(file);
}

/**
 * Procesa los datos JSON extraídos del archivo Excel.
 * Calcula datos demográficos y proporciones para los selectores.
 * @param {Array<Object>} data - Los datos en formato JSON.
 */
function procesarDatos(data) {
    try {
        datosExcel = data;
        total = data.length;

        if (data.length > 0) {
            columnasDisponibles = Object.keys(data[0]);
        } else {
            columnasDisponibles = [];
        }

        datosDemograficos = {};
        proporciones = {};

        // Para cada columna, contar las ocurrencias de sus valores
        columnasDisponibles.forEach(columna => {
            const conteos = contarRespuestas(data, columna);
            if (Object.keys(conteos).length > 0) {
                datosDemograficos[columna] = conteos;
                // Proporciones serán las mismas que los conteos para este cálculo
                proporciones[columna] = conteos;
            }
        });

        llenarSelectores(); // Rellena los selectores con los datos procesados

    } catch (error) {
        console.error('Error al procesar datos:', error);
        mostrarError("Error al procesar los datos del archivo.");
    }
}

/**
 * Rellena los selectores de "Variable demográfica" y "Pregunta" con las columnas disponibles.
 */
function llenarSelectores() {
    if (varDemografica) {
        varDemografica.innerHTML = '<option value="">Selecciona una variable</option>';
        Object.keys(datosDemograficos).forEach(columna => {
            varDemografica.innerHTML += `<option value="${columna}">${columna}</option>`;
        });
        // Disparar manualmente el evento change para poblar el selector dependiente
        if (varDemografica.options.length > 1) {
            varDemografica.selectedIndex = 1; // Seleccionar la primera opción real
            varDemografica.dispatchEvent(new Event("change"));
        }
    }

    if (preguntaSel) {
        preguntaSel.innerHTML = '<option value="">Selecciona una pregunta</option>';
        Object.keys(proporciones).forEach(columna => {
            preguntaSel.innerHTML += `<option value="${columna}">${columna}</option>`;
        });
        // Disparar manualmente el evento change para poblar el selector dependiente
        if (preguntaSel.options.length > 1) {
            preguntaSel.selectedIndex = 1; // Seleccionar la primera opción real
            preguntaSel.dispatchEvent(new Event("change"));
        }
    }
}

/**
 * Cuenta las ocurrencias de cada respuesta para una pregunta/columna dada.
 * @param {Array<Object>} data - Los datos de la encuesta.
 * @param {string} pregunta - El nombre de la columna/pregunta.
 * @returns {Object} Un objeto con los conteos de cada respuesta.
 */
function contarRespuestas(data, pregunta) {
    const conteos = {};
    data.forEach(row => {
        const respuesta = row[pregunta];
        if (respuesta !== undefined && respuesta !== null && respuesta !== '') {
            const respuestaStr = String(respuesta).trim();
            if (respuestaStr !== '') {
                conteos[respuestaStr] = (conteos[respuestaStr] || 0) + 1;
            }
        }
    });
    return conteos;
}

/**
 * Muestra información sobre el archivo cargado en la interfaz.
 * @param {string} nombre - El nombre del archivo.
 * @param {number} totalRegistros - El número total de registros en el archivo.
 */
function mostrarInfoArchivo(nombre, totalRegistros) {
    const columnas = Object.keys(datosDemograficos);
    if (fileInfo) {
        fileInfo.innerHTML = `
            <strong>Archivo cargado:</strong> ${nombre}<br>
            <strong>Total de registros:</strong> ${totalRegistros}<br>
            <strong>Columnas encontradas:</strong> ${columnas.length}<br>
            <strong>Columnas disponibles:</strong> ${columnas.join(", ")}
        `;
        fileInfo.style.display = 'block';
    }
}

/**
 * Actualiza las opciones del selector de "Opción demográfica"
 * basado en la "Variable demográfica" seleccionada.
 */
function actualizarOpciones() {
    const variable = varDemografica.value;
    if (opcionDemografica) {
        opcionDemografica.innerHTML = '<option value="">Selecciona una opción</option>';

        if (variable && datosDemograficos[variable]) {
            const opciones = Object.keys(datosDemograficos[variable]);
            opciones.forEach(opcion => {
                const cantidad = datosDemograficos[variable][opcion];
                opcionDemografica.innerHTML += `<option value="${opcion}">${opcion} (${cantidad})</option>`;
            });
        }
        opcionDemografica.dispatchEvent(new Event("change")); // Para que el siguiente selector se actualice si es necesario
    }
}

/**
 * Actualiza las opciones del selector de "Respuesta"
 * basado en la "Pregunta" seleccionada.
 */
function actualizarRespuestas() {
    const pregunta = preguntaSel.value;
    if (respuestaSel) {
        respuestaSel.innerHTML = '<option value="">Selecciona una respuesta</option>';

        if (pregunta && proporciones[pregunta]) {
            const respuestas = Object.keys(proporciones[pregunta]);
            respuestas.forEach(respuesta => {
                const cantidad = proporciones[pregunta][respuesta];
                respuestaSel.innerHTML += `<option value="${respuesta}">${respuesta} (${cantidad})</option>`;
            });
        }
    }
}

/**
 * Valida que todos los inputs necesarios para el cálculo estén llenos y sean válidos.
 * @returns {boolean} True si todos los inputs son válidos, false en caso contrario.
 */
function validarInputs() {
    if (!varDemografica.value) {
        mostrarError("Selecciona una variable demográfica.");
        return false;
    }
    if (!opcionDemografica.value) {
        mostrarError("Selecciona una opción demográfica.");
        return false;
    }
    if (!preguntaSel.value) {
        mostrarError("Selecciona una pregunta.");
        return false;
    }
    if (!respuestaSel.value) {
        mostrarError("Selecciona una respuesta.");
        return false;
    }
    if (isNaN(parseInt(x1.value))) {
        mostrarError("Ingresa un valor numérico válido para X1.");
        return false;
    }
    if (tipo.value === "Valores entre un rango" && isNaN(parseInt(x2.value))) {
        mostrarError("Ingresa un valor numérico válido para X2 para el rango.");
        return false;
    }
    return true;
}

/**
 * Realiza el cálculo probabilístico basado en las selecciones del usuario.
 * Calcula la media, desviación estándar y la probabilidad según el tipo de cálculo.
 */
function calcular() {
    if (!validarInputs()) return;

    try {
        const v = varDemografica.value;
        const op = opcionDemografica.value;
        const p = preguntaSel.value;
        const r = respuestaSel.value;
        const t = tipo.value;
        const X1 = parseInt(x1.value);
        const X2 = parseInt(x2.value) || 0; // X2 puede ser 0 si no se usa

        if (!datosDemograficos[v] || !datosDemograficos[v][op]) {
            mostrarError("Error: Datos demográficos no encontrados para la selección actual.");
            return;
        }
        if (!proporciones[p] || !proporciones[p][r]) {
            mostrarError("Error: Proporciones de pregunta/respuesta no encontradas para la selección actual.");
            return;
        }

        const n = datosDemograficos[v][op]; // Tamaño de la muestra (grupo demográfico)
        const count_r = proporciones[p][r]; // Conteo de respuestas 'r' para la pregunta 'p'

        // La probabilidad 'px_general' es la probabilidad de la respuesta 'r' en la POBLACIÓN GENERAL (total de encuestas)
        const px_general = count_r / total;

        // Media y desviación estándar se calculan para el subgrupo demográfico 'n'
        // basado en la probabilidad 'px_general'
        const media = n * px_general;
        const desviacion = Math.sqrt(n * px_general * (1 - px_general));

        if (isNaN(media) || isNaN(desviacion) || desviacion === 0) {
            mostrarError("No se pudieron calcular la media o desviación estándar válidas. Revisa tus datos. (Desviación estándar puede ser cero si n*px_general*(1-px_general) es cero)");
            return;
        }

        let prob = 0;
        // La función erf se define dentro de este ámbito para evitar conflictos
        // Se asume que erf está disponible globalmente o se define aquí.
        // Si Math.erf no está disponible, la implementación personalizada será usada.
        const norm = x => 0.5 * (1 + erf((x - media) / (desviacion * Math.sqrt(2))));

        if (t === "Valor exacto") {
            prob = norm(X1 + 0.5) - norm(X1 - 0.5);
        } else if (t === "Valor menor que") {
            prob = norm(X1 - 0.5);
        } else if (t === "Valor mayor que") {
            prob = 1 - norm(X1 + 0.5);
        } else if (t === "Valores entre un rango") {
            const lowerX = Math.min(X1, X2);
            const upperBound = Math.max(X1, X2);
            prob = norm(upperBound + 0.5) - norm(lowerX - 0.5);
        }

        // Actualizar el contenido del elemento <pre> con ID 'analysisResults'
        if (analysisResultsPre) {
            analysisResultsPre.innerHTML = `
                <p><strong>Población seleccionada (${v}: ${op}):</strong> ${n} personas</p>
                <p><strong>Probabilidad de la respuesta "${r}" en la población general:</strong> ${px_general.toFixed(4)} (${(px_general * 100).toFixed(2)}%)</p>
                <p><strong>Media (μ) esperada en el grupo:</strong> ${media.toFixed(2)}</p>
                <p><strong>Desviación estándar (σ) esperada en el grupo:</strong> ${desviacion.toFixed(2)}</p>
                <p><strong>Tipo de cálculo:</strong> ${t}</p>
                <p><strong>Probabilidad calculada:</strong> ${prob.toFixed(4)} (${(prob * 100).toFixed(2)}%)</p>
            `;
        } else {
            console.warn("Elemento 'analysisResults' (pre) no encontrado para mostrar resultados.");
        }

        if (resultado) {
            resultado.style.display = 'block'; // Muestra la sección de resultados
        }

        graficar(media, desviacion, t, X1, X2);
        if (chartSection) {
            chartSection.style.display = 'block'; // Muestra la sección del gráfico
        }

    } catch (error) {
        console.error('Error en cálculo:', error);
        mostrarError("Error en el cálculo. Verifica los datos seleccionados y el archivo Excel.");
    }
}

/**
 * Genera y muestra un gráfico de distribución normal utilizando Chart.js.
 * @param {number} media - La media de la distribución.
 * @param {number} sd - La desviación estándar de la distribución.
 * @param {string} tipo - El tipo de cálculo (para resaltar el área).
 * @param {number} x1 - Valor X1 para el cálculo.
 * @param {number} x2 - Valor X2 para el cálculo (si es un rango).
 */
function graficar(media, sd, tipo, x1, x2) {
    if (!graficaCanvas) {
        console.error("No se encontró el elemento canvas para graficar.");
        return;
    }
    const ctx = graficaCanvas.getContext("2d");
    const labels = [], data = [], bg = [];

    // Rango de la gráfica (4 desviaciones estándar alrededor de la media)
    const minChartVal = Math.max(0, media - 4 * sd);
    const maxChartVal = media + 4 * sd;
    // Asegura que el paso sea positivo para evitar bucles infinitos si minChartVal >= maxChartVal
    const step = (maxChartVal - minChartVal > 0) ? (maxChartVal - minChartVal) / 200 : 0.1;

    for (let i = minChartVal; i <= maxChartVal; i += step) {
        labels.push(i.toFixed(1));
        data.push(normPDF(i, media, sd));

        let highlight = false;
        if (tipo === 'Valor exacto') {
            highlight = i >= x1 - 0.5 && i <= x1 + 0.5;
        } else if (tipo === 'Valor menor que') {
            highlight = i <= x1 - 0.5;
        } else if (tipo === 'Valor mayor que') {
            highlight = i >= x1 + 0.5;
        } else if (tipo === 'Valores entre un rango') {
            const lowerBound = Math.min(x1, x2);
            const upperBound = Math.max(x1, x2);
            highlight = i >= lowerBound - 0.5 && i <= upperBound + 0.5;
        }

        bg.push(highlight ? 'rgba(0,200,0,0.5)' : 'rgba(54, 162, 235, 0.1)');
    }

    if (chartInstance) chartInstance.destroy(); // Destruir instancia anterior

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribución Normal',
                data: data,
                backgroundColor: bg,
                pointRadius: 0,
                fill: true,
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                title: {
                    display: true,
                    text: 'Distribución Normal con Área de Probabilidad Resaltada'
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Número de personas' },
                    ticks: { maxTicksLimit: 15 } // Aumentar límite de ticks para mejor visualización
                },
                y: {
                    title: { display: true, text: 'Densidad de probabilidad' },
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Calcula la función de densidad de probabilidad (PDF) para una distribución normal.
 * @param {number} x - El valor para el cual calcular la PDF.
 * @param {number} mean - La media de la distribución.
 * @param {number} sd - La desviación estándar de la distribución.
 * @returns {number} El valor de la PDF en x.
 */
function normPDF(x, mean, sd) {
    if (sd === 0) return 0; // Evitar división por cero
    const a = 1 / (sd * Math.sqrt(2 * Math.PI));
    const b = -Math.pow(x - mean, 2) / (2 * sd * sd);
    return a * Math.exp(b);
}

/**
 * Implementación de la función de error (Error Function - erf).
 * Se usa para calcular probabilidades acumuladas de la distribución normal.
 * @param {number} x - El valor para el cual calcular erf.
 * @returns {number} El valor de erf(x).
 */
function erf(x) {
    // Usa Math.erf si está disponible nativamente en el navegador, si no, usa la implementación personalizada
    if (typeof Math.erf === 'function') {
        return Math.erf(x);
    }

    // Implementación personalizada de erf
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
          a4 = -1.453152027, a5 = 1.061405429;
    const erfValue = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
    return sign * erfValue;
}

/**
 * Función principal para inicializar la vista de análisis probabilístico.
 * Se llama cuando la vista 'probabilistic' es cargada por navigation.js.
 * Aquí se obtienen las referencias del DOM y se adjuntan los event listeners.
 */
window.initializeProbabilisticView = function() {
    console.log("DEBUG_PROB_VIEW: initializeProbabilisticView ha sido llamada.");

    // Obtener referencias a elementos DOM dentro de esta función
    // para asegurar que existan en el momento de la inicialización de la vista.
    fileInput = document.getElementById('fileInput');
    fileInfo = document.getElementById('fileInfo');
    errorInfo = document.getElementById('errorInfo');
    analysisSection = document.getElementById('analysisSection');
    chartSection = document.getElementById('chartSection');
    varDemografica = document.getElementById("varDemografica");
    opcionDemografica = document.getElementById("opcionDemografica");
    preguntaSel = document.getElementById("pregunta");
    respuestaSel = document.getElementById("respuesta");
    tipo = document.getElementById("tipo");
    x1 = document.getElementById("x1");
    x2 = document.getElementById("x2");
    x2container = document.getElementById("x2-container");
    resultado = document.getElementById("resultado");
    analysisResultsPre = document.getElementById("analysisResults"); // Referencia al <pre>
    graficaCanvas = document.getElementById("grafica");

    // --- Validar que todos los elementos existan ---
    const requiredElements = [
        fileInput, fileInfo, errorInfo, analysisSection, chartSection,
        varDemografica, opcionDemografica, preguntaSel, respuestaSel,
        tipo, x1, x2, x2container, resultado, analysisResultsPre, graficaCanvas // Añadido analysisResultsPre
    ];
    for (const elem of requiredElements) {
        if (!elem) {
            console.error(`Error: Elemento DOM no encontrado. ID: ${elem ? elem.id : 'undefined'}. Asegúrate de que probabilistic.html esté bien cargado.`);
            if (errorInfo) {
                errorInfo.innerHTML = `Error: Elemento DOM no encontrado al inicializar vista de probabilidad. Intenta recargar.`;
                errorInfo.style.display = 'block';
            }
            return; // Detener la inicialización si falta un elemento crítico
        }
    }
    // --- Fin de validación ---

    // Adjuntar Event Listeners
    fileInput.addEventListener('change', cargarArchivo);
    tipo.addEventListener("change", () => {
        if (x2container) { // Asegurarse de que x2container exista antes de manipularlo
            x2container.style.display = tipo.value === "Valores entre un rango" ? "block" : "none";
        }
    });
    varDemografica.addEventListener("change", actualizarOpciones);
    preguntaSel.addEventListener("change", actualizarRespuestas);

    // Exponer la función calcular globalmente para que el botón HTML pueda llamarla
    window.calcular = calcular;

    // Establecer el estado inicial de la UI
    if (analysisSection) analysisSection.style.display = 'none';
    if (chartSection) chartSection.style.display = 'none';
    if (resultado) resultado.style.display = 'none';
    if (x2container) x2container.style.display = 'none'; // Ocultar X2 por defecto

    // Lógica para el botón de generar PDF
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    console.log("DEBUG_PROB_VIEW: Intento de obtener el botón 'generate-pdf-btn':", generatePdfBtn); // MUY IMPORTANTE

    if (generatePdfBtn) {
        console.log("DEBUG_PROB_VIEW: Botón 'generate-pdf-btn' ENCONTRADO. Añadiendo Event Listener."); // MUY IMPORTANTE
        generatePdfBtn.addEventListener('click', async () => {
            console.log("DEBUG_PROB_VIEW: ¡Clic en el botón de PDF DETECTADO!");

            // El ID del contenedor que envuelve los resultados y la gráfica
            const contentToPrint = document.getElementById('probabilistic-content-to-pdf');
            console.log("DEBUG_PROB_VIEW: Contenedor de PDF encontrado:", contentToPrint);

            if (!contentToPrint) {
                console.error("DEBUG_PROB_VIEW: Contenedor para PDF no encontrado: #probabilistic-content-to-pdf");
                alert("Error: Contenido para PDF no encontrado. Asegúrate de que el ID 'probabilistic-content-to-pdf' exista y envuelva los resultados y la gráfica.");
                return;
            }

            try {
                console.log("DEBUG_PROB_VIEW: Iniciando html2canvas...");
                const canvas = await html2canvas(contentToPrint, {
                    scale: 2,
                    useCORS: true,
                    logging: true
                });
                console.log("DEBUG_PROB_VIEW: Canvas generado. Iniciando jsPDF...");

                const imgData = canvas.toDataURL('image/png');
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');

                const imgWidth = 210;
                const pageHeight = 297;
                const imgHeight = canvas.height * imgWidth / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }

                pdf.save('analisis_probabilistico.pdf');
                console.log("DEBUG_PROB_VIEW: PDF generado y descargado con éxito.");
                alert("El PDF se ha generado y descargado correctamente.");

            } catch (error) {
                console.error("DEBUG_PROB_VIEW: Error al generar el PDF:", error);
                alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
            }
        });
    } else {
        console.warn("DEBUG_PROB_VIEW: Botón 'generate-pdf-btn' NO ENCONTRADO en el DOM cuando initializeProbabilisticView se ejecutó.");
    }
};
