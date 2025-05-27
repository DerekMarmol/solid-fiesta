/**
 * dataProcessor.js
 * Sistema para procesar, transformar y preparar datos para visualizaciones
 * También maneja el almacenamiento local de los datos
 */

// Clave para almacenar datos en localStorage
const STORAGE_KEY = 'dataapp_datasets';

// Límite de conjuntos de datos a guardar en localStorage
const MAX_STORED_DATASETS = 5;

// Estructura para almacenar datos en memoria
let dataStore = {
    currentData: null,       // Datos actuales
    currentMeta: null,       // Metadatos de los datos actuales
    datasetHistory: [],      // Historial de conjuntos de datos
    transformations: []      // Historial de transformaciones aplicadas
};

/**
 * Inicializa el procesador de datos cargando datos previos de localStorage
 */
function initDataProcessor() {
    try {
        // Cargar datos guardados
        loadFromLocalStorage();
        
        // Actualizar la interfaz si hay datos disponibles
        if (dataStore.datasetHistory.length > 0) {
            updateDatasetHistoryUI();
        }
    } catch (error) {
        console.error('Error al inicializar el procesador de datos:', error);
    }
}

/**
 * Procesa los datos cargados y los prepara para el análisis
 * @param {Object} rawData - Datos brutos del archivo o URL
 * @param {Object} options - Opciones para el procesamiento
 * @returns {Object} - Datos procesados
 */
function processData(rawData, options = {}) {
    try {
        if (!rawData) {
            throw new Error('No hay datos para procesar');
        }
        
        // Manejar diferentes formatos de entrada
        let data = rawData.data || rawData;
        let meta = rawData.meta || {};
        
        // Aplicar procesamiento básico
        const processedData = {
            data: cleanData(data, options),
            meta: enhanceMetadata(meta, options)
        };
        
        // Guardar en el almacén
        dataStore.currentData = processedData.data;
        dataStore.currentMeta = processedData.meta;
        
        // Guardar en el historial
        addToDatasetHistory(processedData);
        
        // Guardar en localStorage
        saveToLocalStorage();
        
        return processedData;
    } catch (error) {
        console.error('Error al procesar datos:', error);
        throw error;
    }
}

/**
 * Limpia y normaliza los datos
 * @param {Array} data - Datos a limpiar
 * @param {Object} options - Opciones de limpieza
 * @returns {Array} - Datos limpios
 */
function cleanData(data, options = {}) {
    if (!Array.isArray(data)) {
        // Intentar convertir a array si es posible
        if (typeof data === 'object' && data !== null) {
            data = [data];
        } else {
            return [];
        }
    }
    
    // Opciones de limpieza
    const {
        removeEmpty = true,
        convertTypes = true,
        trimStrings = true,
        normalizeHeaders = true
    } = options;
    
    // Limpiar datos
    return data.filter(row => {
        // Filtrar filas vacías
        if (removeEmpty) {
            const isEmpty = !row || Object.values(row).every(val => 
                val === null || val === undefined || val === ''
            );
            if (isEmpty) return false;
        }
        
        return true;
    }).map(row => {
        // Transformar valores en cada fila
        const cleanRow = {};
        
        Object.entries(row).forEach(([key, value]) => {
            // Normalizar nombres de columnas
            let cleanKey = key;
            if (normalizeHeaders && typeof key === 'string') {
                cleanKey = key.trim().replace(/\s+/g, '_').toLowerCase();
            }
            
            // Procesar valores
            let cleanValue = value;
            
            // Recortar espacios en cadenas
            if (trimStrings && typeof value === 'string') {
                cleanValue = value.trim();
            }
            
            // Convertir tipos (string -> number, etc.)
            if (convertTypes) {
                cleanValue = convertValueType(cleanValue);
            }
            
            cleanRow[cleanKey] = cleanValue;
        });
        
        return cleanRow;
    });
}

/**
 * Detecta y convierte el tipo de valor
 * @param {any} value - Valor a convertir
 * @returns {any} - Valor convertido
 */
function convertValueType(value) {
    // Si es null, undefined o ya es un número, no hacer nada
    if (value === null || value === undefined || typeof value !== 'string') {
        return value;
    }
    
    // Recortar espacios
    const trimmed = value.trim();
    
    // Si está vacío, devolver cadena vacía
    if (trimmed === '') {
        return '';
    }
    
    // Intentar convertir a número
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return parseFloat(trimmed);
    }
    
    // Intentar convertir a booleano
    if (trimmed.toLowerCase() === 'true') {
        return true;
    }
    if (trimmed.toLowerCase() === 'false') {
        return false;
    }
    
    // Intentar convertir a fecha (ISO 8601)
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(trimmed)) {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    
    // Mantener como string en otros casos
    return trimmed;
}

/**
 * Mejora los metadatos con información adicional sobre los datos
 * @param {Object} meta - Metadatos originales
 * @param {Object} options - Opciones adicionales
 * @returns {Object} - Metadatos mejorados
 */
function enhanceMetadata(meta, options = {}) {
    // Crear una copia para no modificar el original
    const enhancedMeta = JSON.parse(JSON.stringify(meta || {}));
    
    // Agregar timestamp
    enhancedMeta.processedAt = new Date().toISOString();
    
    // Nombre del conjunto de datos (opcional)
    if (options.datasetName) {
        enhancedMeta.datasetName = options.datasetName;
    }
    
    // Fuente de los datos (opcional)
    if (options.source) {
        enhancedMeta.source = options.source;
    }
    
    return enhancedMeta;
}

/**
 * Guarda un conjunto de datos en el historial
 * @param {Object} dataset - Conjunto de datos a guardar
 */
function addToDatasetHistory(dataset) {
    // Crear una copia para el historial
    const datasetCopy = JSON.parse(JSON.stringify(dataset));
    
    // Generar ID único para el conjunto de datos
    datasetCopy.id = generateDatasetId();
    
    // Agregar timestamp
    datasetCopy.timestamp = new Date().toISOString();
    
    // Generar descripción breve para el historial
    datasetCopy.description = generateDatasetDescription(datasetCopy);
    
    // Agregar al principio del historial
    dataStore.datasetHistory.unshift(datasetCopy);
    
    // Limitar el tamaño del historial
    if (dataStore.datasetHistory.length > MAX_STORED_DATASETS) {
        dataStore.datasetHistory = dataStore.datasetHistory.slice(0, MAX_STORED_DATASETS);
    }
}

/**
 * Genera un ID único para un conjunto de datos
 * @returns {string} - ID único
 */
function generateDatasetId() {
    return 'dataset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Genera una descripción breve del conjunto de datos
 * @param {Object} dataset - Conjunto de datos
 * @returns {string} - Descripción
 */
function generateDatasetDescription(dataset) {
    try {
        const data = dataset.data || [];
        const meta = dataset.meta || {};
        const datasetName = meta.datasetName || 'Dataset sin nombre';
        const rowCount = data.length;
        const colCount = data.length > 0 ? Object.keys(data[0]).length : 0;
        
        return `${datasetName} (${rowCount} filas, ${colCount} columnas)`;
    } catch (error) {
        return 'Dataset sin información';
    }
}

/**
 * Guarda los datos actuales en localStorage
 */
function saveToLocalStorage() {
    try {
        // Solo guardar los metadatos y referencias al historial para ahorrar espacio
        const storageData = {
            lastUpdated: new Date().toISOString(),
            currentDatasetId: dataStore.currentMeta?.id,
            datasetHistory: dataStore.datasetHistory.map(dataset => ({
                id: dataset.id,
                timestamp: dataset.timestamp,
                description: dataset.description,
                meta: dataset.meta,
                // Incluir solo una muestra de los datos para previsualización
                dataSample: dataset.data?.slice(0, 3) || []
            }))
        };
        
        // Guardar en localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
        console.error('Error al guardar datos en localStorage:', error);
    }
}

/**
 * Carga datos previos desde localStorage
 */
function loadFromLocalStorage() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            
            // Restaurar historial
            dataStore.datasetHistory = parsedData.datasetHistory || [];
            
            // Encontrar el conjunto de datos actual
            if (parsedData.currentDatasetId) {
                const currentDataset = dataStore.datasetHistory.find(
                    dataset => dataset.id === parsedData.currentDatasetId
                );
                
                if (currentDataset) {
                    dataStore.currentMeta = currentDataset.meta;
                    // Los datos completos no se guardan en localStorage
                    dataStore.currentData = currentDataset.dataSample;
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar datos desde localStorage:', error);
    }
}

/**
 * Actualiza la interfaz para mostrar el historial de conjuntos de datos
 */
function updateDatasetHistoryUI() {
    const historyContainer = document.querySelector('.upload-history');
    
    if (!historyContainer) return;
    
    if (dataStore.datasetHistory.length === 0) {
        historyContainer.innerHTML = '<p class="no-data">No hay archivos recientes</p>';
        return;
    }
    
    // Crear lista de conjuntos de datos
    const historyList = document.createElement('ul');
    historyList.className = 'dataset-history-list';
    
    // Limitar a los últimos 5 conjuntos
    const recentDatasets = dataStore.datasetHistory.slice(0, 5);
    
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
            loadDatasetFromHistory(dataset.id);
        });
        
        listItem.querySelector('[data-action="delete"]').addEventListener('click', () => {
            removeDatasetFromHistory(dataset.id);
        });
        
        historyList.appendChild(listItem);
    });
    
    // Limpiar contenedor y agregar la lista
    historyContainer.innerHTML = '';
    historyContainer.appendChild(historyList);
}

/**
 * Carga un conjunto de datos desde el historial
 * @param {string} datasetId - ID del conjunto de datos
 */
function loadDatasetFromHistory(datasetId) {
    const dataset = dataStore.datasetHistory.find(ds => ds.id === datasetId);
    
    if (!dataset) {
        console.error('Dataset no encontrado:', datasetId);
        return;
    }
    
    // Actualizar datos actuales
    dataStore.currentData = dataset.data;
    dataStore.currentMeta = dataset.meta;
    
    // Actualizar interfaz
    console.log('Dataset cargado:', dataset.meta?.datasetName);
    
    // Cambiar a la vista de análisis
    if (typeof loadView === 'function') {
        loadView('analysis');
    }
}

/**
 * Elimina un conjunto de datos del historial
 * @param {string} datasetId - ID del conjunto de datos
 */
function removeDatasetFromHistory(datasetId) {
    // Filtrar el historial
    dataStore.datasetHistory = dataStore.datasetHistory.filter(
        dataset => dataset.id !== datasetId
    );
    
    // Si el dataset eliminado era el actual, limpiar datos actuales
    if (dataStore.currentMeta?.id === datasetId) {
        dataStore.currentData = null;
        dataStore.currentMeta = null;
    }
    
    // Guardar cambios
    saveToLocalStorage();
    
    // Actualizar interfaz
    updateDatasetHistoryUI();
}

/**
 * Obtiene estadísticas básicas de los datos
 * @param {Array} data - Datos a analizar
 * @returns {Object} - Estadísticas
 */
function getDataStatistics(data = null) {
    const dataToAnalyze = data || dataStore.currentData || [];
    
    if (!Array.isArray(dataToAnalyze) || dataToAnalyze.length === 0) {
        return {
            rowCount: 0,
            columnCount: 0,
            columns: {}
        };
    }
    
    // Estadísticas básicas
    const statistics = {
        rowCount: dataToAnalyze.length,
        columnCount: 0,
        columns: {}
    };
    
    // Obtener lista de columnas del primer elemento
    const columnNames = Object.keys(dataToAnalyze[0]);
    statistics.columnCount = columnNames.length;
    
    // Analizar cada columna
    columnNames.forEach(col => {
        // Extraer todos los valores de la columna
        const values = dataToAnalyze.map(row => row[col]);
        
        // Detectar tipo de datos
        const dataType = detectColumnType(values);
        
        // Calcular estadísticas según el tipo
        const columnStats = {
            type: dataType,
            notNull: values.filter(v => v !== null && v !== undefined && v !== '').length,
            null: values.filter(v => v === null || v === undefined || v === '').length
        };
        
        // Estadísticas adicionales por tipo
        if (dataType === 'number') {
            const numericValues = values.filter(v => typeof v === 'number');
            columnStats.min = Math.min(...numericValues);
            columnStats.max = Math.max(...numericValues);
            columnStats.sum = numericValues.reduce((sum, v) => sum + v, 0);
            columnStats.mean = columnStats.sum / numericValues.length;
            
            // Calcular desviación estándar
            const variance = numericValues.reduce((sum, v) => sum + Math.pow(v - columnStats.mean, 2), 0) / numericValues.length;
            columnStats.stdDev = Math.sqrt(variance);
        }
        
        if (dataType === 'string') {
            // Valores únicos y frecuencia
            const valueCounts = {};
            values.forEach(v => {
                if (typeof v === 'string') {
                    valueCounts[v] = (valueCounts[v] || 0) + 1;
                }
            });
            
            // Ordenar por frecuencia
            const sortedValues = Object.entries(valueCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10); // Top 10 valores más frecuentes
            
            columnStats.uniqueValues = Object.keys(valueCounts).length;
            columnStats.mostFrequent = sortedValues;
        }
        
        if (dataType === 'date') {
            const dateValues = values.filter(v => v instanceof Date);
            columnStats.min = new Date(Math.min(...dateValues.map(d => d.getTime())));
            columnStats.max = new Date(Math.max(...dateValues.map(d => d.getTime())));
        }
        
        statistics.columns[col] = columnStats;
    });
    
    return statistics;
}

/**
 * Detecta el tipo de datos de una columna
 * @param {Array} values - Valores de la columna
 * @returns {string} - Tipo de datos: 'number', 'string', 'boolean', 'date', 'mixed'
 */
function detectColumnType(values) {
    // Contar tipos
    const typeCounts = values.reduce((counts, value) => {
        if (value instanceof Date) {
            counts.date++;
        } else if (typeof value === 'number') {
            counts.number++;
        } else if (typeof value === 'boolean') {
            counts.boolean++;
        } else if (typeof value === 'string') {
            counts.string++;
        } else if (value === null || value === undefined || value === '') {
            counts.null++;
        } else {
            counts.other++;
        }
        return counts;
    }, { number: 0, string: 0, boolean: 0, date: 0, null: 0, other: 0 });
    
    // Excluir valores nulos para porcentajes
    const nonNullCount = values.length - typeCounts.null;
    
    // Si más del 75% son números
    if (typeCounts.number / nonNullCount > 0.75) {
        return 'number';
    }
    
    // Si más del 75% son fechas
    if (typeCounts.date / nonNullCount > 0.75) {
        return 'date';
    }
    
    // Si más del 75% son booleanos
    if (typeCounts.boolean / nonNullCount > 0.75) {
        return 'boolean';
    }
    
    // Si más del 75% son strings
    if (typeCounts.string / nonNullCount > 0.75) {
        return 'string';
    }
    
    // Si es una mezcla
    return 'mixed';
}

/**
 * Aplica transformaciones a los datos
 * @param {Array} data - Datos a transformar
 * @param {Object} transformation - Transformación a aplicar
 * @returns {Array} - Datos transformados
 */
function transformData(data = null, transformation) {
    const dataToTransform = data || dataStore.currentData || [];
    
    if (!Array.isArray(dataToTransform) || dataToTransform.length === 0) {
        return [];
    }
    
    let transformedData = [...dataToTransform];
    
    try {
        if (!transformation || !transformation.type) {
            throw new Error('Transformación no válida');
        }
        
        switch (transformation.type) {
            case 'filter':
                transformedData = filterData(transformedData, transformation.params);
                break;
            case 'sort':
                transformedData = sortData(transformedData, transformation.params);
                break;
            case 'aggregate':
                transformedData = aggregateData(transformedData, transformation.params);
                break;
            case 'pivot':
                transformedData = pivotData(transformedData, transformation.params);
                break;
            default:
                throw new Error(`Tipo de transformación no soportado: ${transformation.type}`);
        }
        
        // Guardar historial de transformación
        dataStore.transformations.push({
            type: transformation.type,
            params: transformation.params,
            timestamp: new Date().toISOString(),
            description: transformation.description || 'Transformación aplicada'
        });
        
        return transformedData;
    } catch (error) {
        console.error('Error al transformar datos:', error);
        throw error;
    }
}

/**
 * Filtra los datos según condiciones
 * @param {Array} data - Datos a filtrar
 * @param {Object} params - Parámetros de filtrado
 * @returns {Array} - Datos filtrados
 */
function filterData(data, params) {
    if (!params || !params.conditions || !Array.isArray(params.conditions)) {
        return data;
    }
    
    return data.filter(row => {
        return params.conditions.every(condition => {
            const { column, operator, value } = condition;
            
            if (!column || !operator) return true;
            
            const fieldValue = row[column];
            
            switch (operator) {
                case 'eq': return fieldValue === value;
                case 'neq': return fieldValue !== value;
                case 'gt': return fieldValue > value;
                case 'lt': return fieldValue < value;
                case 'gte': return fieldValue >= value;
                case 'lte': return fieldValue <= value;
                case 'contains': 
                    return typeof fieldValue === 'string' && 
                           fieldValue.toLowerCase().includes(String(value).toLowerCase());
                case 'startsWith': 
                    return typeof fieldValue === 'string' && 
                           fieldValue.toLowerCase().startsWith(String(value).toLowerCase());
                case 'endsWith': 
                    return typeof fieldValue === 'string' && 
                           fieldValue.toLowerCase().endsWith(String(value).toLowerCase());
                case 'between':
                    return Array.isArray(value) && 
                           value.length === 2 && 
                           fieldValue >= value[0] && 
                           fieldValue <= value[1];
                case 'in':
                    return Array.isArray(value) && 
                           value.includes(fieldValue);
                default:
                    return true;
            }
        });
    });
}

/**
 * Ordena los datos según una o más columnas
 * @param {Array} data - Datos a ordenar
 * @param {Object} params - Parámetros de ordenación
 * @returns {Array} - Datos ordenados
 */
function sortData(data, params) {
    if (!params || !params.columns || !Array.isArray(params.columns) || params.columns.length === 0) {
        return data;
    }
    
    return [...data].sort((a, b) => {
        for (const sortCol of params.columns) {
            const { column, direction } = sortCol;
            const dir = direction === 'desc' ? -1 : 1;
            
            // Comparar según el tipo de dato
            const valA = a[column];
            const valB = b[column];
            
            let comparison = 0;
            
            // Manejar valores nulos
            if (valA === null || valA === undefined) {
                comparison = valB === null || valB === undefined ? 0 : -1;
            } else if (valB === null || valB === undefined) {
                comparison = 1;
            } else if (valA instanceof Date && valB instanceof Date) {
                comparison = valA.getTime() - valB.getTime();
            } else if (typeof valA === 'string' && typeof valB === 'string') {
                comparison = valA.localeCompare(valB);
            } else {
                comparison = valA < valB ? -1 : (valA > valB ? 1 : 0);
            }
            
            if (comparison !== 0) {
                return comparison * dir;
            }
        }
        
        return 0;
    });
}

/**
 * Agrega datos por una o más columnas
 * @param {Array} data - Datos a agregar
 * @param {Object} params - Parámetros de agregación
 * @returns {Array} - Datos agregados
 */
function aggregateData(data, params) {
    if (!params || !params.groupBy || !params.aggregations || !Array.isArray(params.aggregations)) {
        return data;
    }
    
    // Agrupar por las columnas especificadas
    const groups = {};
    
    data.forEach(row => {
        // Crear clave para el grupo
        let groupKey;
        
        if (Array.isArray(params.groupBy)) {
            groupKey = params.groupBy.map(col => row[col]).join('|');
        } else {
            groupKey = String(row[params.groupBy]);
        }
        
        // Inicializar grupo si no existe
        if (!groups[groupKey]) {
            groups[groupKey] = {
                _rows: [],
                _count: 0
            };
            
            // Agregar valores de columnas de agrupación
            if (Array.isArray(params.groupBy)) {
                params.groupBy.forEach(col => {
                    groups[groupKey][col] = row[col];
                });
            } else {
                groups[groupKey][params.groupBy] = row[params.groupBy];
            }
        }
        
        // Agregar fila al grupo
        groups[groupKey]._rows.push(row);
        groups[groupKey]._count++;
    });
    
    // Aplicar funciones de agregación
    const result = Object.values(groups).map(group => {
        const aggregated = {};
        
        // Copiar valores de grupos
        Object.keys(group).forEach(key => {
            if (!key.startsWith('_')) {
                aggregated[key] = group[key];
            }
        });
        
        // Agregar conteo
        aggregated.count = group._count;
        
        // Aplicar agregaciones
        params.aggregations.forEach(agg => {
            const { column, function: func, as } = agg;
            const outputName = as || `${func}_${column}`;
            
            // Obtener valores de la columna
            const values = group._rows.map(row => row[column])
                .filter(val => val !== null && val !== undefined && val !== '');
            
            // Si no hay valores, asignar null
            if (values.length === 0) {
                aggregated[outputName] = null;
                return;
            }
            
            // Aplicar función de agregación
            switch (func) {
                case 'sum':
                    aggregated[outputName] = values.reduce((sum, val) => sum + (Number(val) || 0), 0);
                    break;
                case 'avg':
                    aggregated[outputName] = values.reduce((sum, val) => sum + (Number(val) || 0), 0) / values.length;
                    break;
                case 'min':
                    aggregated[outputName] = Math.min(...values.map(v => Number(v) || 0));
                    break;
                case 'max':
                    aggregated[outputName] = Math.max(...values.map(v => Number(v) || 0));
                    break;
                case 'count':
                    aggregated[outputName] = values.length;
                    break;
                case 'count_distinct':
                    aggregated[outputName] = new Set(values).size;
                    break;
                case 'first':
                    aggregated[outputName] = values[0];
                    break;
                case 'last':
                    aggregated[outputName] = values[values.length - 1];
                    break;
                case 'list':
                    aggregated[outputName] = [...new Set(values)].join(', ');
                    break;
                default:
                    aggregated[outputName] = null;
            }
        });
        
        return aggregated;
    });
    
    return result;
}

/**
 * Crea una tabla pivote de los datos
 * @param {Array} data - Datos a pivotar
 * @param {Object} params - Parámetros de la tabla pivote
 * @returns {Array} - Datos pivotados
 */
function pivotData(data, params) {
    if (!params || !params.rowFields || !params.columnField || !params.valueField) {
        return data;
    }
    
    const rowFields = Array.isArray(params.rowFields) ? params.rowFields : [params.rowFields];
    const columnField = params.columnField;
    const valueField = params.valueField;
    const aggregationFunc = params.aggregationFunc || 'sum';
    
    // Paso 1: Obtener valores únicos de la columna de pivote
    const uniqueColumnValues = [...new Set(data.map(row => row[columnField]))].sort();
    
    // Paso 2: Crear grupos por combinación de valores de filas
    const rowGroups = {};
    
    data.forEach(row => {
        // Crear clave para el grupo de filas
        const rowKey = rowFields.map(field => row[field]).join('|');
        
        // Inicializar grupo si no existe
        if (!rowGroups[rowKey]) {
            rowGroups[rowKey] = {
                _key: rowKey,
                // Guardar valores de los campos de fila
                ...rowFields.reduce((obj, field) => {
                    obj[field] = row[field];
                    return obj;
                }, {})
            };
            
            // Inicializar todas las columnas con cero o null
            uniqueColumnValues.forEach(colValue => {
                rowGroups[rowKey][colValue] = null;
            });
        }
        
        // Valor de columna para esta fila
        const colValue = row[columnField];
        
        // Obtener el valor actual en esa celda
        const currentValue = rowGroups[rowKey][colValue];
        
        // Valor a agregar
        const valueToAggregate = row[valueField];
        
        // Aplicar la función de agregación correspondiente
        if (valueToAggregate !== null && valueToAggregate !== undefined) {
            switch (aggregationFunc) {
                case 'sum':
                    rowGroups[rowKey][colValue] = (currentValue || 0) + (Number(valueToAggregate) || 0);
                    break;
                case 'avg':
                    // Para promedios, almacenamos temporalmente una suma y un contador
                    if (!rowGroups[rowKey][`_count_${colValue}`]) {
                        rowGroups[rowKey][`_count_${colValue}`] = 0;
                        rowGroups[rowKey][`_sum_${colValue}`] = 0;
                    }
                    rowGroups[rowKey][`_count_${colValue}`]++;
                    rowGroups[rowKey][`_sum_${colValue}`] += (Number(valueToAggregate) || 0);
                    rowGroups[rowKey][colValue] = rowGroups[rowKey][`_sum_${colValue}`] / rowGroups[rowKey][`_count_${colValue}`];
                    break;
                case 'min':
                    if (currentValue === null || valueToAggregate < currentValue) {
                        rowGroups[rowKey][colValue] = Number(valueToAggregate);
                    }
                    break;
                case 'max':
                    if (currentValue === null || valueToAggregate > currentValue) {
                        rowGroups[rowKey][colValue] = Number(valueToAggregate);
                    }
                    break;
                case 'count':
                    rowGroups[rowKey][colValue] = (currentValue || 0) + 1;
                    break;
                case 'first':
                    if (currentValue === null) {
                        rowGroups[rowKey][colValue] = valueToAggregate;
                    }
                    break;
                case 'last':
                    // Siempre sobrescribimos para el último
                    rowGroups[rowKey][colValue] = valueToAggregate;
                    break;
                case 'list':
                    if (currentValue === null) {
                        rowGroups[rowKey][colValue] = [valueToAggregate];
                    } else {
                        if (!currentValue.includes(valueToAggregate)) {
                            rowGroups[rowKey][colValue].push(valueToAggregate);
                        }
                    }
                    break;
                default:
                    rowGroups[rowKey][colValue] = valueToAggregate;
            }
        }
    });
    
    // Paso 3: Convertir los grupos a un array de resultados
    const pivotedData = Object.values(rowGroups).map(group => {
        // Eliminar propiedades temporales usadas para cálculos
        const result = {};
        
        Object.keys(group).forEach(key => {
            if (!key.startsWith('_') || key === '_key') {
                result[key] = group[key];
            }
        });
        
        // Para el caso especial de 'list', convertir arrays a strings
        if (aggregationFunc === 'list') {
            uniqueColumnValues.forEach(colValue => {
                if (Array.isArray(result[colValue])) {
                    result[colValue] = result[colValue].join(', ');
                }
            });
        }
        
        return result;
    });
    
    return pivotedData;
}

/**
 * Exporta funciones para su uso desde otros scripts
 */
window.DataProcessor = {
    init: initDataProcessor,
    processData,
    cleanData,
    getDataStatistics,
    transformData,
    filterData,
    sortData,
    aggregateData,
    pivotData,
    
    // Acceso al almacén de datos
    getCurrentData: () => dataStore.currentData,
    getCurrentMeta: () => dataStore.currentMeta,
    getDatasetHistory: () => dataStore.datasetHistory,
    getTransformations: () => dataStore.transformations,
    
    // Funciones para gestionar datos
    loadDataset: loadDatasetFromHistory,
    removeDataset: removeDatasetFromHistory,
    clearAllData: () => {
        dataStore = {
            currentData: null,
            currentMeta: null,
            datasetHistory: [],
            transformations: []
        };
        localStorage.removeItem(STORAGE_KEY);
    }
};

// Inicializar automáticamente si está disponible document
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initDataProcessor);
}