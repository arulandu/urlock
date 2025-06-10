# URLock - URL Pattern Redirector Chrome Extension

URLock is a Chrome extension that allows you to define URL patterns and their corresponding redirect URLs. When you visit a URL that matches any of your defined patterns, you will be automatically redirected to the specified destination URL.

## Features

- Add, edit, and delete URL patterns
- Enable/disable individual patterns
- Support for wildcard patterns (e.g., `*.example.com/*`, `example.com/*`, `*.example.com`)
- Export/Import patterns to/from JSON files
- Clean and intuitive user interface
- Automatic redirection based on pattern matching

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the URLock icon in your Chrome toolbar to open the popup
2. Click "Add Pattern" to create a new URL pattern
3. Enter the URL pattern and the redirect URL
4. Enable/disable patterns as needed
5. Use the Export/Import buttons to backup or restore your patterns

## URL Pattern Format

URL patterns support the following wildcards:
- `*` matches any number of characters
- `?` matches any single character

Examples:
- `*.example.com/*` - Matches any subdomain of example.com with any path
- `example.com/*` - Matches example.com with any path
- `*.example.com` - Matches any subdomain of example.com
- `example.com/page?` - Matches example.com/page followed by any single character

## Development

### Project Structure

- `manifest.json` - Extension configuration
- `popup.html` - User interface
- `popup.js` - UI logic and pattern management
- `background.js` - URL pattern matching and redirection
- `styles.css` - UI styling

### Building from Source

1. Clone the repository
2. Make your changes
3. Load the extension in Chrome using Developer mode

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 