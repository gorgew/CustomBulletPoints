"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
var IndentMode;
(function (IndentMode) {
    IndentMode["random"] = "random";
    IndentMode["tier"] = "tier";
    IndentMode["cycle"] = "cycle";
})(IndentMode || (IndentMode = {}));
let currentIndentMode;
let isActive = true;
let bulletString = '\u2022';
let bulletLength = 1;
let bulletLists;
let activeBulletList;
let justTabbed = false;
let cycleIndex = 0;
function activate(context) {
    var _a;
    currentIndentMode = (_a = vscode.workspace.getConfiguration().get("customBulletPoints.BulletPointMode")) !== null && _a !== void 0 ? _a : IndentMode.random;
    reloadBulletLists();
    activeBulletList = bulletLists[0].bulletStringArray;
    const editor = vscode.window.activeTextEditor;
    function reloadBulletLists() {
        var _a;
        bulletLists = (_a = vscode.workspace.getConfiguration().get("customBulletPoints.BulletPointSets")) !== null && _a !== void 0 ? _a : [{ label: "a", stringSize: 1, bulletStringArray: [""], detail: "" }];
        bulletLists = bulletLists.map(bulletList => {
            return {
                label: bulletList.label,
                stringSize: bulletList.stringSize,
                bulletStringArray: bulletList.bulletStringArray,
                detail: bulletList.bulletStringArray.join(' ')
            };
        });
    }
    function reloadBulletListsQP() {
        reloadBulletLists();
        bulletQuickPick();
    }
    function bulletQuickPick() {
        vscode.window.showQuickPick(bulletLists).then(bulletList => {
            var _a, _b;
            activeBulletList = (_a = bulletList === null || bulletList === void 0 ? void 0 : bulletList.bulletStringArray) !== null && _a !== void 0 ? _a : [];
            bulletLength = (_b = bulletList === null || bulletList === void 0 ? void 0 : bulletList.stringSize) !== null && _b !== void 0 ? _b : 1;
        });
    }
    //Returns -1 if using tabs, >= 1 when using spaces
    function getIndentSize() {
        var _a, _b;
        let size = 0;
        let isUsingSpaces = (_a = vscode.workspace.getConfiguration().get("editor.insertSpaces")) !== null && _a !== void 0 ? _a : false;
        if (isUsingSpaces) {
            size = (_b = vscode.workspace.getConfiguration().get("editor.tabSize")) !== null && _b !== void 0 ? _b : 4;
        }
        else {
            size = -1;
        }
        return size;
    }
    function getIndentLevel() {
        let indentCount = 0;
        if (editor) {
            let indentString = getIndentString();
            let indentSize = getIndentSize();
            //If using tabs, convert to actual tab size
            if (indentSize === -1) {
                indentSize = 1;
            }
            const activePos = editor.selection.active;
            for (let i = 0; i <= activePos.character; i += indentSize) {
                const character = editor.document.getText(new vscode.Range(new vscode.Position(activePos.line, i), new vscode.Position(activePos.line, i + indentSize)));
                if (character === indentString) {
                    indentCount++;
                }
            }
        }
        return indentCount;
    }
    function getIndentString() {
        let indentSize = getIndentSize();
        let indentStr = "";
        if (indentSize < 0) {
            indentStr += "\t";
        }
        else {
            for (let i = 0; i < indentSize; i++) {
                indentStr += " ";
            }
        }
        return indentStr;
    }
    function nextBulletStr() {
        let bulletStr = "";
        if (editor) {
            const activePos = editor.selection.active;
            if (currentIndentMode === IndentMode.random) {
                const randomIndex = Math.floor(Math.random() * activeBulletList.length);
                bulletStr = activeBulletList[randomIndex];
            }
            else if (currentIndentMode === IndentMode.cycle) {
                bulletStr = activeBulletList[cycleIndex % activeBulletList.length];
                cycleIndex++;
            }
            else if (currentIndentMode === IndentMode.tier) {
                bulletStr = activeBulletList[(getIndentLevel() % activeBulletList.length) - 1];
            }
        }
        bulletLength = bulletStr.length;
        return bulletStr + " ";
    }
    const activateCommand = () => {
        vscode.commands.executeCommand("setContext", "customBulletPoints:active", true);
        justTabbed = false;
        if (isActive) {
            vscode.window.showInformationMessage('customBulletPoints: Already Active');
        }
        else {
            isActive = true;
            vscode.window.showInformationMessage('customBulletPoints: Ready');
        }
    };
    const deactivateCommand = () => {
        vscode.commands.executeCommand("setContext", "customBulletPoints:active", false);
        isActive = false;
        justTabbed = false;
    };
    function doOnTabDown() {
        if (isActive && editor) {
            const activePos = editor.selection.active;
            if (justTabbed) {
                const indentPos = activePos.with(activePos.line, 0);
                editor.edit(edit => {
                    edit.insert(indentPos, getIndentString());
                });
            }
            else {
                const bulletPos = activePos.with(activePos.line + 1, activePos.character + 1);
                editor.edit(edit => {
                    edit.insert(bulletPos, getIndentString() + nextBulletStr());
                });
                justTabbed = true;
            }
        }
        else if (!isActive) {
            activateCommand();
            doOnTabDown();
        }
    }
    function doOnEnterDown() {
        if (isActive && editor && justTabbed) {
            let newLineIndent = "";
            let currentIndentLevel = getIndentLevel();
            let currentIndentString = getIndentString();
            for (let i = 0; i < currentIndentLevel; i++) {
                newLineIndent += currentIndentString;
            }
            const activePos = editor.selection.active;
            const bulletPos = activePos.with(activePos.line, activePos.character + 1);
            editor.edit(edit => {
                edit.insert(bulletPos, "\n" + newLineIndent + nextBulletStr());
            });
        }
    }
    function doOnBackspaceDown() {
        if (isActive && editor && justTabbed) {
            const activePos = editor.selection.active;
            let startPos;
            let endPos;
            let currentIndentLevel = getIndentLevel();
            let indentSize = getIndentSize();
            if (activePos.character <= (currentIndentLevel * indentSize + bulletLength + 1)) {
                startPos = activePos.with(activePos.line, 0);
                if (currentIndentLevel === 1) {
                    endPos = activePos.with(activePos.line, indentSize + bulletLength + 1);
                    deactivateCommand();
                }
                else if (currentIndentLevel >= 0) {
                    //If indenting with Tabs
                    if (indentSize === -1) {
                        endPos = activePos.with(activePos.line, 1);
                        //Else indenting with spaces
                    }
                    else {
                        endPos = activePos.with(activePos.line, indentSize);
                    }
                }
                else {
                    deactivateCommand();
                }
            }
            else {
                startPos = activePos.with(activePos.line, activePos.character - 1);
                endPos = activePos.with(activePos.line, activePos.character);
            }
            editor.edit(edit => {
                edit.delete(new vscode.Range(startPos, endPos));
            });
        }
        else if (!isActive && editor) {
            const activePos = editor.selection.active;
            editor.edit(edit => {
                edit.insert(activePos, '\b');
            });
        }
    }
    vscode.commands.executeCommand("setContext", "customBulletPoints:active", true);
    context.subscriptions.push(vscode.commands.registerCommand('customBulletPoints.activate', activateCommand), vscode.commands.registerCommand('customBulletPoints.deactivate', deactivateCommand), vscode.commands.registerCommand('customBulletPoints.chooseBulletPointSet', bulletQuickPick), vscode.commands.registerCommand('customBulletPoints.reloadBulletPointSet', reloadBulletListsQP), vscode.commands.registerCommand('customBulletPoints.doOnTabDown', doOnTabDown), vscode.commands.registerCommand('customBulletPoints.doOnEnterDown', doOnEnterDown), vscode.commands.registerCommand('customBulletPoints.doOnBackspaceDown', doOnBackspaceDown));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map