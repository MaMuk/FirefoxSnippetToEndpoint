(async () => {
    const iframe = document.getElementById('preview');
    const sendBtn = document.getElementById('sendBtn');

    const sanitizedHtml = sessionStorage.getItem('sanitizedHtml');
    const title = sessionStorage.getItem('pageTitle') || 'page';
    const url = sessionStorage.getItem('pageUrl') || '';
    if (!sanitizedHtml) {
        iframe.srcdoc = "<p style='color:red'>Nothing to preview</p>";
        sendBtn.disabled = true;
        return;
    }

    const blob = new Blob([sanitizedHtml], { type: 'text/html;charset=utf-8' });
    iframe.src = URL.createObjectURL(blob);

    sendBtn.addEventListener('click', async () => {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Uploading...';

        const { apiEndpoint, authToken, uploadMode } = await browser.storage.sync.get({
            apiEndpoint: '',
            authToken: '',
            uploadMode: 'multipart'
        });

        if (!apiEndpoint) {
            alert('No endpoint configured');
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send to Endpoint';
            return;
        }

        const base64Html = htmlToBase64(sanitizedHtml);
        const headers = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            if (uploadMode === 'multipart') {
                const form = new FormData();
                form.append('sanitizedHtml', base64Html);
                form.append('title', title);
                form.append('url', url);

                const resp = await fetch(apiEndpoint, { method:'POST', headers, body:form });
                if (!resp.ok) throw new Error(`${resp.status} ${await resp.text()}`);
            } else {
                const payload = { title, url, sanitizedHtml: base64Html };
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

                window.close();
            }, 1500);
        } catch (err) {
            console.error(err);
            alert('Upload failed: ' + err.message);
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
        }
        function htmlToBase64(sanitizedHtml) {
            const utf8Bytes = new TextEncoder().encode(sanitizedHtml);
            let binary = '';
            utf8Bytes.forEach(byte => binary += String.fromCharCode(byte));
            return btoa(binary);
        }
    });
})();
