/**
 * Sistema de navegación para la aplicación
 * Permite cargar diferentes vistas sin recargar la página
 */

// Rutas a las vistas
const views = {
    upload: 'views/upload.html',
    analysis: 'views/analysis.html',
    report: 'views/report.html',
    settings: 'views/settings.html'
};

// Función para cargar una vista en el contenedor principal
async function loadView(viewName) {
    if (!views[viewName]) {
        console.error(`Vista "${viewName}" no encontrada`);
        return;
    }
    
    try {
        // Verificar si estamos en un entorno local
        // Si estamos ejecutando el archivo directamente desde el sistema de archivos
        // necesitamos manejar esto de otra manera
        let content;
        
        if (window.location.protocol === 'file:') {
            // En caso de ejecutarse localmente, podríamos cargar un contenido predeterminado
            // o usar un método alternativo como XMLHttpRequest
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
        
        // IMPORTANTE: Inicializar funcionalidad específica de la vista
        // Usar setTimeout para asegurar que el DOM esté completamente renderizado
        setTimeout(() => {
            initializeView(viewName);
        }, 100);
        
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
            // Si falla, generamos contenido predeterminado para la vista
            console.error(`No se pudo cargar la vista desde ${url}. Generando contenido predeterminado.`);
            
            // Extraer el nombre de la vista de la URL
            const viewName = url.split('/').pop().replace('.html', '');
            
            // Generar contenido HTML predeterminado según la vista
            let defaultContent = getDefaultViewContent(viewName);
            resolve(defaultContent);
        };
        
        xhr.send();
    });
}

// Generar contenido HTML predeterminado para las vistas
function getDefaultViewContent(viewName) {
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
    // Eliminar estilos anteriores específicos de vistas
    const oldStylesheet = document.querySelector('link[data-view-styles]');
    if (oldStylesheet && oldStylesheet.getAttribute('data-view-styles') !== viewName) {
        oldStylesheet.remove();
    }
    
    // Verificar si ya existen los estilos para evitar cargarlos nuevamente
    if (!document.querySelector(`link[data-view-styles="${viewName}"]`)) {
        // Añadir los nuevos estilos
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = `styles/${viewName}.css`;
        stylesheet.setAttribute('data-view-styles', viewName);
        document.head.appendChild(stylesheet);
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
            // Asegúrate que renderCharts está expuesto globalmente
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
        case 'report':
            // Inicializar la vista de reportes cuando esté implementada
            console.log('Vista de reportes cargada');
            break;
        case 'settings':
            // Inicializar la vista de configuración cuando esté implementada
            console.log('Vista de configuración cargada');
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
        // Eliminar eventos anteriores para evitar duplicados
        console.log('Botón original:', processFileBtn);
        console.log('Botón habilitado:', !processFileBtn.disabled);
        newBtn = processFileBtn.cloneNode(true);
        processFileBtn.parentNode.replaceChild(newBtn, processFileBtn);
    }
    
    // Inicializar el cargador de archivos si los elementos existen
    if (dropArea && fileInput && window.FileUploader) {
        console.log('Inicializando FileUploader...');
        window.FileUploader.init(dropArea, fileInput, fileInfo, newBtn || processFileBtn);
        
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
    
    // Configurar el event listener del botón procesado
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