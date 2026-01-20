/**
 * Renders the table into the container.
 * @param {string[]} headers 
 * @param {Object[]} rows 
 * @param {HTMLElement} container 
 */
export function renderTable(headers, rows, container) {
    if (headers.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-gray-400">No data to display</div>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'w-full border-collapse text-sm';

    // Header Reference
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    trHead.className = 'bg-gray-50';

    headers.forEach(header => {
        const th = document.createElement('th');
        th.className = 'border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700 select-none';
        th.textContent = header;
        th.dataset.key = header; // Persist key
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';

        headers.forEach(header => {
            const td = document.createElement('td');
            td.className = 'border border-gray-300 px-4 py-2 outline-none focus:ring-2 ring-inset ring-blue-500 min-w-[50px]';
            td.contentEditable = true;

            // Safe access to value
            const val = row[header];

            // Format value for display
            if (val === null) {
                td.textContent = 'null'; // Visual representation, but we might want to handle this specifically on read
                td.classList.add('text-gray-400', 'italic');
            } else if (val === undefined) {
                td.textContent = '';
            } else if (typeof val === 'object') {
                td.textContent = JSON.stringify(val);
            } else {
                td.textContent = String(val);
            }

            td.dataset.key = header;

            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
}

/**
 * Extracts data from the rendered table.
 * @param {HTMLElement} container 
 * @returns {Object} { headers: string[], rows: Object[] }
 */
export function getTableData(container) {
    const table = container.querySelector('table');
    if (!table) return { headers: [], rows: [] };

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.dataset.key || th.textContent);

    const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
        const rowData = {};
        Array.from(tr.querySelectorAll('td')).forEach((td, index) => {
            const key = headers[index];
            let value = td.textContent;

            // Handle specific "null" visual
            if (value === 'null' && td.classList.contains('text-gray-400')) {
                value = null; // actually null string will be inferred as null by converter
            }

            rowData[key] = value;
        });
        return rowData;
    });

    return { headers, rows };
}

/**
 * Displays error message.
 * @param {string} msg 
 * @param {HTMLElement} errorElement 
 */
export function showJsonError(msg, errorElement) {
    if (errorElement) {
        errorElement.textContent = msg;
        errorElement.classList.remove('hidden');
    }
}

/**
 * Hides error message.
 * @param {HTMLElement} errorElement 
 */
export function hideJsonError(errorElement) {
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}
