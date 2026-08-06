import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import {
  resolveBinaryPath,
  isBundledDefault
} from '../extension';

const EXTENSION_ROOT = path.join(__dirname, '..', '..');

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  suite('resolveBinaryPath', () => {
    test('resolves linux-x64 binary', () => {
      const resolved = resolveBinaryPath('linux', 'x64', EXTENSION_ROOT);
      assert.ok(resolved, 'expected a resolved path');
      assert.ok(
        resolved!.endsWith(path.join('bin', 'linux-x64', 'gdshader_lsp')),
        `unexpected path: ${resolved}`
      );
      assert.ok(fs.existsSync(resolved!), 'resolved binary should exist');
    });

    test('resolves darwin-x64 binary', () => {
      const resolved = resolveBinaryPath('darwin', 'x64', EXTENSION_ROOT);
      assert.ok(resolved, 'expected a resolved path');
      assert.ok(
        resolved!.endsWith(path.join('bin', 'darwin-x64', 'gdshader_lsp')),
        `unexpected path: ${resolved}`
      );
      assert.ok(fs.existsSync(resolved!), 'resolved binary should exist');
    });

    test('resolves darwin-arm64 binary', () => {
      const resolved = resolveBinaryPath('darwin', 'arm64', EXTENSION_ROOT);
      assert.ok(resolved, 'expected a resolved path');
      assert.ok(
        resolved!.endsWith(path.join('bin', 'darwin-arm64', 'gdshader_lsp')),
        `unexpected path: ${resolved}`
      );
      assert.ok(fs.existsSync(resolved!), 'resolved binary should exist');
    });

    test('resolves win32-x64 binary with .exe extension', () => {
      const resolved = resolveBinaryPath('win32', 'x64', EXTENSION_ROOT);
      assert.ok(resolved, 'expected a resolved path');
      assert.ok(
        resolved!.endsWith(path.join('bin', 'win32-x64', 'gdshader_lsp.exe')),
        `unexpected path: ${resolved}`
      );
      assert.ok(fs.existsSync(resolved!), 'resolved binary should exist');
    });

    test('returns undefined for unsupported platform', () => {
      const resolved = resolveBinaryPath('freebsd', 'x64', EXTENSION_ROOT);
      assert.strictEqual(resolved, undefined);
    });

    test('returns undefined for unsupported architecture', () => {
      const resolved = resolveBinaryPath('linux', 'ia32', EXTENSION_ROOT);
      assert.strictEqual(resolved, undefined);
    });
  });

  suite('isBundledDefault', () => {
    test('returns true for undefined', () => {
      assert.strictEqual(isBundledDefault(undefined), true);
    });

    test('returns true for empty string', () => {
      assert.strictEqual(isBundledDefault(''), true);
    });

    test('returns true for the default sentinel', () => {
      assert.strictEqual(isBundledDefault('gdshader_lsp'), true);
    });

    test('returns false for a custom path', () => {
      assert.strictEqual(isBundledDefault('/usr/local/bin/gdshader-lsp'), false);
    });
  });
});