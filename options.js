const authTokenEl = document.getElementById('authToken');
const saveBtn = document.getElementById('saveBtn');
const saveStatusEl = document.getElementById('saveStatus');
const addEndpointBtn = document.getElementById('addEndpointBtn');
const endpointsContainer = document.getElementById('endpointsContainer');

let endpoints = [];

async function loadOptions() {
    try {
        const data = await browser.storage.sync.get({
            endpoints: [],
            authToken: '',
            uploadMode: 'multipart'
        });

        endpoints = data.endpoints || [];
        authTokenEl.value = data.authToken || '';

        const radios = document.querySelectorAll('input[name="uploadMode"]');
        radios.forEach(r => {
            r.checked = (r.value === (data.uploadMode || 'multipart'));
        });

        renderEndpoints();
    } catch (err) {
        console.error('Error loading options from storage', err);
    }
}

function renderEndpoints() {
    endpointsContainer.innerHTML = '';

    if (endpoints.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = 'No endpoints configured. Click "Add Endpoint" to create one.';
        emptyMsg.style.color = '#666';
        emptyMsg.style.fontStyle = 'italic';
        endpointsContainer.appendChild(emptyMsg);
        return;
    }

    endpoints.forEach((endpoint, index) => {
        const item = document.createElement('div');
        item.className = 'endpoint-item';

        item.innerHTML = `
            <button type="button" class="remove-btn" data-index="${index}">Remove</button>
            <h3>Endpoint ${index + 1}</h3>
            
            <label for="endpoint-label-${index}">Label</label>
            <input id="endpoint-label-${index}" type="text" 
                   value="${escapeHtml(endpoint.label || '')}" 
                   placeholder="e.g., Production, Staging, Local" 
                   data-index="${index}" 
                   data-field="label" />
            
            <label for="endpoint-url-${index}">API URL</label>
            <input id="endpoint-url-${index}" type="text" 
                   value="${escapeHtml(endpoint.url || '')}" 
                   placeholder="https://api.example.com/upload" 
                   data-index="${index}" 
                   data-field="url" />
            
            <label for="endpoint-token-${index}">Authentication Token (Optional)</label>
            <input id="endpoint-token-${index}" type="password" 
                   value="${escapeHtml(endpoint.token || '')}"  
                   data-index="${index}" 
                   data-field="token" />
        `;

        endpointsContainer.appendChild(item);

        item.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                endpoints[index][field] = e.target.value;
            });
        });

        item.querySelector('.remove-btn').addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removeEndpoint(index);
        });
    });
}

function addEndpoint() {
    endpoints.push({ label: '', url: '', token: '' });
    renderEndpoints();
}

function removeEndpoint(index) {
    if (confirm(`Remove endpoint "${endpoints[index].label || 'Endpoint ' + (index + 1)}"?`)) {
        endpoints.splice(index, 1);
        renderEndpoints();
    }
}

async function saveOptions() {
    const authToken = authTokenEl.value;
    const uploadMode = document.querySelector('input[name="uploadMode"]:checked')?.value || 'multipart';

    const validEndpoints = endpoints.filter(ep => ep.url.trim() !== '');

    if (validEndpoints.length !== endpoints.length) {
        const confirm = window.confirm('Some endpoints have empty URLs and will not be saved. Continue?');
        if (!confirm) return;
    }

    try {
        await browser.storage.sync.set({
            endpoints: validEndpoints,
            authToken,
            uploadMode
        });

        endpoints = validEndpoints;
        renderEndpoints();

        saveStatusEl.textContent = 'Saved';
        saveStatusEl.style.color = '#008000';
        setTimeout(() => { saveStatusEl.textContent = ''; }, 2000);
    } catch (err) {
        console.error('Failed to save options', err);
        saveStatusEl.textContent = 'Error saving';
        saveStatusEl.style.color = '#FF0000';
    }
}

//based on this: https://stackoverflow.com/a/17546215
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

saveBtn.addEventListener('click', saveOptions);
addEndpointBtn.addEventListener('click', addEndpoint);

document.addEventListener('DOMContentLoaded', loadOptions);
