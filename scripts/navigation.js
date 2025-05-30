/**
 * Sistema de navegación para la aplicación
 * Permite cargar diferentes vistas sin recargar la página
 */

// Rutas a las vistas
const views = {
    upload: 'views/upload.html',
    analysis: 'views/analysis.html',
    settings: 'views/settings.html',
    probabilistic: 'views/probabilistic.html' // <--- ¡ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ ASÍ!
};

// Mapeo de vistas a sus scripts y estilos asociados
const viewAssets = { // Cambiado a 'viewAssets' para incluir ambos js y css
    'upload': { js: [], css: 'styles/upload.css' },
    'analysis': { js: ['js/analysis.js'], css: 'styles/analysis.css' }, // Asume que tienes un js/analysis.js
    'settings': { js: ['js/settings.js'], css: 'styles/settings.css' }, // Asume que tienes js/settings.js y styles/settings.css
'probabilistic': { js: ['scripts/probabilisticAnalysis.js'], css: 'styles/probabilistic.css' }
};

// Función para cargar una vista en el contenedor principal
async function loadView(viewName) {
    if (!views[viewName]) {
        console.error(`Vista "${viewName}" no encontrada`);
        return;
    }

    try {
        let content;

        if (window.location.protocol === 'file:') {
            content = await loadViewWithXHR(views[viewName]);
        } else {
            const response = await fetch(views[viewName]);

            if (!response.ok) {
                throw new Error(`Error al cargar ${views[viewName]}: ${response.status}`);
            }

            content = await response.text();
        }

        const contentContainer = document.getElementById('content-container');

        // Insertar el contenido HTML
        contentContainer.innerHTML = content;

        // Actualizar la navegación
        updateNavigation(viewName);

        // Cargar estilos específicos de la vista
        loadViewStyles(viewName);

        // Cargar scripts específicos de la vista (espera a que se carguen)
        await loadViewScripts(viewName); // <--- ¡Aquí se llama la nueva función!

        // IMPORTANTE: Inicializar funcionalidad específica de la vista
        // Usar setTimeout para asegurar que el DOM esté completamente renderizado
        // y los scripts cargados hayan tenido tiempo de ejecutarse
        setTimeout(() => {
            initializeView(viewName);
        }, 100); // Pequeño retraso para asegurar que los scripts tengan tiempo de definirse

    } catch (error) {
        console.error('Error al cargar la vista:', error);
        document.getElementById('content-container').innerHTML = `
            <div class="error-message">
                <h2>Error al cargar la vista</h2>
                <p>${error.message}</p>
                <p>Asegúrate de que todas las vistas existan en la carpeta 'views' y que estés ejecutando la aplicación a través de un servidor web local.</p>
            </div>
        `;
    }
}

// Función alternativa para cargar vistas usando XMLHttpRequest (mejor compatibilidad con file://)
function loadViewWithXHR(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText);
            } else {
                reject(new Error(`XHR error: ${xhr.status} ${xhr.statusText}`));
            }
        };

        xhr.onerror = function() {
            console.error(`No se pudo cargar la vista desde ${url}. Generando contenido predeterminado.`);
            const viewName = url.split('/').pop().replace('.html', '');
            let defaultContent = getDefaultViewContent(viewName);
            resolve(defaultContent);
        };

        xhr.send();
    });
}

// Generar contenido HTML predeterminado para las vistas
function getDefaultViewContent(viewName) {
    // ... (Tu código actual para getDefaultViewContent es correcto, no necesita cambios) ...
    switch(viewName) {
        case 'upload':
            return `
                <div class="upload-container">
                    <h2 class="section-title">Cargar datos</h2>
                    
                    <div class="upload-instructions">
                        <p><strong>Instrucciones:</strong></p>
                        <ul>
                            <li>Selecciona un archivo CSV, Excel o JSON para analizar</li>
                            <li>El tamaño máximo permitido es de 10MB</li>
                            <li>Se recomienda usar archivos con encabezados</li>
                        </ul>
                    </div>
                    
                    <div class="upload-area">
                        <form id="upload-form">
                            <div class="file-drop-area">
                                <span class="fake-btn">Seleccionar archivo</span>
                                <span class="file-msg">o arrastra y suelta aquí</span>
                                <input class="file-input" id="file-upload" type="file" accept=".csv, .xlsx, .xls, .json">
                            </div>
                            
                            <div id="file-info" class="file-info">
                                Ningún archivo seleccionado
                            </div>
                            
                            <div class="upload-options">
                                <div class="form-group">
                                    <label for="delimiter">Delimitador:</label>
                                    <select id="delimiter" class="select-input">
                                        <option value="comma">Coma (,)</option>
                                        <option value="semicolon">Punto y coma (;)</option>
                                        <option value="tab">Tabulación</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="encoding">Codificación:</label>
                                    <select id="encoding" class="select-input">
                                        <option value="utf8">UTF-8</option>
                                        <option value="latin1">Latin-1</option>
                                        <option value="ascii">ASCII</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="upload-actions">
                                <button type="button" id="process-file-btn" class="btn" disabled>Procesar datos</button>
                                <button type="reset" class="btn btn-secondary">Cancelar</button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="recent-uploads">
                        <h3>Archivos recientes</h3>
                        <div class="upload-history">
                            <p class="no-data">No hay archivos recientes</p>
                        </div>
                    </div>
                </div>
            `;
        case 'analysis':
            return `
                <div class="analysis-container">
                    <h2 class="section-title">Análisis de datos</h2>
                    <p>Para comenzar el análisis, primero debes cargar un conjunto de datos desde la sección "Cargar datos".</p>
                </div>
            `;
        case 'probabilistic': // Contenido por defecto para la vista probabilística
            return `
                <div class="container">
                    <h2 class="section-title">Análisis Probabilístico</h2>
                    <p>Carga un archivo CSV para realizar análisis de distribución de probabilidad.</p>
                    <div class="file-upload">
                        <h3>Cargar Archivo de Datos (CSV)</h3>
                        <input type="file" id="fileUpload" accept=".csv">
                        <div id="fileInfo">Ningún archivo seleccionado</div>
                    </div>
                    <div class="section" id="analysisSection" style="display:none;">
                        <h3>Opciones de Análisis</h3>
                        <label for="columnSelect">Selecciona la columna para analizar:</label>
                        <select id="columnSelect"></select>
                        <label for="distributionSelect">Selecciona la distribución:</label>
                        <select id="distributionSelect">
                            <option value="normal">Normal</option>
                            <option value="poisson">Poisson</option>
                            <option value="exponential">Exponencial</option>
                            </select>
                        <label for="binsInput">Número de Bins para Histograma:</label>
                        <input type="number" id="binsInput" value="10" min="1">
                        <button id="analyzeBtn">Realizar Análisis</button>
                    </div>
                    <div class="section" id="resultado" style="display:none;">
                        <h3>Resultados del Análisis</h3>
                        <pre id="analysisResults"></pre>
                    </div>
                    <div class="section" id="chartSection" style="display:none;">
                        <h3>Gráfico de Distribución</h3>
                        <canvas id="probChart"></canvas>
                    </div>
                </div>
            `;
        case 'report':
            return `
                <div class="report-container">
                    <h2 class="section-title">Reportes y visualizaciones</h2>
                    <p>Los reportes estarán disponibles después de analizar los datos.</p>
                </div>
            `;
        case 'settings':
            return `
                <div class="settings-container">
                    <h2 class="section-title">Configuración</h2>
                    <p>Configura las opciones de la aplicación según tus preferencias.</p>
                    
                    <div class="card">
                        <h3>Preferencias de visualización</h3>
                        <form id="settings-form">
                            <div class="form-group">
                                <label for="theme">Tema:</label>
                                <select id="theme" class="select-input">
                                    <option value="light">Claro</option>
                                    <option value="dark">Oscuro</option>
                                    <option value="system">Sistema</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="language">Idioma:</label>
                                <select id="language" class="select-input">
                                    <option value="es">Español</option>
                                    <option value="en">Inglés</option>
                                </select>
                            </div>
                            
                            <button type="submit" class="btn">Guardar cambios</button>
                        </form>
                    </div>
                </div>
            `;
        default:
            return `
                <div class="error-message">
                    <h2>Vista no disponible</h2>
                    <p>La vista solicitada no está disponible actualmente.</p>
                </div>
            `;
    }
}

// Actualizar los elementos de navegación activos
function updateNavigation(activeView) {
    const navItems = document.querySelectorAll('#main-nav .nav-item');

    navItems.forEach(item => {
        if (item.dataset.view === activeView) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Cargar estilos específicos para cada vista
function loadViewStyles(viewName) {
    const cssPath = viewAssets[viewName]?.css;
    
    // Eliminar estilos anteriores específicos de vistas
    document.querySelectorAll('link[data-view-styles]').forEach(link => {
        if (link.getAttribute('data-view-styles') !== viewName) {
            link.remove();
        }
    });

    if (cssPath && !document.querySelector(`link[href="${cssPath}"]`)) {
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = cssPath;
        stylesheet.setAttribute('data-view-styles', viewName); // Marca el stylesheet para fácil eliminación
        document.head.appendChild(stylesheet);
        console.log(`Cargado CSS: ${cssPath}`);
    }
}

// NUEVA FUNCIÓN: Cargar scripts específicos de la vista
async function loadViewScripts(viewName) {
    const scriptsToLoad = viewAssets[viewName]?.js || [];
    
    // Eliminar scripts anteriores específicos de vistas
    document.querySelectorAll('script[data-view-script]').forEach(script => {
        // Solo elimina si el script no es el que estamos a punto de cargar,
        // o si es de una vista diferente.
        // Esto previene recargar el mismo script si ya está en el DOM por alguna razón.
        if (!scriptsToLoad.includes(script.src.replace(window.location.origin + '/', '')) ||
            script.getAttribute('data-view-script') !== viewName) {
            script.remove();
        }
    });

    for (const scriptPath of scriptsToLoad) {
        const fullScriptPath = scriptPath; // Asume que scriptPath ya es relativo a la raíz
        
        // Verificar si el script ya existe para evitar cargarlo dos veces
        if (!document.querySelector(`script[src="${fullScriptPath}"][data-view-script="${viewName}"]`)) {
            const script = document.createElement('script');
            script.src = fullScriptPath;
            script.setAttribute('data-view-script', viewName); // Marca el script para fácil eliminación
            script.async = true; // Carga asíncrona
            document.body.appendChild(script); // Se añade al body para que Chart.js esté disponible
            console.log(`Cargado script: ${fullScriptPath}`);

            // Esperar a que el script se cargue antes de continuar con el siguiente (si aplica)
            await new Promise(resolve => {
                script.onload = resolve;
                script.onerror = (e) => {
                    console.error(`Error al cargar el script: ${fullScriptPath}`, e);
                    resolve(); // Resuelve incluso si hay error para no bloquear el flujo
                };
            });
        }
    }
}


// FUNCIÓN CRÍTICA: Inicializar funcionalidad específica para cada vista
function initializeView(viewName) {
    console.log(`Inicializando vista: ${viewName}`);

    switch(viewName) {
        case 'upload':
            initUploadView();
            break;
        case 'analysis':
            console.log('Vista de análisis cargada');
            if (window.appData) {
                if (typeof window.renderCharts === "function") {
                    window.renderCharts(window.appData);
                } else {
                    console.warn("La función renderCharts() no está disponible.");
                }
            } else {
                console.warn("No hay datos cargados para analizar.");
                const container = document.getElementById("content-container");
                container.innerHTML += `<p style="color:red;">Primero debes cargar los datos en la pestaña "Cargar datos".</p>`;
            }
            break;
        case 'probabilistic': // <-- ¡Este es el nuevo case!
            console.log('Inicializando vista de análisis probabilístico...');
            // Asegúrate de que initializeProbabilisticView esté en el ámbito global (window)
            // en probabilisticAnalysis.js
            if (typeof window.initializeProbabilisticView === 'function') {
                window.initializeProbabilisticView();
            } else {
                console.error('La función initializeProbabilisticView() no está definida en js/probabilisticAnalysis.js. Asegúrate de que esté expuesta globalmente.');
            }
            break;
        case 'report':
            // Inicializar la vista de reportes cuando esté implementada
            console.log('Vista de reportes cargada');
            // if (typeof window.initReportView === 'function') { window.initReportView(); }
            break;
        case 'settings':
            // Inicializar la vista de configuración cuando esté implementada
            console.log('Vista de configuración cargada');
            // if (typeof window.initSettingsView === 'function') { window.initSettingsView(); }
            break;
        default:
            console.warn(`No hay función de inicialización definida para la vista: ${viewName}`);
            break;
    }
}

// FUNCIÓN MEJORADA: Inicializar la vista de carga de datos
function initUploadView() {
    console.log('Inicializando vista de upload...');

    // Buscar elementos en el DOM
    const dropArea = document.querySelector('.file-drop-area');
    const fileInput = document.getElementById('file-upload');
    const fileInfo = document.getElementById('file-info');
    const processFileBtn = document.getElementById('process-file-btn');

    console.log('Elementos encontrados:', {
        dropArea: !!dropArea,
        fileInput: !!fileInput,
        fileInfo: !!fileInfo,
        processFileBtn: !!processFileBtn
    });

    // Evento para procesar archivo local - MOVER ANTES del event listener del archivo
    let newBtn;
    if (processFileBtn) {
        // Eliminar eventos anteriores para evitar duplicados clonando el botón
        console.log('Botón original:', processFileBtn);
        console.log('Botón habilitado:', !processFileBtn.disabled);
        newBtn = processFileBtn.cloneNode(true);
        processFileBtn.parentNode.replaceChild(newBtn, processFileBtn);
    }

    // Inicializar el cargador de archivos si los elementos existen
    if (dropArea && fileInput && window.FileUploader) {
        console.log('Inicializando FileUploader...');
        window.FileUploader.init(dropArea, fileInput, fileInfo, newBtn || processFileBtn); // Usa newBtn si existe
        
        // Verificar si el input de archivo está funcionando
        fileInput.addEventListener('change', (e) => {
            console.log('Archivo seleccionado desde navigation.js:', e.target.files[0]);
            if (e.target.files[0]) {
                console.log('Habilitando botón manualmente...');
                if (newBtn) {
                    newBtn.disabled = false;  // Usar newBtn en lugar de processFileBtn
                }
            }
        });
        console.log('FileUploader inicializado');
    } else {
        console.error('No se pudo inicializar FileUploader. Elementos faltantes o FileUploader no disponible.');
    }

    // Configurar las pestañas
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    console.log('Pestañas encontradas:', tabs.length);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('Cambiando a pestaña:', tab.getAttribute('data-tab'));

            // Remover clase active de todas las pestañas
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            // Agregar clase active a la pestaña actual
            tab.classList.add('active');

            // Mostrar el contenido correspondiente
            const tabId = tab.getAttribute('data-tab');
            const targetPane = document.getElementById(tabId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });

    // Configurar el selector de tipo de datos de URL
    const urlDataType = document.getElementById('url-data-type');
    const csvOptions = document.getElementById('csv-options');

    if (urlDataType && csvOptions) {
        urlDataType.addEventListener('change', () => {
            if (urlDataType.value === 'csv' || urlDataType.value === 'auto') {
                csvOptions.classList.remove('hidden');
            } else {
                csvOptions.classList.add('hidden');
            }
        });

        console.log('FileUploader disponible:', !!window.FileUploader);
        console.log('DataProcessor disponible:', !!window.DataProcessor);
    }

    // Configurar el event listener del botón procesado (usando newBtn)
    if (newBtn) {
        newBtn.addEventListener('click', () => {
            console.log('Event listener agregado al botón');
            console.log('Procesando archivo...');

            console.log('Botón clickeado, archivo actual:', window.FileUploader?.getCurrentFile());

            if (!window.FileUploader) {
                console.error('FileUploader no está disponible');
                return;
            }

            const currentFile = window.FileUploader.getCurrentFile();

            if (!currentFile) {
                alert('Por favor, selecciona un archivo primero');
                return;
            }

            // Obtener opciones
            const delimiter = document.getElementById('delimiter')?.value || 'comma';
            const encoding = document.getElementById('encoding')?.value || 'utf8';
            const datasetName = document.getElementById('dataset-name')?.value ||
                                currentFile.name.replace(/\.[^/.]+$/, "");

            // Mostrar indicador de carga
            if (fileInfo) {
                fileInfo.innerHTML = '<div class="loading">Procesando datos...</div>';
            }
            newBtn.disabled = true;

            // Leer y procesar archivo
            window.FileUploader.readFile({
                delimiter,
                encoding
            }, (error, data) => {
                if (error) {
                    if (fileInfo) {
                        fileInfo.innerHTML = `<div class="error">Error al procesar el archivo: ${error.message}</div>`;
                    }
                    newBtn.disabled = false;
                    return;
                }

                try {
                    // Procesar datos con el procesador de datos
                    if (window.DataProcessor) {
                        const processedData = window.DataProcessor.processData(data, {
                            datasetName,
                            source: `Archivo local: ${currentFile.name}`,
                            removeEmpty: true,
                            convertTypes: true,
                            trimStrings: true
                        });

                        console.log('Datos procesados:', processedData);

                        // Mostrar éxito
                        if (fileInfo) {
                            fileInfo.innerHTML = `
                                <div class="success">
                                    <p>Archivo procesado con éxito:</p>
                                    <ul>
                                        <li>Filas: ${processedData.data.length}</li>
                                        <li>Columnas: ${processedData.data.length > 0 ? Object.keys(processedData.data[0]).length : 0}</li>
                                    </ul>
                                </div>`;
                        }

                        // Actualizar interfaz de historial
                        updateDatasetHistoryUI();

                        // Mostrar opción para ir a la vista de análisis
                        const uploadForm = document.getElementById('upload-form');
                        if (uploadForm) {
                            uploadForm.innerHTML = `
                                <div class="success-message">
                                    <h3>¡Datos cargados correctamente!</h3>
                                    <p>Se han procesado ${processedData.data.length} filas de datos.</p>
                                    <div class="upload-actions mt-2">
                                        <button type="button" class="btn" onclick="loadView('analysis')">
                                            Ir a Análisis
                                        </button>
                                        <button type="button" class="btn" onclick="loadView('probabilistic')">
                                            Ir a Análisis Probabilístico
                                        </button>
                                        <button type="button" class="btn btn-secondary" onclick="loadView('upload')">
                                            Cargar otro archivo
                                        </button>
                                    </div>
                                </div>
                            `;
                        }
                    } else {
                        if (fileInfo) {
                            fileInfo.innerHTML = '<div class="error">Error: Módulo DataProcessor no disponible</div>';
                        }
                        newBtn.disabled = false;
                    }
                } catch (processError) {
                    console.error('Error al procesar:', processError);
                    if (fileInfo) {
                        fileInfo.innerHTML = `<div class="error">Error al procesar: ${processError.message}</div>`;
                    }
                    newBtn.disabled = false;
                }
            });
        });
    }

    // Evento para procesar URL
    const processUrlBtn = document.getElementById('process-url-btn');
    if (processUrlBtn && window.UrlLoader && window.DataProcessor) {
        // Eliminar eventos anteriores
        const newUrlBtn = processUrlBtn.cloneNode(true);
        processUrlBtn.parentNode.replaceChild(newUrlBtn, processUrlBtn);

        newUrlBtn.addEventListener('click', async () => {
            console.log('Procesando URL...');

            const dataUrl = document.getElementById('data-url')?.value.trim();

            if (!dataUrl) {
                alert('Por favor, introduce una URL válida');
                return;
            }

            // Obtener opciones
            const dataType = document.getElementById('url-data-type')?.value || 'auto';
            const delimiter = document.getElementById('url-delimiter')?.value || 'comma';
            const datasetName = document.getElementById('url-dataset-name')?.value ||
                                 new URL(dataUrl).pathname.split('/').pop() || 'Datos externos';

            // Mostrar indicador de carga
            const urlForm = document.getElementById('url-form');
            const loadingMsg = document.createElement('div');
            loadingMsg.className = 'loading-message';
            loadingMsg.innerHTML = '<div class="loading">Cargando datos desde URL...</div>';
            if (urlForm) {
                urlForm.appendChild(loadingMsg);
            }

            newUrlBtn.disabled = true;

            try {
                // Procesar URL de Google Sheets si es necesario
                let finalUrl = dataUrl;
                if (dataType === 'gsheets' || (dataType === 'auto' && dataUrl.includes('docs.google.com/spreadsheets'))) {
                    finalUrl = window.UrlLoader.getGoogleSheetsCsvUrl(dataUrl);
                }

                // Determinar tipo de datos real
                let actualDataType = dataType;
                if (dataType === 'auto') {
                    actualDataType = window.UrlLoader.detectDataType(finalUrl);
                }

                // Configurar opciones de CSV si es necesario
                const csvOptions = {};
                if (actualDataType === window.UrlLoader.DATA_TYPES.CSV) {
                    switch(delimiter) {
                        case 'comma': csvOptions.delimiter = ','; break;
                        case 'semicolon': csvOptions.delimiter = ';'; break;
                        case 'tab': csvOptions.delimiter = '\t'; break;
                    }
                    csvOptions.header = true;
                    csvOptions.dynamicTyping = true;
                    csvOptions.skipEmptyLines = true;
                }

                // Cargar datos
                const data = await window.UrlLoader.fetchData(finalUrl, {
                    dataType: actualDataType,
                    csvOptions
                });

                // Procesar datos
                const processedData = window.DataProcessor.processData(data, {
                    datasetName,
                    source: `URL: ${dataUrl}`,
                    removeEmpty: true,
                    convertTypes: true,
                    trimStrings: true
                });

                console.log('Datos desde URL procesados:', processedData);

                // Eliminar indicador de carga
                if (urlForm && urlForm.contains(loadingMsg)) {
                    urlForm.removeChild(loadingMsg);
                }

                // Mostrar éxito
                if (urlForm) {
                    urlForm.innerHTML = `
                        <div class="success-message">
                            <h3>¡Datos cargados correctamente!</h3>
                            <p>Se han procesado ${processedData.data.length} filas de datos desde URL.</p>
                            <div class="upload-actions mt-2">
                                <button type="button" class="btn" onclick="loadView('analysis')">
                                    Ir a Análisis
                                </button>
                                <button type="button" class="btn" onclick="loadView('probabilistic')">
                                    Ir a Análisis Probabilístico
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="loadView('upload')">
                                    Cargar otros datos
                                </button>
                            </div>
                        </div>
                    `;
                }

                // Actualizar interfaz de historial
                updateDatasetHistoryUI();

            } catch (error) {
                console.error('Error al cargar desde URL:', error);

                // Eliminar indicador de carga
                if (urlForm && urlForm.contains(loadingMsg)) {
                    urlForm.removeChild(loadingMsg);
                }

                // Mostrar error
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.innerHTML = `
                    <h3>Error al cargar datos</h3>
                    <p>${error.message}</p>
                `;
                if (urlForm) {
                    urlForm.appendChild(errorMsg);
                }

                newUrlBtn.disabled = false;

                // Eliminar mensaje de error después de 5 segundos
                setTimeout(() => {
                    if (urlForm && urlForm.contains(errorMsg)) {
                        urlForm.removeChild(errorMsg);
                    }
                }, 5000);
            }
        });
    }

    // Inicializar el procesador de datos para cargar el historial
    if (window.DataProcessor) {
        window.DataProcessor.init();
        updateDatasetHistoryUI();
    }
}

// Función para actualizar la interfaz del historial
function updateDatasetHistoryUI() {
    if (!window.DataProcessor) return;

    const historyContainer = document.querySelector('.upload-history');
    if (!historyContainer) return;

    const datasetHistory = window.DataProcessor.getDatasetHistory();

    if (!datasetHistory || datasetHistory.length === 0) {
        historyContainer.innerHTML = '<p class="no-data">No hay archivos recientes</p>';
        return;
    }

    // Crear lista de conjuntos de datos
    const historyList = document.createElement('ul');
    historyList.className = 'dataset-history-list';

    // Limitar a los últimos 5 conjuntos
    const recentDatasets = datasetHistory.slice(0, 5);

    recentDatasets.forEach(dataset => {
        const listItem = document.createElement('li');
        listItem.className = 'dataset-item';

        // Formatear fecha
        const date = new Date(dataset.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        // Crear HTML del elemento
        listItem.innerHTML = `
            <div class="dataset-info">
                <span class="dataset-name">${dataset.meta?.datasetName || 'Dataset sin nombre'}</span>
                <span class="dataset-date">${formattedDate}</span>
            </div>
            <div class="dataset-description">${dataset.description}</div>
            <div class="dataset-actions">
                <button class="btn-small" data-action="load" data-id="${dataset.id}">Cargar</button>
                <button class="btn-small btn-secondary" data-action="delete" data-id="${dataset.id}">Eliminar</button>
            </div>
        `;

        // Agregar eventos a los botones
        listItem.querySelector('[data-action="load"]').addEventListener('click', () => {
            if (window.DataProcessor && window.DataProcessor.loadDataset) {
                window.DataProcessor.loadDataset(dataset.id);
                // Opcional: después de cargar un dataset desde el historial, podrías querer ir a la vista de análisis
                // loadView('analysis');
            }
        });

        listItem.querySelector('[data-action="delete"]').addEventListener('click', () => {
            if (window.DataProcessor && window.DataProcessor.removeDataset) {
                window.DataProcessor.removeDataset(dataset.id);
                updateDatasetHistoryUI(); // Actualizar después de eliminar
            }
        });

        historyList.appendChild(listItem);
    });

    // Limpiar contenedor y agregar la lista
    historyContainer.innerHTML = '';
    historyContainer.appendChild(historyList);
}

// Formatear el tamaño del archivo para mostrar
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Configurar eventos de navegación
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('#main-nav .nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            loadView(view);
        });
    });

});