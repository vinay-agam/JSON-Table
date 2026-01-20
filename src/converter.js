import { flattenObject, unflattenObject } from './utils.js';

/**
 * Converts JSON data to a table structure.
 * @param {Array|Object} jsonData - The JSON data to convert.
 * @returns {Object} - { headers: string[], rows: Object[] }
 */
export function jsonToTable(jsonData) {
    let dataArray = [];

    // Ensure input is an array
    if (Array.isArray(jsonData)) {
        dataArray = jsonData;
    } else if (typeof jsonData === 'object' && jsonData !== null) {
        dataArray = [jsonData];
    } else {
        return { headers: [], rows: [] };
    }

    // Flatten all objects in the array
    const flattenedRows = dataArray.map(item => {
        if (typeof item === 'object' && item !== null) {
            return flattenObject(item);
        }
        return { value: item }; // Handle primitives in array
    });

    // Collect all unique keys for headers
    const headersSet = new Set();
    flattenedRows.forEach(row => {
        Object.keys(row).forEach(key => headersSet.add(key));
    });

    const headers = Array.from(headersSet);

    return {
        headers,
        rows: flattenedRows
    };
}

/**
 * Converts table data back to JSON.
 * @param {string[]} headers 
 * @param {Object[]} rows - Array of objects where keys are headers and values are cell content.
 * @returns {Array} - The nested JSON array.
 */
export function tableToJson(headers, rows) {
    return rows.map(row => {
        const flatObject = {};
        headers.forEach(header => {
            const value = row[header];
            // Skip empty strings to keep JSON clean (optional choice, but good for sparse tables)
            // But if user explicitly wants empty string, this might be an issue. 
            // Requirement says "Empty cells -> null".

            flatObject[header] = inferType(value);
        });
        return unflattenObject(flatObject);
    });
}

/**
 * Infers the data type from a string value.
 * @param {string} value 
 * @returns {any}
 */
function inferType(value) {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();

    if (trimmed === '') return null; // Requirement: Empty cells -> null
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;

    // Number check
    if (!isNaN(trimmed) && trimmed !== '') {
        return Number(trimmed);
    }

    // Attempt to parse JSON (for arrays or objects in cells)
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            // treat as string if parse fails
        }
    }

    return value;
}

/**
 * Converts table data to TSV string.
 * @param {string[]} headers 
 * @param {Object[]} rows 
 * @returns {string}
 */
export function tableToTsv(headers, rows) {
    if (!headers || headers.length === 0) return '';

    const headerRow = headers.join('\t');
    const dataRows = rows.map(row => {
        return headers.map(header => {
            let val = row[header];
            if (val === null || val === undefined) return '';
            // Clean tabs and newlines for text representation
            return String(val).replace(/\t/g, '    ').replace(/\n/g, ' ');
        }).join('\t');
    }).join('\n');

    return headerRow + '\n' + dataRows;
}

/**
 * Transposes the table data (swaps rows and columns).
 * @param {string[]} headers 
 * @param {Object[]} rows 
 * @returns {Object} { headers: string[], rows: Object[] }
 */
export function transposeTable(headers, rows) {
    if (!headers || headers.length === 0) return { headers: [], rows: [] };

    // Use the first header of the original table as the first header of the new table
    const pivotHeader = headers[0];

    const newHeaders = [pivotHeader];

    // Generate subsequent headers from the values in the first column of the original rows
    rows.forEach((row, index) => {
        let label = row[pivotHeader];

        // Handle non-string or empty values
        if (label === null || label === undefined || (typeof label === 'string' && label.trim() === '')) {
            label = `Column ${index + 1}`;
        } else if (typeof label === 'object') {
            // If the value is an object/array, stringify it or use a fallback
            label = `Column ${index + 1}`;
        }

        let uniqueLabel = String(label);

        // Ensure uniqueness (simple increment)
        let originalLabel = uniqueLabel;
        let counter = 2;
        while (newHeaders.includes(uniqueLabel)) {
            uniqueLabel = `${originalLabel} ${counter}`;
            counter++;
        }

        newHeaders.push(uniqueLabel);
    });

    // Create new rows from the remaining headers
    // If original was single column, we just have headers now (valid state)
    const remainingHeaders = headers.slice(1);

    const newRows = remainingHeaders.map(headerKey => {
        const rowData = {};

        // First column contains the key name
        rowData[pivotHeader] = headerKey;

        rows.forEach((row, index) => {
            // Map values to the newly generated headers
            // newHeaders[0] is pivot, newHeaders[1] is row 0, etc.
            const colHeader = newHeaders[index + 1];
            rowData[colHeader] = row[headerKey];
        });

        return rowData;
    });

    return { headers: newHeaders, rows: newRows };
}
