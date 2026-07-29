# GDShader Language Server Client

A Visual Studio Code extension that provides rich Language Server Protocol (LSP) support for Godot Engine's **GDShader** (`.gdshader`) files. 

This extension integrates the [`gdshader-lsp`](https://github.com/your-repo/gdshader-lsp) (v2.5.1) binary directly into VS Code, giving you features like autocompletion, diagnostics, hover information, and syntax analysis for GDShader scripts.

---

## Features

- **Automatic Binary Management:** Comes pre-bundled with compiled language server binaries for Linux, macOS, and Windows. It automatically detects your operating system and CPU architecture at runtime.
- **LSP Integration:** Connects your `.gdshader` files to `gdshader-lsp` using standard JSON-RPC over stdio.
- **Custom Executable Support:** Allows you to override the bundled binary and specify a custom file path to your own local build of `gdshader-lsp`.

---

## Supported Platforms

The extension includes bundled binaries for the following targets:

- **Linux:** `x64`
- **macOS:** `x64` and `arm64` (Apple Silicon)
- **Windows:** `x64`

---

## Extension Settings

This extension contributes the following setting to your VS Code configuration:

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `gdshaderLsp.path` | `string` | `""` *(uses bundled binary)* | Absolute path to a custom `gdshader-lsp` executable. Leave empty or set to `"gdshader-lsp"` to use the bundled version. |

### Example Configuration (`settings.json`)

If you want to use a custom binary instead of the bundled one, add this to your VS Code `settings.json`:

```json
{
  "gdshaderLsp.path": "/usr/local/bin/gdshader-lsp"
}