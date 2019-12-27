'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const nodePlop = require('node-plop');
function isWorkspaceOpen() {
    if ((vscode.workspace) && (vscode.workspace.workspaceFolders) && (vscode.workspace.workspaceFolders.length > 0)) {
        return true;
    }
    return false;
}
function selectGenerator(plop, plopFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const generators = plop.getGeneratorList();
        // no generators, output error
        if (generators.length === 0) {
            vscode.window.showErrorMessage(`No Plop.js generators found in the config file "${plopFile}". Add one using plop.setGenerator(...)`);
            throw "No Plop.js generators found...";
        }
        // single generator, no need in prompting for selection
        if (generators.length === 1) {
            return generators[0];
        }
        // prompt user for which generator they want to use
        if (generators.length > 1) {
            return yield vscode.window.showQuickPick(generators.map((g) => ({ label: g.name, description: g.description })), {
                placeHolder: "Please choose a generator"
            });
        }
    });
}
function runPlopInNewTerminal(dirUri) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!dirUri && isWorkspaceOpen()) {
            vscode.window.showErrorMessage("Project items cannot be created if workspace is not open.");
            return;
        }
        // user based settings
        const userSettings = vscode.workspace.getConfiguration();
        const plopFileName = userSettings.get('plopTemplates.configFileName') || 'plopfile.js';
        const plopFileAbsolutePath = userSettings.get('plopTemplates.configFileAbsolutePath');
        const plopTerminalName = userSettings.get('plopTemplates.terminalName') || 'New File from Plop Template';
        const destinationpathName = userSettings.get('plopTemplates.destinationPath') || 'destinationpath';
        const plopCommand = (userSettings.get('plopTemplates.plopCommand') || 'plop').toLowerCase().trim();
        let plopCommandRelative = plopCommand;
        const plopFile = `${plopFileAbsolutePath ? plopFileAbsolutePath : vscode.workspace.rootPath}/${plopFileName}`;
        let plop;
        try {
            plop = nodePlop(plopFile);
        }
        catch (e) {
            vscode.window.showErrorMessage(`Couldn't load plop config file at the path: "${plopFile}" - ${e.message}`);
            return;
        }
        let destPath = "";
        let plopTerminal;
        let selectedGenerator = yield selectGenerator(plop, plopFile);
        if (selectedGenerator === undefined) {
            vscode.window.showInformationMessage("No Plop.js generator selected, cancelling...");
            return;
        }
        if (dirUri) {
            destPath = dirUri.fsPath;
        }
        else {
            vscode.window.showInformationMessage(`Couldn't find a target location "dirUri", the value of dirUri: "${dirUri}"`);
            return;
        }
        if (destPath !== "") {
            const fs = require('fs');
            let fsStat = fs.statSync(destPath);
            if (!fsStat.isDirectory()) {
                destPath = path.dirname(destPath);
            }
        }
        else {
            vscode.window.showInformationMessage(`Couldn't find a target location "destPath", the value of destPath: "${destPath}"`);
            return;
        }
        const existingTerminals = vscode.window.terminals.filter((value) => value.name === plopTerminalName);
        if (existingTerminals.length > 0) {
            // use existing terminal
            plopTerminal = existingTerminals[0];
        }
        else {
            // create new terminal
            plopTerminal = vscode.window.createTerminal({
                name: plopTerminalName
            });
        }
        if (plopCommand !== "plop") {
            plopCommandRelative = "npm run " + plopCommand;
        }
        plopTerminal.show();
        plopTerminal.sendText(`${plopCommandRelative} '${selectedGenerator.name ? selectedGenerator.name : selectedGenerator.label}' --${destinationpathName} '${destPath}' --plopfile '${plopFile}'`);
    });
}
function activate(context) {
    let disposable = vscode.commands.registerCommand('ploptemplates.newFile', (dirUri) => {
        runPlopInNewTerminal(dirUri);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map