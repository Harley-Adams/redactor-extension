document.addEventListener('DOMContentLoaded', () => {
    const guidCheckbox = document.getElementById('enableGuidRedaction');
    const stringListTextarea = document.getElementById('redactList');
    const applyButton = document.getElementById('applyRedaction');

    // Load saved settings
    chrome.storage.sync.get(['enableGuid', 'redactStrings'], (result) => {
        guidCheckbox.checked = !!result.enableGuid;
        stringListTextarea.value = (result.redactStrings || []).join('\n');
    });

    // Save settings when changed
    guidCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ enableGuid: guidCheckbox.checked });
    });

    stringListTextarea.addEventListener('input', () => {
        const strings = stringListTextarea.value.split('\n').map(s => s.trim()).filter(s => s);
        chrome.storage.sync.set({ redactStrings: strings });
    });

    // Apply button logic
    applyButton.addEventListener('click', async () => {
        const enableGuid = guidCheckbox.checked;
        const stringsToRedact = stringListTextarea.value.split('\n').map(s => s.trim()).filter(s => s);

        // Get the current active tab
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab?.id && (tab.url?.startsWith('http') || tab.url?.startsWith('https'))) {
            // Send settings to the content script
            try {
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: "applyRedaction",
                    settings: {
                        enableGuid: enableGuid,
                        stringsToRedact: stringsToRedact
                    }
                });
                // Optionally close the popup after applying
                // window.close();
            } catch (error) {
                // Attempt to inject the script if it's not there
                if (error.message.includes("Receiving end does not exist")) {
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ["content.js"]
                        });
                        // Try sending the message again after injection
                        const response = await chrome.tabs.sendMessage(tab.id, {
                            action: "applyRedaction",
                            settings: {
                                enableGuid: enableGuid,
                                stringsToRedact: stringsToRedact
                            }
                        });
                        // window.close();
                    } catch (injectionError) {
                        alert("Failed to apply redaction. Please reload the page and try again.");
                    }
                } else {
                     alert("Failed to apply redaction. Error: " + error.message);
                }
            }
        } else {
            alert("Cannot apply redaction to the current tab.");
        }
    });
});
