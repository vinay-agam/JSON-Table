import './style.css';
import { jsonToTable, tableToJson, tableToTsv, transposeTable } from './converter.js';
import { renderTable, getTableData, showJsonError, hideJsonError } from './ui.js';
import { HistoryManager } from './history.js';

// Initial state and references
const jsonEditor = document.getElementById('json-editor');
const tableContainer = document.getElementById('table-container');
const jsonError = document.getElementById('json-error');

// Buttons
const btnExample = document.getElementById('btn-example');
const btnClear = document.getElementById('btn-clear');
const btnCopyJson = document.getElementById('btn-copy-json');
const btnPrettifyJson = document.getElementById('btn-prettify-json');
const btnMinifyJson = document.getElementById('btn-minify-json');
const btnCopyTable = document.getElementById('btn-copy-table');
const btnTranspose = document.getElementById('btn-transpose');

const history = new HistoryManager();
let isUpdatingJson = false;
let isUpdatingTable = false;
let isUndoRedo = false;

console.log('App initialized');

// Event Listeners
// Event Listeners
// Event Listeners
jsonEditor.addEventListener('input', handleJsonInput);
tableContainer.addEventListener('input', handleTableInput); // standard
tableContainer.addEventListener('keyup', handleTableInput); // fallback for some browsers
tableContainer.addEventListener('paste', handleTablePaste);

function handleTablePaste(e) {
  // If user is pasting into a specific cell and it's simple text, let it be.
  // But if it looks like TSV (multiple lines or tabs), capture it.

  // However, the requirement is "Users can paste tabular data directly... into the Table pane".
  // If the table is empty/placeholder is shown, we MUST capture it.

  const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
  const isTsv = clipboardData.includes('\t') || (clipboardData.includes('\n') && clipboardData.split('\n').length > 1);
  const hasTable = tableContainer.querySelector('table');

  if (!hasTable || isTsv) {
    e.preventDefault();
    try {
      // Import parseTsv dynamically or if already imported. 
      // We need to import it at top provided we added it to utils.
      // For now assume we added it.
      // Actually I need to update imports first.

      // Check if it is valid JSON first? Some users might paste JSON into table side?
      // Unlikely, but possible. Prioritize TSV logic for table side.

      import('./utils.js').then(({ parseTsv, unflattenObject }) => {
        const flatData = parseTsv(clipboardData);
        if (flatData.length > 0) {
          // We need to unflatten if the headers have dots?
          // The parsing logic creates flat objects.
          // The app treats data as nested.
          // So we should unflatten each row.
          const deepData = flatData.map(item => unflattenObject(item));

          updateAll(JSON.stringify(deepData, null, 2));
          saveToHistory();
          showToast('Table Data Pasted!');
        } else {
          // Fallback or empty
        }
      });
    } catch (err) {
      console.error('Paste error', err);
    }
  } else {
    // Standard paste into a cell
    setTimeout(handleTableInput, 0);
  }
}

// Global Undo/Redo
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    const newState = history.undo();
    if (newState !== null) {
      applyState(newState);
    }
  } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
    e.preventDefault();
    const newState = history.redo();
    if (newState !== null) {
      applyState(newState);
    }
  }
});

// Button Listeners
btnExample?.addEventListener('click', () => {
  const example = [
    { "id": 1, "name": "Alice", "role": "Admin", "details": { "active": true, "since": "2023" } },
    { "id": 2, "name": "Bob", "role": "User", "details": { "active": false } },
    { "id": 3, "name": "Charlie", "role": "User", "details": { "active": true, "since": "2024" } }
  ];
  updateAll(JSON.stringify(example, null, 2));
  saveToHistory();
});

btnClear?.addEventListener('click', () => {
  updateAll('');
  saveToHistory();
  showToast('Workspace Cleared (Ctrl+Z to Undo)');
});

btnCopyJson?.addEventListener('click', () => {
  const text = jsonEditor.value;
  if (text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('JSON Copied!');
    });
  }
});

btnPrettifyJson?.addEventListener('click', () => {
  try {
    const val = jsonEditor.value;
    if (!val) return;
    const parsed = JSON.parse(val);
    jsonEditor.value = JSON.stringify(parsed, null, 2);
    saveToHistory();
  } catch (e) {
    showJsonError('Invalid JSON', jsonError);
  }
});

btnMinifyJson?.addEventListener('click', () => {
  try {
    const val = jsonEditor.value;
    if (!val) return;
    const parsed = JSON.parse(val);
    jsonEditor.value = JSON.stringify(parsed);
    saveToHistory();
  } catch (e) {
    showJsonError('Invalid JSON', jsonError);
  }
});

btnCopyTable?.addEventListener('click', () => {
  const { headers, rows } = getTableData(tableContainer);

  if (headers.length === 0) {
    showToast('Table is empty');
    return;
  }

  const tsv = tableToTsv(headers, rows);

  navigator.clipboard.writeText(tsv).then(() => {
    showToast('Table Text Copied!');
  }).catch(err => {
    console.error('Failed to copy: ', err);
    showToast('Copy Failed');
  });
});

btnTranspose?.addEventListener('click', () => {
  const { headers, rows } = getTableData(tableContainer);
  if (headers.length === 0) {
    showToast('Table is empty');
    return;
  }

  const transposed = transposeTable(headers, rows);

  // Render new table
  renderTable(transposed.headers, transposed.rows, tableContainer);

  // Update JSON to reflect the structure change
  const finalJson = tableToJson(transposed.headers, transposed.rows);
  const jsonStr = JSON.stringify(finalJson, null, 2);

  isUpdatingJson = true;
  jsonEditor.value = jsonStr;
  isUpdatingJson = false;

  saveToHistory();
  showToast('Table Transposed');
});


// Core Functions

function updateAll(jsonStr) {
  isUndoRedo = true;
  jsonEditor.value = jsonStr;
  try {
    if (!jsonStr) {
      tableContainer.innerHTML = '<div class="p-8 text-center text-gray-400">Paste JSON to generate table<br>or paste Excel data here</div>';
      hideJsonError(jsonError);
    } else {
      const jsonData = JSON.parse(jsonStr);
      hideJsonError(jsonError);
      const { headers, rows } = jsonToTable(jsonData);
      renderTable(headers, rows, tableContainer);
    }
  } catch (e) {
    showJsonError('Invalid JSON', jsonError);
  }
  isUndoRedo = false;
}


function applyState(jsonStr) {
  updateAll(jsonStr);
}


function handleJsonInput() {
  if (isUpdatingJson || isUndoRedo) return;

  saveToHistory();

  const jsonStr = jsonEditor.value.trim();
  if (!jsonStr) {
    tableContainer.innerHTML = '<div class="p-8 text-center text-gray-400">Paste JSON to generate table<br>or paste Excel data here</div>';
    hideJsonError(jsonError);
    return;
  }

  try {
    const jsonData = JSON.parse(jsonStr);
    hideJsonError(jsonError);

    const { headers, rows } = jsonToTable(jsonData);

    isUpdatingTable = true;
    renderTable(headers, rows, tableContainer);
    isUpdatingTable = false;

  } catch (e) {
    showJsonError('Invalid JSON: ' + e.message, jsonError);
  }
}

function saveToHistory() {
  const current = jsonEditor.value;
  if (history.current() !== current) {
    history.push(current);
  }
}

function handleTableInput() {
  if (isUpdatingTable || isUndoRedo) return;

  const { headers, rows } = getTableData(tableContainer);
  const jsonData = tableToJson(headers, rows);
  const jsonStr = JSON.stringify(jsonData, null, 2);

  isUpdatingJson = true;
  jsonEditor.value = jsonStr;
  isUpdatingJson = false;

  saveToHistory();

  hideJsonError(jsonError);
}

// Simple Toast
function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow text-sm z-50 animate-fade-in-up';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}
