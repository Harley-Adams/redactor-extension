# Redactor Extension

Redactor is a Chrome extension designed to redact specified text and GUIDs on web pages. It provides a simple popup interface to configure redaction settings and apply them to the current page.

## Features

- **Replace GUIDs**: Automatically replaces GUIDs with generated placeholders.
- **Custom String Redaction**: Redact user-defined strings from web pages.
- **Persistent Settings**: Saves your redaction preferences for future use.

## Installation

1. Clone this repository or download the source code.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top-right corner.
4. Click "Load unpacked" and select the folder containing this extension.

## Usage

1. Click on the Redactor extension icon in the Chrome toolbar.
2. Use the popup interface to:
   - Enable or disable GUID redaction.
   - Add strings to redact (one per line).
3. Click "Apply to Current Page" to apply the redaction settings to the active tab.

## Files

- **manifest.json**: Defines the extension's metadata and permissions.
- **popup.html**: The HTML file for the extension's popup interface.
- **popup.js**: Handles the logic for the popup interface.
- **content.js**: Contains the content script that performs redaction on web pages.
- **icons/**: Contains the extension's icons in various sizes.

## Development

To modify or enhance the extension:

1. Make changes to the source files.
2. Reload the extension in Chrome by navigating to `chrome://extensions/`, disabling, and re-enabling the extension.
