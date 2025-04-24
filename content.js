console.log("Redactor content script loaded, waiting for instructions...");

// Ensure the script doesn't try to run itself multiple times if injected again
if (!window.redactorListenerAdded) {
    window.redactorListenerAdded = true;

    const guidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
    const redactionCache = new Map();
    let currentSettings = { enableGuid: false, stringsToRedact: [] };
    let guidCounter = 0; // Counter to increment the last digit of the GUID

    function generateNewGuid(originalGuid) {
        if (redactionCache.has(originalGuid)) {
            return redactionCache.get(originalGuid);
        }
        // Increment the counter for each new unique GUID
        guidCounter++;
        // Create a GUID with all zeros and increment the last 12 digits safely
        const suffix = guidCounter.toString().padStart(12, '0');
        const newGuid = `00000000-0000-0000-0000-${suffix}`;
        redactionCache.set(originalGuid, newGuid);
        return newGuid;
    }

    function redactTextNode(node) {
        let value = node.nodeValue;
        let changed = false;

        // Replace user-defined strings
        if (currentSettings.stringsToRedact && currentSettings.stringsToRedact.length > 0) {
            currentSettings.stringsToRedact.forEach(strToRedact => {
                if (value.includes(strToRedact)) {
                    // Check if the string is already in the cache
                    if (!redactionCache.has(strToRedact)) {
                        redactionCache.set(strToRedact, `[REDACTED:${strToRedact.length}]`);
                    }
                    const replacement = redactionCache.get(strToRedact);
                    value = value.replaceAll(strToRedact, replacement);
                    changed = true;
                }
            });
        }

        // Replace GUIDs if enabled
        if (currentSettings.enableGuid) {
            const guids = value.match(guidRegex);
            if (guids) {
                guids.forEach(guid => {
                    const newGuid = generateNewGuid(guid);
                    value = value.replaceAll(guid, newGuid);
                    changed = true;
                });
            }
        }

        // Performance optimization: Only update the node if it has changed.
        if (changed) {
            node.nodeValue = value;
        }
    }

    function walkTheDOM(rootNode) {
        const walker = document.createTreeWalker(
            rootNode,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    const parent = node.parentElement;
                    // Skip certain elements, we don't want to mess with page functionality, css or user input.
                    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.isContentEditable)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (node.nodeValue.trim() === '') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        let node;
        while(node = walker.nextNode()) {
            redactTextNode(node);
        }
    }

    function initializeRedaction() {
        console.log("Applying redaction with settings:", currentSettings);
        redactionCache.clear(); // Clear redaction cache for each run

        // Perform a single walk of the DOM
        walkTheDOM(document.body);

        console.log("Redaction applied.");
    }

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("Message received in content script:", request);
        if (request.action === "applyRedaction") {
            currentSettings = request.settings;
            initializeRedaction();
            sendResponse({ status: "Redaction applied", settings: currentSettings });
        } else {
            sendResponse({ status: "Unknown action" });
        }
        // Keep the message channel open for the response
        return true;
    });

}
