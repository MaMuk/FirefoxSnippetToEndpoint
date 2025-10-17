const apiEndpointEl = document.getElementById('apiEndpoint');
const authTokenEl = document.getElementById('authToken');
const saveBtn = document.getElementById('saveBtn');
const saveStatusEl = document.getElementById('saveStatus');

async function loadOptions() {
    try {
        const data = await browser.storage.sync.get({
            apiEndpoint: '',
            authToken: '',
            uploadMode: 'multipart'
        });

        apiEndpointEl.value = data.apiEndpoint || '';
        authTokenEl.value = data.authToken || '';

        const radios = document.querySelectorAll('input[name="uploadMode"]');
        radios.forEach(r => {
            r.checked = (r.value === (data.uploadMode || 'multipart'));
        });
    } catch (err) {
        console.error('Error loading options from storage', err);
    }
}

async function saveOptions() {
    const apiEndpoint = apiEndpointEl.value.trim();
    const authToken = authTokenEl.value;
    const uploadMode = document.querySelector('input[name="uploadMode"]:checked')?.value || 'multipart';

    try {
        await browser.storage.sync.set({ apiEndpoint, authToken, uploadMode });
        saveStatusEl.textContent = 'Saved';
        saveStatusEl.style.color = '#008000';
        setTimeout(() => { saveStatusEl.textContent = ''; }, 2000);
    } catch (err) {
        console.error('Failed to save options', err);
        saveStatusEl.textContent = 'Error saving';
        saveStatusEl.style.color = '#FF0000';
    }
}

saveBtn.addEventListener('click', saveOptions);

document.addEventListener('DOMContentLoaded', loadOptions);
