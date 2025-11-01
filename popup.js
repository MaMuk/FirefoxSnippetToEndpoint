const statusEl = document.getElementById('status');
function setStatus(msg, isError = false) {
    console.log(msg);
    statusEl.textContent = msg;
    statusEl.style.color = isError ? '#a00' : '#222';
}

const endpointDisplay = document.getElementById('endpointDisplay');
function showEndpointText(endpoints) {
    if (!endpoints || endpoints.length === 0) {
        endpointDisplay.textContent = 'No endpoints configured';
        endpointDisplay.style.color = '#d32f2f';
    } else {
        endpointDisplay.textContent = `${endpoints.length} endpoint${endpoints.length === 1 ? '' : 's'} configured`;
        endpointDisplay.style.color = '#222';
    }
}

loadSettingsAndShow();
document.getElementById('openOptions').addEventListener('click', (e) => {
    e.preventDefault();
    browser.runtime.openOptionsPage();
});

async function loadSettingsAndShow() {
    try {
        const data = await browser.storage.sync.get({
            endpoints: [],
            authToken: '',
            uploadMode: 'multipart'
        });
        showEndpointText(data.endpoints);
    } catch (err) {
        showEndpointText([]);
        console.error('Failed to read settings from storage', err);
    }
}

async function captureAndPreview(selectionOnly) {
    setStatus('Capturing page...');

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
        setStatus('No active tab found.', true);
        return;
    }

    const result = await browser.runtime.sendMessage({
        type: 'capturePage',
        tabId: tab.id,
        selectionOnly
    });

    if (!result) {
        setStatus('No response from background.', true);
        return;
    } else if (!result.success) {
        setStatus('Error: ' + result.error, true);
        return;
    }
    const title = tab.title || 'page';
    const url = tab.url || '';
    const sanitizedHtml = result.sanitizedHtml;
const jsonLdSnippets = result.jsonLdSnippets || [];

openPreview(sanitizedHtml, title, url, jsonLdSnippets);
}

document.getElementById('captureBtn').addEventListener('click', async () => {
    document.getElementById('captureBtn').disabled = true;
    await captureAndPreview(false);
    document.getElementById('captureBtn').disabled = false;
});

document.getElementById('captureSelectionBtn').addEventListener('click', async () => {
    document.getElementById('captureSelectionBtn').disabled = true;
    await captureAndPreview(true);
    document.getElementById('captureSelectionBtn').disabled = false;
});


async function openPreview(sanitizedHtml, title, url, jsonLdSnippets) {
    sessionStorage.clear();
    sessionStorage.setItem('sanitizedHtml', sanitizedHtml);
    sessionStorage.setItem('pageTitle', title);
    sessionStorage.setItem('pageUrl', url);
    sessionStorage.setItem('jsonLdSnippets', JSON.stringify(jsonLdSnippets));

    window.open(browser.runtime.getURL('preview.html'), 'Capture Preview', 'width=800,height=600');
}