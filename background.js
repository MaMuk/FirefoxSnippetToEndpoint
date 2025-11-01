browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === 'capturePage') {
        try {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (!tab) throw new Error('No active tab found');

            const response = await sendMessageToTab(tab.id, {
                type: 'extractHtml',
                selectionOnly: message.selectionOnly
            });

            const sanitizedHtml = DOMPurify.sanitize(response.html);
            const jsonLdSnippets = response.jsonLdSnippets || [];

            return { success: true, sanitizedHtml, jsonLdSnippets };
        } catch (error) {
            console.error('Error in capturePage:', error);
            return { success: false, error: error.message };
        }
    }
});
async function sendMessageToTab(tabId, message) {
    try {
        return await browser.tabs.sendMessage(tabId, message);
    } catch (err) {
        // If content script isn't ready, inject it and retry once
        if (err.message.includes('Receiving end does not exist')) {
            try {
                await browser.scripting.executeScript({
                    target: { tabId },
                    files: ['content.js']
                });
                return await browser.tabs.sendMessage(tabId, message);
            } catch (injectErr) {
                console.error('Failed to inject content script:', injectErr);
                throw injectErr;
            }
        } else {
            throw err;
        }
    }
}
