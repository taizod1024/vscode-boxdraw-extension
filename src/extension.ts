import * as vscode from 'vscode';
import { boxdraw } from './Boxdraw';

// extension entrypoint
export function activate(context: vscode.ExtensionContext) {
    boxdraw.activate(context);
}
export function deactivate() { }
