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
        
        // Inicializar funcionalidad específica de la vista
        initializeView(viewName);
        
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
                                <button type="submit" id="upload-btn" class="btn" disabled>Procesar datos</button>
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

// Inicializar funcionalidad específica para cada vista
function initializeView(viewName) {
    switch(viewName) {
        case 'upload':
            initUploadView();
            break;
        case 'analysis':
            // Inicializar la vista de análisis cuando esté implementada
            console.log('Vista de análisis cargada');
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

// Inicializar la vista de carga de datos
function initUploadView() {
    const fileInput = document.getElementById('file-upload');
    const fileInfo = document.getElementById('file-info');
    const uploadForm = document.getElementById('upload-form');
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileInfo.textContent = `Archivo seleccionado: ${file.name} (${formatFileSize(file.size)})`;
                const uploadBtn = document.getElementById('upload-btn');
                if (uploadBtn) {
                    uploadBtn.disabled = false;
                }
            } else {
                fileInfo.textContent = 'Ningún archivo seleccionado';
                const uploadBtn = document.getElementById('upload-btn');
                if (uploadBtn) {
                    uploadBtn.disabled = true;
                }
            }
        });
    }
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('file-upload');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Por favor, selecciona un archivo primero.');
                return;
            }
            
            // Aquí iría la lógica para procesar el archivo
            // Por ahora solo mostraremos un mensaje de éxito
            const uploadArea = document.querySelector('.upload-area');
            if (uploadArea) {
                uploadArea.innerHTML = `
                    <div class="success-message">
                        <h3>¡Archivo cargado con éxito!</h3>
                        <p>Nombre: ${file.name}</p>
                        <p>Tamaño: ${formatFileSize(file.size)}</p>
                        <p>Tipo: ${file.type}</p>
                        
                        <button type="button" class="btn mt-2" onclick="loadView('upload')">
                            Cargar otro archivo
                        </button>
                    </div>
                `;
            }
        });
    }
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