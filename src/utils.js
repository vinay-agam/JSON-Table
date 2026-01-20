/**
 * Flattens a nested object into a single level object with dot notation keys.
 * @param {Object} obj - The object to flatten.
 * @param {string} [prefix=''] - The current prefix for recursive calls.
 * @returns {Object} - The flattened object.
 */
export function flattenObject(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (
            typeof obj[k] === 'object' &&
            obj[k] !== null &&
            !Array.isArray(obj[k]) &&
            Object.keys(obj[k]).length > 0
        ) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
}

/**
 * Unflattens a single level object with dot notation keys into a nested object.
 * @param {Object} obj - The object to unflatten.
 * @returns {Object} - The nested object.
 */
export function unflattenObject(obj) {
    const result = {};
    for (const i in obj) {
        const keys = i.split('.');
        keys.reduce((acc, key, index) => {
            return acc[key] || (acc[key] = isNaN(Number(keys[index + 1])) ? (keys.length - 1 === index ? obj[i] : {}) : []);
        }, result);
    }
    return result;
}

/**
 * Checks if a string is a valid JSON.
 * @param {string} str 
 * @returns {boolean}
 */
export function isValidJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Parses Tab-Separated Values (TSV) into an array of objects.
 * Assumes the first row contains headers.
 * @param {string} tsv 
 * @returns {Array<Object>}
 */
export function parseTsv(tsv) {
    const lines = tsv.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split('\t').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const obj = {};
        let hasValue = false;

        headers.forEach((header, index) => {
            let val = values[index];
            if (val !== undefined) {
                val = val.trim();
                // Simple type inference for pasted data
                if (!isNaN(val) && val !== '') {
                    val = Number(val);
                } else if (val.toLowerCase() === 'true') {
                    val = true;
                } else if (val.toLowerCase() === 'false') {
                    val = false;
                } else if (val === '') {
                    val = null;
                }
                obj[header] = val;
                hasValue = true;
            } else {
                obj[header] = null;
            }
        });

        if (hasValue) result.push(obj);
    }
    return result;
}
