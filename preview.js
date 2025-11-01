(async () => {
    const iframe = document.getElementById('preview');
    const sendBtn = document.getElementById('sendBtn');
    const endpointSelect = document.getElementById('endpointSelect');
    const jsonLdCheckbox = document.getElementById('jsonLdCheckbox');
    const jsonLdContainer = document.getElementById('jsonLdContainer');
    const jsonLdSelect = document.getElementById('jsonLdSelect');
    const jsonLdPreview = document.getElementById('jsonLdPreview');
    const togglePreviewBtn = document.getElementById('togglePreviewBtn');

    const sanitizedHtml = sessionStorage.getItem('sanitizedHtml');
    const title = sessionStorage.getItem('pageTitle') || 'page';
    const url = sessionStorage.getItem('pageUrl') || '';
    const jsonLdSnippets = JSON.parse(sessionStorage.getItem('jsonLdSnippets') || '[]');
    if (!sanitizedHtml) {
        iframe.srcdoc = "<p style='color:red'>Nothing to preview</p>";
        sendBtn.disabled = true;
        return;
    }

    const blob = new Blob([sanitizedHtml], { type: 'text/html;charset=utf-8' });
    iframe.src = URL.createObjectURL(blob);

    // Load endpoints and populate select
    const { endpoints, authToken, uploadMode } = await browser.storage.sync.get({
        endpoints: [],
        authToken: '',
        uploadMode: 'multipart'
    });

    if (!endpoints || endpoints.length === 0) {
        endpointSelect.innerHTML = '<option value="">No endpoints configured</option>';
        endpointSelect.disabled = true;
        sendBtn.disabled = true;
    } else {
        endpointSelect.innerHTML = '';
        endpoints.forEach((endpoint, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = endpoint.label || endpoint.url;
            endpointSelect.appendChild(option);
        });
        endpointSelect.disabled = false;
        sendBtn.disabled = false;
    }

    //Populate JSON-LD select if available
    if (jsonLdSnippets.length > 0) {
        jsonLdSelect.innerHTML = '';
        jsonLdSnippets.forEach((snippet, idx) => {
            try {
                const obj = JSON.parse(snippet);
                let label = 'Unknown';
                if (typeof obj['@type'] === 'string') label = obj['@type'];
                else if (Array.isArray(obj['@type'])) label = obj['@type'].join(', ');
                else if (obj['@context']) label = '(no @type)';
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = label;
                jsonLdSelect.appendChild(opt);
            } catch (err) {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = `Invalid JSON-LD #${idx}`;
                jsonLdSelect.appendChild(opt);
            }
        });
    } else {
        jsonLdCheckbox.disabled = true;
    }

    //toggle JSON-LD selection visibility
    jsonLdCheckbox.addEventListener('change', () => {
        const show = jsonLdCheckbox.checked;
        jsonLdContainer.style.display = show ? 'block' : 'none';
        if (!show) {
            jsonLdPreview.style.display = 'none';
            togglePreviewBtn.textContent = '🔍';
        }
    });
    jsonLdSelect.addEventListener('change', () => {
        const idx = parseInt(jsonLdSelect.value, 10);
        if (isNaN(idx)) return;
        try {
            const obj = JSON.parse(jsonLdSnippets[idx]);
            jsonLdPreview.textContent = JSON.stringify(obj, null, 2);
        } catch {
            jsonLdPreview.textContent = 'Invalid JSON';
        }
    });

    togglePreviewBtn.addEventListener('click', () => {
        if (jsonLdPreview.style.display === 'block') {
            jsonLdPreview.style.display = 'none';
            togglePreviewBtn.textContent = '🔍';
        } else {
            // if nothing is selected yet, load first
            if (jsonLdSelect.value === '') jsonLdSelect.selectedIndex = 0;
            const idx = parseInt(jsonLdSelect.value, 10);
            if (!isNaN(idx)) {
                try {
                    const obj = JSON.parse(jsonLdSnippets[idx]);
                    jsonLdPreview.textContent = JSON.stringify(obj, null, 2);
                } catch {
                    jsonLdPreview.textContent = 'Invalid JSON';
                }
            }
            jsonLdPreview.style.display = 'block';
            togglePreviewBtn.textContent = '❌';
        }
    });

    sendBtn.addEventListener('click', async () => {
        const selectedEndpointIdx = parseInt(endpointSelect.value, 10);

        if (isNaN(selectedEndpointIdx) || !endpoints[selectedEndpointIdx]) {
            alert('Please select a valid endpoint');
            return;
        }

        const selectedEndpoint = endpoints[selectedEndpointIdx];

        if (!selectedEndpoint.url) {
            alert('Selected endpoint has no URL configured');
            return;
        }

        sendBtn.disabled = true;
        sendBtn.textContent = 'Uploading...';

        // Use endpoint-specific token if available, otherwise use default
        const token = selectedEndpoint.token || authToken;
        const apiEndpoint = selectedEndpoint.url;

        const base64Html = htmlToBase64(sanitizedHtml);
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            let selectedJsonLd = null;
            if (jsonLdCheckbox.checked) {
                const idx = parseInt(jsonLdSelect.value, 10);
                selectedJsonLd = jsonLdSnippets[idx] || null;
            }

            if (uploadMode === 'multipart') {
                const form = new FormData();
                form.append('sanitizedHtml', base64Html);
                form.append('title', title);
                form.append('url', url);
                if (selectedJsonLd) form.append('jsonLd', selectedJsonLd);

                const resp = await fetch(apiEndpoint, { method:'POST', headers, body:form });
                if (!resp.ok) throw new Error(`${resp.status} ${await resp.text()}`);
            } else {
                const payload = { title, url, sanitizedHtml: base64Html };
                if (selectedJsonLd) payload.jsonLd = JSON.parse(selectedJsonLd);

                const resp = await fetch(apiEndpoint, {
                    method:'POST',
                    headers: Object.assign({ 'Content-Type':'application/json' }, headers),
                    body: JSON.stringify(payload)
                });
                if (!resp.ok) throw new Error(`${resp.status} ${await resp.text()}`);
            }

            sendBtn.textContent = 'Upload Successful!';
            setTimeout(() => {
                sessionStorage.removeItem('sanitizedHtml');
                sessionStorage.removeItem('pageTitle');
                sessionStorage.removeItem('pageUrl');
                sessionStorage.removeItem('jsonLdSnippets');

                window.close();
            }, 1500);
        } catch (err) {
            console.error(err);
            alert('Upload failed: ' + err.message);
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
        }
    });

        function htmlToBase64(sanitizedHtml) {
            const utf8Bytes = new TextEncoder().encode(sanitizedHtml);
            let binary = '';
            utf8Bytes.forEach(byte => binary += String.fromCharCode(byte));
            return btoa(binary);
        }
})();
