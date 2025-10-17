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

            return Promise.resolve({ html });
        } catch (err) {
            return Promise.resolve({ html: '', error: err.message });
        }
    }
});