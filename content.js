browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'extractHtml') {
        try {
            let html;
            if (message.selectionOnly) {
                const selection = window.getSelection();
                html = selection.rangeCount > 0
                    ? new XMLSerializer().serializeToString(selection.getRangeAt(0).cloneContents())
                    : '';
            } else {
                html = document.documentElement.outerHTML;
            }

            //Extract and flatten all JSON-LD snippets
            const jsonLdSnippets = [];
            const addEntity = (entity) => {
                try {
                    jsonLdSnippets.push(JSON.stringify(entity));
                } catch (e) {
                    console.warn('Error stringifying JSON-LD entity:', e);
                }
            };

            document.querySelectorAll('script[type="application/ld+json"]').forEach((el, i) => {
                try {
                    let data = JSON.parse(el.textContent);
                    if (Array.isArray(data)) {
                        data.forEach(addEntity);
                    } else if (data['@graph']) {
                        data['@graph'].forEach(addEntity);
                    } else {
                        addEntity(data);
                    }
                } catch (err) {
                    console.warn(`Error parsing JSON-LD script #${i}`, err);
                }
            });

            return Promise.resolve({ html, jsonLdSnippets });
        } catch (err) {
            return Promise.resolve({ html: '', jsonLdSnippets: [], error: err.message });
        }
    }
});