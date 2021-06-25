import * as vscode from 'vscode';
import { boxdrawextension } from './BoxdrawExtension';

// extension entrypoint
export function activate(context: vscode.ExtensionContext) {
    boxdrawextension.activate(context);
}
export function deactivate() { }
