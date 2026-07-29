import * as path from 'path';
import * as fs from 'fs';
import { workspace, ExtensionContext, window } from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  Executable
} from 'vscode-languageclient/node';

let client: LanguageClient;

function getBundledBinaryPath(context: ExtensionContext): string | undefined {
  const platform = process.platform; // 'linux', 'darwin', or 'win32'
  const arch = process.arch;         // 'x64' or 'arm64'
  
  const binaryName = platform === 'win32' ? 'gdshader_lsp.exe' : 'gdshader_lsp';
  const targetDir = `${platform}-${arch}`;
  
  // Resolve absolute path inside the extension's folder
  const binaryPath = context.asAbsolutePath(
    path.join('bin', targetDir, binaryName)
  );

  if (!fs.existsSync(binaryPath)) {
    return undefined;
  }

  // On Linux/macOS, ensure the binary has execute permissions after VSIX unpack
  if (platform !== 'win32') {
    try {
      fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
      console.error('Failed to set execute permissions on LSP binary:', e);
    }
  }

  return binaryPath;
}

export function activate(context: ExtensionContext) {
  // 1. Check if user configured a custom path in VS Code settings
  let command = workspace.getConfiguration('gdshaderLsp').get<string>('path');

  // 2. If no custom path is set, use the bundled binary for this OS/arch
  if (!command || command === 'gdshader_lsp') {
    command = getBundledBinaryPath(context);
  }

  // 3. If still not found, show an error and abort
  if (!command) {
    window.showErrorMessage(
      `GDShader LSP: No compatible binary found for ${process.platform}-${process.arch}. Please configure "gdshaderLsp.path" in settings.`
    );
    return;
  }

  const run: Executable = {
    command,
    args: ["--stdio"]
  };

  const serverOptions: ServerOptions = {
    run,
    debug: run
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'gdshader' }]
  };

  client = new LanguageClient(
    'gdshaderLsp',
    'GDShader Language Server',
    serverOptions,
    clientOptions
  );

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}