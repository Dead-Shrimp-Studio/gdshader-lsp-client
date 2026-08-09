import * as path from 'path';
import * as fs from 'fs';
import {
  workspace,
  ExtensionContext,
  window,
  LogOutputChannel,
  ConfigurationChangeEvent
} from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  Executable,
  ErrorAction,
  CloseAction,
  State
} from 'vscode-languageclient/node';

const CONFIG_SECTION = 'gdshaderLsp';
const DEFAULT_BINARY_SENTINEL = 'gdshader_lsp';
const CLIENT_ID = 'gdshaderLsp';
const CLIENT_NAME = 'GDShader Language Server';
const OUTPUT_CHANNEL_NAME = 'GDShader LSP';

let client: LanguageClient | undefined;
let outputChannel: LogOutputChannel | undefined;

/**
 * Resolve the bundled binary path for a given platform and architecture.
 * Returns `undefined` if no binary exists for this combination.
 */
export function resolveBinaryPath(
  platform: NodeJS.Platform,
  arch: string,
  extensionPath: string
): string | undefined {
  const binaryName = platform === 'win32' ? 'gdshader_lsp.exe' : 'gdshader_lsp';
  const targetDir = `${platform}-${arch}`;
  const binaryPath = path.join(extensionPath, 'bin', targetDir, binaryName);

  if (!fs.existsSync(binaryPath)) {
    return undefined;
  }

  // On Linux/macOS, ensure the binary has execute permissions after VSIX unpack.
  if (platform !== 'win32') {
    try {
      fs.chmodSync(binaryPath, 0o755);
    } catch (e) {
      console.error('Failed to set execute permissions on LSP binary:', e);
    }
  }

  return binaryPath;
}

/**
 * Returns true when the configured value means "use the bundled binary",
 * i.e. the value is empty or the default sentinel.
 */
export function isBundledDefault(command: string | undefined): boolean {
  return !command || command === DEFAULT_BINARY_SENTINEL;
}

/**
 * Build and start a LanguageClient for the given executable path.
 */
async function startClient(executablePath: string): Promise<void> {
  if (client) {
    await stopClient();
  }

  const run: Executable = {
    command: executablePath,
    args: ['--stdio']
  };

  const serverOptions: ServerOptions = {
    run,
    debug: run
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'gdshader' },
      { scheme: 'untitled', language: 'gdshader' }
    ],
    outputChannel,
    traceOutputChannel: outputChannel,
    errorHandler: {
      error: (error: Error) => {
        const message =
          error.message || 'Unknown error while running the GDShader language server.';
        outputChannel?.appendLine(`[error] ${message}`);
        window.showErrorMessage(`GDShader LSP: ${message}`);
        return { action: ErrorAction.Continue };
      },
      closed: () => {
        outputChannel?.appendLine('[exit] Language server connection was closed.');
        return { action: CloseAction.DoNotRestart };
      }
    }
  };

  const newClient = new LanguageClient(
    CLIENT_ID,
    CLIENT_NAME,
    serverOptions,
    clientOptions
  );

  newClient.onDidChangeState((event) => {
    if (event.newState === State.Stopped) {
      outputChannel?.appendLine('[exit] Language server stopped.');
    }
  });

  client = newClient;
  await newClient.start();
}

/**
 * Stop the currently running client, if any.
 */
async function stopClient(): Promise<void> {
  if (!client) {
    return;
  }
  const stopping = client;
  client = undefined;
  await stopping.stop();
}

/**
 * Resolve which executable to launch, logging the decision to the output
 * channel. Returns `undefined` when no usable binary could be found.
 */
function resolveExecutable(context: ExtensionContext): string | undefined {
  const configured = workspace
    .getConfiguration(CONFIG_SECTION)
    .get<string>('path');

  let executablePath = configured;

  if (isBundledDefault(configured)) {
    outputChannel?.appendLine(
      `Using bundled binary for ${process.platform}-${process.arch}.`
    );
    executablePath = resolveBinaryPath(
      process.platform,
      process.arch,
      context.extensionPath
    );

    if (!executablePath) {
      const message =
        `No bundled gdshader_lsp binary found for ` +
        `${process.platform}-${process.arch}. ` +
        `Set "${CONFIG_SECTION}.path" in settings to a custom binary.`;
      outputChannel?.appendLine(`[error] ${message}`);
      window.showErrorMessage(`GDShader LSP: ${message}`);
      return undefined;
    }
  } else {
    outputChannel?.appendLine(
      `Using configured binary at "${configured}".`
    );

    // Only validate via fs.existsSync if the path is explicitly an absolute path.
    // If it's a command name (e.g. "gdshader_lsp"), let Node/child_process resolve it via system PATH.
    if (path.isAbsolute(configured!) && !fs.existsSync(configured!)) {
      const message =
        `Configured binary "${configured}" does not exist. ` +
        `Please update "${CONFIG_SECTION}.path" in settings.`;
      outputChannel?.appendLine(`[error] ${message}`);
      window.showErrorMessage(`GDShader LSP: ${message}`);
      return undefined;
    }
  }

  outputChannel?.appendLine(`Launching language server: ${executablePath}`);
  return executablePath;
}

export async function activate(context: ExtensionContext): Promise<void> {
  outputChannel = window.createOutputChannel(OUTPUT_CHANNEL_NAME, { log: true });
  context.subscriptions.push(outputChannel);

  const startWithResolvedExecutable = async () => {
    const executablePath = resolveExecutable(context);
    if (!executablePath) {
      return;
    }
    try {
      await startClient(executablePath);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      outputChannel?.appendLine(`[error] Failed to start language server: ${message}`);
      window.showErrorMessage(`GDShader LSP: Failed to start language server: ${message}`);
    }
  };

  await startWithResolvedExecutable();

  // Restart the server when the configured binary path changes.
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
      if (event.affectsConfiguration(CONFIG_SECTION)) {
        outputChannel?.appendLine(
          '[config] gdshaderLsp configuration changed; restarting server.'
        );
        void startWithResolvedExecutable();
      }
    })
  );
}

export async function deactivate(): Promise<void> {
  await stopClient();
  outputChannel?.dispose();
  outputChannel = undefined;
}