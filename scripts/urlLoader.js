/**
 * urlLoader.js
 * Sistema para cargar datos desde URLs externas (APIs, archivos remotos, etc.)
 */

// Cache para evitar solicitudes repetidas
const requestCache = new Map();

// Tiempo de expiración del caché en milisegundos (10 minutos por defecto)
const CACHE_EXPIRATION = 10 * 60 * 1000;

// Tipos de datos soportados
const DATA_TYPES = {
    JSON: 'json',
    CSV: 'csv', 
    TEXT: 'text'
};

/**
 * Realiza una petición a una URL y devuelve los datos procesados
 * @param {string} url - URL del recurso
 * @param {Object} options - Opciones de la petición
 * @param {string} options.dataType - Tipo de datos esperado: 'json', 'csv', 'text'
 * @param {boolean} options.useCache - Si debe usar caché
 * @param {Object} options.fetchOptions - Opciones para fetch API
 * @param {Object} options.csvOptions - Opciones para procesar CSV
 * @param {Function} callback - Función de callback con (error, data)
 * @returns {Promise<Object>} - Promesa con los datos procesados
 */
async function fetchData(url, options = {}, callback) {
    try {
        // Valores por defecto
        const defaults = {
            dataType: DATA_TYPES.JSON,
            useCache: true,
            fetchOptions: {},
            csvOptions: {}
        };
        
        // Combinar opciones con valores por defecto
        const config = {...defaults, ...options};
        
        // Verificar si la URL es válida
        if (!isValidUrl(url)) {
            const error = new Error('URL no válida');
            if (callback) callback(error, null);
            throw error;
        }
        
        // Verificar caché
        if (config.useCache) {
            const cachedData = getCachedData(url);
            if (cachedData) {
                if (callback) callback(null, cachedData);
                return cachedData;
            }
        }
        
        // Configurar opciones de fetch
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, text/csv, */*'
            },
            ...config.fetchOptions
        };
        
        // Realizar petición
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
        }
        
        // Procesar respuesta según tipo de datos
        let data;
        switch (config.dataType.toLowerCase()) {
            case DATA_TYPES.JSON:
                data = await response.json();
                break;
            case DATA_TYPES.CSV:
                const text = await response.text();
                data = parseCSV(text, config.csvOptions);
                break;
            case DATA_TYPES.TEXT:
            default:
                data = await response.text();
                break;
        }
        
        // Guardar en caché
        if (config.useCache) {
            cacheData(url, data);
        }
        
        // Llamar callback si existe
        if (callback) callback(null, data);
        
        return data;
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        if (callback) callback(error, null);
        throw error;
    }
}

/**
 * Valida si una cadena es una URL válida
 * @param {string} url - URL a validar
 * @returns {boolean} - Verdadero si es una URL válida
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Obtiene datos del caché si no han expirado
 * @param {string} url - URL del recurso
 * @returns {Object|null} - Datos en caché o null si no existen o han expirado
 */
function getCachedData(url) {
    if (requestCache.has(url)) {
        const cachedItem = requestCache.get(url);
        const now = Date.now();
        
        // Verificar si el caché ha expirado
        if (now - cachedItem.timestamp < CACHE_EXPIRATION) {
            return cachedItem.data;
        } else {
            // Eliminar datos expirados
            requestCache.delete(url);
        }
    }
    return null;
}

/**
 * Guarda datos en el caché con marca de tiempo
 * @param {string} url - URL del recurso
 * @param {Object} data - Datos a almacenar
 */
function cacheData(url, data) {
    requestCache.set(url, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Limpia todos los datos en caché
 */
function clearCache() {
    requestCache.clear();
}

/**
 * Analiza texto CSV y lo convierte a un objeto
 * @param {string} text - Texto CSV
 * @param {Object} options - Opciones para procesar CSV
 * @returns {Object} - Datos procesados
 */
function parseCSV(text, options = {}) {
    try {
        // Si PapaParser está disponible
        if (typeof Papa !== 'undefined') {
            const result = Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                ...options
            });
            
            return {
                data: result.data,
                meta: result.meta
            };
        }
        
        // Implementación manual básica si PapaParser no está disponible
        const delimiter = options.delimiter || ',';
        const lines = text.split(/\r\n|\n/);
        const headers = lines[0].split(delimiter).map(h => h.trim());
        
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(delimiter);
            const entry = {};
            
            for (let j = 0; j < headers.length; j++) {
                let value = values[j] ? values[j].trim() : '';
                
                // Convertir a número si es posible
                if (options.dynamicTyping !== false && !isNaN(value) && value !== '') {
                    value = parseFloat(value);
                }
                
                entry[headers[j]] = value;
            }
            
            result.push(entry);
        }
        
        return {
            data: result,
            meta: { fields: headers }
        };
    } catch (error) {
        console.error('Error al analizar CSV:', error);
        throw error;
    }
}

/**
 * Detecta el tipo de datos de una URL basado en su extensión o contenido
 * @param {string} url - URL a analizar
 * @returns {string} - Tipo de datos: 'json', 'csv', 'text'
 */
function detectDataType(url) {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.endsWith('.json') || lowerUrl.includes('api') || lowerUrl.includes('json')) {
        return DATA_TYPES.JSON;
    } else if (lowerUrl.endsWith('.csv')) {
        return DATA_TYPES.CSV;
    } else {
        return DATA_TYPES.TEXT;
    }
}

/**
 * Obtiene datos de una API pública
 * @param {string} apiUrl - URL de la API
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - Promesa con los datos
 */
async function fetchFromApi(apiUrl, options = {}) {
    return fetchData(apiUrl, {
        dataType: DATA_TYPES.JSON,
        ...options
    });
}

/**
 * Carga un archivo CSV desde una URL
 * @param {string} csvUrl - URL del archivo CSV
 * @param {Object} options - Opciones para procesar CSV
 * @returns {Promise<Object>} - Promesa con los datos
 */
async function loadCSV(csvUrl, options = {}) {
    return fetchData(csvUrl, {
        dataType: DATA_TYPES.CSV,
        csvOptions: options
    });
}

/**
 * Convierte una URL de Google Sheets a una URL de CSV descargable
 * @param {string} sheetsUrl - URL de Google Sheets
 * @returns {string} - URL para descargar como CSV
 */
function getGoogleSheetsCsvUrl(sheetsUrl) {
    try {
        // Verificar si es una URL de Google Sheets
        if (!sheetsUrl.includes('docs.google.com/spreadsheets')) {
            throw new Error('No es una URL válida de Google Sheets');
        }
        
        // Extraer el ID del documento
        let sheetId = '';
        
        // Formato 1: https://docs.google.com/spreadsheets/d/SHEET_ID/edit
        const idMatch = sheetsUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1]) {
            sheetId = idMatch[1];
        }
        
        if (!sheetId) {
            throw new Error('No se pudo extraer el ID del documento');
        }
        
        // Obtener el índice de la hoja (0 por defecto)
        let sheetIndex = 0;
        const gidMatch = sheetsUrl.match(/[#&]gid=([0-9]+)/);
        if (gidMatch && gidMatch[1]) {
            sheetIndex = gidMatch[1];
        }
        
        // Construir URL de exportación
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetIndex}`;
    } catch (error) {
        console.error('Error al procesar URL de Google Sheets:', error);
        return sheetsUrl; // Devolver la URL original en caso de error
    }
}

// Exportar funciones
window.UrlLoader = {
    fetchData,
    fetchFromApi,
    loadCSV,
    getGoogleSheetsCsvUrl,
    clearCache,
    detectDataType,
    DATA_TYPES
};