# VS Code Setup for Auto-Formatting

This project is configured to auto-format files on save.

## Required Extensions

Install these VS Code extensions for the best experience:

1. **Prettier** - `esbenp.prettier-vscode` (Required)
   - Auto-formats JS/TS/CSS/JSON/YAML files
2. **ESLint** - `dbaeumer.vscode-eslint` (Required)
   - Lints and auto-fixes JavaScript/TypeScript
3. **Ruby Rubocop** - `misogi.ruby-rubocop` (Required for backend)
   - Formats and lints Ruby files
4. **Tailwind CSS IntelliSense** - `bradlc.vscode-tailwindcss` (Recommended)
   - Autocomplete for Tailwind classes
5. **Jest** - `Orta.vscode-jest` (Recommended)
   - Run tests in the editor

## Installation

When you open this project in VS Code, you should see a prompt to install recommended extensions. Click "Install All" or:

1. Press `Cmd+Shift+X` (macOS) or `Ctrl+Shift+X` (Windows/Linux)
2. Search for the extension name
3. Click "Install"

## What Happens on Save?

### Frontend Files (.ts, .tsx, .js, .jsx, .css, .json)

1. **Prettier** formats the file
2. **ESLint** auto-fixes issues (like unused imports)

### Backend Files (.rb)

1. **RuboCop** formats and fixes Ruby style issues

### Config Files (.json, .yml, .yaml, .md)

1. **Prettier** formats the file

## Manual Formatting

If auto-format doesn't work:

### Format Current File

- macOS: `Shift+Option+F`
- Windows/Linux: `Shift+Alt+F`

### Format Selection

- macOS: `Cmd+K Cmd+F`
- Windows/Linux: `Ctrl+K Ctrl+F`

## Troubleshooting

### "Prettier not formatting on save"

1. Check that Prettier extension is installed
2. Open Command Palette (`Cmd+Shift+P`)
3. Run "Preferences: Open User Settings"
4. Ensure "Format On Save" is enabled

### "ESLint not working"

1. Make sure you're in the `raincoat_frontend` directory when editing frontend files
2. Check ESLint output: View → Output → Select "ESLint" from dropdown

### "RuboCop not working"

1. Make sure Ruby extension is installed
2. Check that RuboCop is in your Gemfile
3. Run `bundle install` in `raincoat_api/`

## Disabling Auto-Format (Not Recommended)

If you need to disable auto-format temporarily:

1. Open Command Palette (`Cmd+Shift+P`)
2. Search for "Preferences: Open Workspace Settings"
3. Set `"editor.formatOnSave": false`

Or create `.vscode/settings.json` with:

```json
{
  "editor.formatOnSave": false
}
```
