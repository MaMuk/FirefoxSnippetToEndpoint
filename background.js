browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === 'capturePage') {
        try {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

            if (!tab) throw new Error("No active tab found");

            const response = await browser.tabs.sendMessage(tab.id, {
                type: 'extractHtml',
                selectionOnly: message.selectionOnly
            });

            const sanitizedHtml = DOMPurify.sanitize(response.html);

            return { success: true, sanitizedHtml };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
});