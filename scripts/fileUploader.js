/**
 * fileUploader.js
 * Maneja la carga de archivos locales (CSV, Excel, JSON)
 */

// Variable para almacenar información del archivo actual
let currentFile = null;

// Tipos de archivo soportados
const SUPPORTED_TYPES = {
    csv: 'text/csv',
    csvAlt: 'application/csv', // Algunos navegadores usan esta variante
    excel: 'application/vnd.ms-excel', // .xls
    excelX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    json: 'application/json'
};

// Expresiones regulares para verificar extensiones
const FILE_EXTENSIONS = /\.(csv|xls|xlsx|json)$/i;

/**
 * Inicializa los eventos para la carga de archivos
 * @param {HTMLElement} dropArea - Elemento DOM donde se arrastrará el archivo
 * @param {HTMLElement} fileInput - Input de tipo file para seleccionar archivos
 * @param {HTMLElement} infoElement - Elemento para mostrar información del archivo
 * @param {HTMLElement} uploadButton - Botón para procesar el archivo seleccionado
 */
function initFileUpload(dropArea, fileInput, infoElement, uploadButton) {
    if (!dropArea || !fileInput) {
        console.error('Elementos requeridos no encontrados para la carga de archivos');
        return;
    }

    // Eventos de arrastrar y soltar
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('is-active');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('is-active');
        });
    });

    // Evento para cuando se suelta un archivo
    dropArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            handleFile(files[0], infoElement, uploadButton);
        }
    });

    // Evento para cuando se selecciona un archivo
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFile(fileInput.files[0], infoElement, uploadButton);
        }
    });
}

/**
 * Maneja el archivo seleccionado 
 * @param {File} file - Archivo seleccionado
 * @param {HTMLElement} infoElement - Elemento para mostrar información
 * @param {HTMLElement} uploadButton - Botón para activar/desactivar
 */
function handleFile(file, infoElement, uploadButton) {
    // Verificar si el archivo es válido
    if (!isValidFile(file)) {
        showError('Formato de archivo no soportado. Por favor, usa CSV, Excel o JSON.', infoElement);
        if (uploadButton) uploadButton.disabled = true;
        currentFile = null;
        return;
    }

    // Actualizar información del archivo
    currentFile = file;
    updateFileInfo(file, infoElement);
    
    // Habilitar botón de carga
    if (uploadButton) uploadButton.disabled = false;
}

/**
 * Verifica si el archivo es de un tipo soportado
 * @param {File} file - Archivo a verificar
 * @returns {boolean} - Verdadero si el archivo es válido
 */
function isValidFile(file) {
    // Verificar por tipo MIME
    const isSupportedType = Object.values(SUPPORTED_TYPES).some(type => 
        file.type === type || file.type.includes('sheet') || file.type.includes('csv')
    );
    
    // Verificar por extensión (respaldo)
    const isSupportedExtension = FILE_EXTENSIONS.test(file.name);
    
    return isSupportedType || isSupportedExtension;
}

/**
 * Muestra la información del archivo
 * @param {File} file - Archivo seleccionado
 * @param {HTMLElement} infoElement - Elemento para mostrar información
 */
function updateFileInfo(file, infoElement) {
    if (!infoElement) return;
    
    // Formatear tamaño del archivo
    const size = formatFileSize(file.size);
    
    // Determinar el tipo de archivo
    let fileType = 'Desconocido';
    if (file.name.endsWith('.csv') || file.type.includes('csv')) {
        fileType = 'CSV';
    } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx') || file.type.includes('excel') || file.type.includes('sheet')) {
        fileType = file.name.endsWith('.xlsx') ? 'Excel (XLSX)' : 'Excel (XLS)';
    } else if (file.name.endsWith('.json') || file.type.includes('json')) {
        fileType = 'JSON';
    }
    
    infoElement.innerHTML = `
        <div class="file-info-details">
            <p><strong>Archivo:</strong> ${file.name}</p>
            <p><strong>Tamaño:</strong> ${size}</p>
            <p><strong>Tipo:</strong> ${fileType}</p>
        </div>
    `;
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje de error
 * @param {HTMLElement} infoElement - Elemento para mostrar el error
 */
function showError(message, infoElement) {
    if (!infoElement) return;
    
    infoElement.innerHTML = `
        <div class="file-error">
            <p><i class="error-icon">⚠️</i> ${message}</p>
        </div>
    `;
}

/**
 * Formatea el tamaño del archivo para hacerlo legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Lee el contenido del archivo seleccionado
 * @param {Object} options - Opciones para procesar el archivo
 * @param {string} options.delimiter - Delimitador para archivos CSV
 * @param {string} options.encoding - Codificación del archivo
 * @param {Function} callback - Función a llamar con los datos procesados
 */
async function readFile(options = {}, callback) {
    if (!currentFile) {
        console.error('No hay archivo seleccionado');
        return;
    }
    
    try {
        const fileType = getFileType(currentFile);
        let data = null;
        
        switch (fileType) {
            case 'csv':
                data = await readCSV(currentFile, options);
                break;
            case 'excel':
                data = await readExcel(currentFile);
                break;
            case 'json':
                data = await readJSON(currentFile);
                break;
            default:
                throw new Error('Formato de archivo no soportado');
        }
        
        if (callback && typeof callback === 'function') {
            callback(null, data);
        }
        
        return data;
    } catch (error) {
        console.error('Error al leer el archivo:', error);
        if (callback && typeof callback === 'function') {
            callback(error, null);
        }
        throw error;
    }
}

/**
 * Determina el tipo de archivo basado en su nombre o tipo MIME
 * @param {File} file - Archivo a analizar
 * @returns {string} - Tipo de archivo: 'csv', 'excel', 'json' o 'unknown'
 */
function getFileType(file) {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    if (fileName.endsWith('.csv') || fileType.includes('csv')) {
        return 'csv';
    } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || 
               fileType.includes('excel') || fileType.includes('sheet')) {
        return 'excel';
    } else if (fileName.endsWith('.json') || fileType.includes('json')) {
        return 'json';
    }
    
    return 'unknown';
}

/**
 * Lee un archivo CSV y lo convierte a un objeto JavaScript
 * @param {File} file - Archivo CSV
 * @param {Object} options - Opciones para procesamiento
 * @returns {Promise<Array>} - Promesa que resuelve a un array de objetos
 */
function readCSV(file, options = {}) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        // Determinar el delimitador
        let delimiter = ',';
        if (options.delimiter) {
            switch(options.delimiter) {
                case 'comma': delimiter = ','; break;
                case 'semicolon': delimiter = ';'; break;
                case 'tab': delimiter = '\t'; break;
                default: delimiter = options.delimiter;
            }
        }
        
        reader.onload = function(event) {
            try {
                const csv = event.target.result;
                
                // Usar PapaParser para CSV si está disponible
                if (typeof Papa !== 'undefined') {
                    Papa.parse(csv, {
                        header: true,
                        dynamicTyping: true,
                        skipEmptyLines: true,
                        delimiter: delimiter,
                        complete: function(results) {
                            if (results.errors && results.errors.length > 0) {
                                console.warn('Advertencias al procesar CSV:', results.errors);
                            }
                            resolve({
                                data: results.data,
                                meta: results.meta
                            });
                        },
                        error: function(error) {
                            reject(error);
                        }
                    });
                    return;
                }
                
                // Implementación manual básica si PapaParser no está disponible
                const lines = csv.split(/\r\n|\n/);
                const headers = lines[0].split(delimiter);
                
                const result = [];
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;
                    
                    const obj = {};
                    const values = lines[i].split(delimiter);
                    
                    for (let j = 0; j < headers.length; j++) {
                        let value = values[j];
                        // Intentar convertir a número si es posible
                        if (!isNaN(value) && value.trim() !== '') {
                            value = parseFloat(value);
                        }
                        obj[headers[j]] = value;
                    }
                    
                    result.push(obj);
                }
                
                resolve({
                    data: result,
                    meta: { fields: headers }
                });
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(reader.error);
        };
        
        // Configurar codificación si se especifica
        const encoding = options.encoding || 'utf-8';
        reader.readAsText(file, encoding);
    });
}

/**
 * Lee un archivo Excel y lo convierte a un objeto JavaScript
 * @param {File} file - Archivo Excel (.xls o .xlsx)
 * @returns {Promise<Array>} - Promesa que resuelve a un array de objetos
 */
function readExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const data = event.target.result;
                
                // Verificar si la biblioteca SheetJS (XLSX) está disponible
                if (typeof XLSX === 'undefined') {
                    reject(new Error('La biblioteca XLSX no está disponible. Se requiere SheetJS para procesar archivos Excel.'));
                    return;
                }
                
                // Procesar archivo Excel
                const workbook = XLSX.read(data, {
                    type: 'binary',
                    cellDates: true,
                    cellNF: false,
                    cellText: false
                });
                
                // Obtener la primera hoja
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convertir a JSON con encabezados
                const json = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: ''
                });
                
                // Formato similar al de PapaParser para consistencia
                if (json.length > 0) {
                    const headers = json[0];
                    const rows = json.slice(1);
                    
                    const formattedData = rows.map(row => {
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index];
                        });
                        return obj;
                    });
                    
                    resolve({
                        data: formattedData,
                        meta: { 
                            fields: headers,
                            sheetNames: workbook.SheetNames 
                        }
                    });
                } else {
                    resolve({ data: [], meta: { fields: [] } });
                }
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(reader.error);
        };
        
        reader.readAsBinaryString(file);
    });
}

/**
 * Lee un archivo JSON y lo convierte a un objeto JavaScript
 * @param {File} file - Archivo JSON
 * @returns {Promise<Object>} - Promesa que resuelve al objeto JSON
 */
function readJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const json = JSON.parse(event.target.result);
                
                // Determinar si es un array de objetos o un objeto
                if (Array.isArray(json)) {
                    // Extraer campos de los datos
                    const fields = json.length > 0 ? Object.keys(json[0]) : [];
                    resolve({
                        data: json,
                        meta: { fields }
                    });
                } else {
                    // Intentar convertir el objeto a un formato tabular si es posible
                    if (typeof json === 'object' && json !== null) {
                        const fields = Object.keys(json);
                        resolve({
                            data: [json], // Un solo objeto como fila
                            meta: { fields }
                        });
                    } else {
                        resolve({
                            data: json,
                            meta: {}
                        });
                    }
                }
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(reader.error);
        };
        
        reader.readAsText(file);
    });
}

// Exportar funciones
window.FileUploader = {
    init: initFileUpload,
    handleFile,
    readFile,
    getCurrentFile: () => currentFile
};