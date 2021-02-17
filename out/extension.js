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
let activityStatusBarItem;
let bulletString;
let bulletLength;
let bulletCollections;
let activeBulletCollection;
let justTabbed = false;
let cycleIndex = 0;
function activate(context) {
    var _a;
    activityStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
    activityStatusBarItem.command = "customBulletPoints.activityQuickPick";
    activateCommand();
    currentIndentMode = (_a = vscode.workspace.getConfiguration().get("customBulletPoints.BulletPointMode")) !== null && _a !== void 0 ? _a : IndentMode.random;
    reloadBulletCollections();
    activeBulletCollection = bulletCollections[0].bulletStringArray;
    vscode.commands.executeCommand("setContext", "customBulletPoints:active", true);
    context.subscriptions.push(vscode.commands.registerCommand('customBulletPoints.activate', activateCommand), vscode.commands.registerCommand('customBulletPoints.deactivate', deactivateCommand), vscode.commands.registerCommand('customBulletPoints.activityQuickPick', activityQuickPick), vscode.commands.registerCommand('customBulletPoints.chooseBulletPointCollections', bulletQuickPick), vscode.commands.registerCommand('customBulletPoints.reloadBulletPointCollections', reloadBulletCollectionsQP), vscode.commands.registerCommand('customBulletPoints.doOnTabDown', doOnTabDown), vscode.commands.registerCommand('customBulletPoints.doOnEnterDown', doOnEnterDown), vscode.commands.registerCommand('customBulletPoints.doOnBackspaceDown', doOnBackspaceDown));
}
exports.activate = activate;
const activateCommand = () => {
    vscode.commands.executeCommand("setContext", "customBulletPoints:active", true);
    justTabbed = false;
    isActive = true;
    activityStatusBarItem.text = "Bulleting: On";
    activityStatusBarItem.show();
};
const deactivateCommand = () => {
    vscode.commands.executeCommand("setContext", "customBulletPoints:active", false);
    activityStatusBarItem.text = "Bulleting: Off";
    activityStatusBarItem.show();
    isActive = false;
    justTabbed = false;
};
function activityQuickPick() {
    let optionCollection = ["Custom Bullet Points: Activate",
        "Custom Bullet Points: Deactivate"];
    vscode.window.showQuickPick(optionCollection).then(choice => {
        if (choice === optionCollection[0]) {
            activateCommand();
        }
        else if (choice === optionCollection[1]) {
            deactivateCommand();
        }
    });
}
function reloadBulletCollections() {
    var _a;
    bulletCollections = (_a = vscode.workspace.getConfiguration().get("customBulletPoints.BulletPointCollectionss")) !== null && _a !== void 0 ? _a : [{ label: "a", stringSize: 1, bulletStringArray: [""], detail: "" }];
    bulletCollections = bulletCollections.map(bulletCollection => {
        return {
            label: bulletCollection.label,
            stringSize: bulletCollection.stringSize,
            bulletStringArray: bulletCollection.bulletStringArray,
            detail: bulletCollection.bulletStringArray.join(' ')
        };
    });
}
function reloadBulletCollectionsQP() {
    reloadBulletCollections();
    bulletQuickPick();
}
function bulletQuickPick() {
    vscode.window.showQuickPick(bulletCollections).then(bulletCollection => {
        var _a, _b;
        activeBulletCollection = (_a = bulletCollection === null || bulletCollection === void 0 ? void 0 : bulletCollection.bulletStringArray) !== null && _a !== void 0 ? _a : [];
        bulletLength = (_b = bulletCollection === null || bulletCollection === void 0 ? void 0 : bulletCollection.stringSize) !== null && _b !== void 0 ? _b : 1;
    });
}
//Returns -1 if using tabs, >= 1 when using spaces
function getIndentSize() {
    var _a, _b;
    let editor = vscode.window.activeTextEditor;
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
    let editor = vscode.window.activeTextEditor;
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
    let editor = vscode.window.activeTextEditor;
    let bulletStr = "";
    if (editor) {
        const activePos = editor.selection.active;
        if (currentIndentMode === IndentMode.random) {
            const randomIndex = Math.floor(Math.random() * activeBulletCollection.length);
            bulletStr = activeBulletCollection[randomIndex];
        }
        else if (currentIndentMode === IndentMode.cycle) {
            bulletStr = activeBulletCollection[cycleIndex % activeBulletCollection.length];
            cycleIndex++;
        }
        else if (currentIndentMode === IndentMode.tier) {
            bulletStr = tierNextBulletStr(getIndentLevel());
        }
    }
    bulletLength = bulletStr.length;
    return bulletStr;
}
function tierNextBulletStr(indentLevel) {
    let bulletStr = "";
    bulletStr = activeBulletCollection[(indentLevel % activeBulletCollection.length)];
    return bulletStr;
}
function doOnTabDown() {
    let editor = vscode.window.activeTextEditor;
    if (isActive && editor) {
        const activePos = editor.selection.active;
        let startPos;
        let endPos;
        let replaceStr = "";
        if (justTabbed) {
            if (currentIndentMode === IndentMode.tier) {
                startPos = activePos.with(activePos.line, getIndentLevel() * Math.abs(getIndentSize()));
                endPos = activePos.with(activePos.line, getIndentLevel() * Math.abs(getIndentSize()) + bulletLength);
                replaceStr = getIndentString() + nextBulletStr();
                editor.edit(edit => {
                    edit.replace(new vscode.Range(startPos, endPos), replaceStr);
                }).then(success => {
                    /*
                    let endPos = editor!.selection.end;
                    editor!.selection = new vscode.Selection(endPos, endPos);
                    */
                });
            }
            else {
                const indentPos = activePos.with(activePos.line, 0);
                editor.edit(edit => {
                    edit.insert(indentPos, getIndentString());
                });
            }
        }
        else {
            startPos = activePos.with(activePos.line, activePos.character + 1);
            editor.edit(edit => {
                edit.insert(startPos, getIndentString() + nextBulletStr() + " ");
            });
            justTabbed = true;
        }
    }
    else if (!isActive) {
        //If tabbing when not active and at the beginning of the document
        if ((editor === null || editor === void 0 ? void 0 : editor.selection.active.character) === 0) {
            activateCommand();
            doOnTabDown();
        }
    }
}
function doOnEnterDown() {
    let editor = vscode.window.activeTextEditor;
    if (isActive && editor && justTabbed) {
        let insertStr = "\n";
        let currentIndentLevel = getIndentLevel();
        let currentIndentStr = getIndentString();
        for (let i = 0; i < currentIndentLevel; i++) {
            insertStr += currentIndentStr;
        }
        const activePos = editor.selection.active;
        const bulletPos = activePos.with(activePos.line, activePos.character + 1);
        if (currentIndentMode = IndentMode.tier) {
            insertStr += tierNextBulletStr(currentIndentLevel - 1) + " ";
        }
        else {
            insertStr += nextBulletStr() + " ";
        }
        editor.edit(edit => {
            edit.insert(bulletPos, insertStr);
        });
    }
}
function doOnBackspaceDown() {
    let editor = vscode.window.activeTextEditor;
    if (isActive && editor && justTabbed) {
        const activePos = editor.selection.active;
        let startPos;
        let endPos;
        let currentIndentLevel = getIndentLevel();
        let indentSize = getIndentSize();
        let replaceStr = "";
        if (activePos.character <= (currentIndentLevel * indentSize + bulletLength + 1)) {
            startPos = activePos.with(activePos.line, 0);
            if (currentIndentLevel === 1) {
                endPos = activePos.with(activePos.line, indentSize + bulletLength + 1);
                deactivateCommand();
            }
            else if (currentIndentLevel >= 0) {
                if (currentIndentMode = IndentMode.tier) {
                    console.log(bulletLength);
                    startPos = activePos.with(activePos.line, activePos.character - bulletLength - Math.abs(indentSize) - 1);
                    endPos = activePos.with(activePos.line, activePos.character - 1);
                    replaceStr = tierNextBulletStr(getIndentLevel() - 2);
                }
                else {
                    endPos = activePos.with(activePos.line, Math.abs(indentSize));
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
            edit.replace(new vscode.Range(startPos, endPos), replaceStr);
        });
    }
    else if (!isActive && editor) {
        const activePos = editor.selection.active;
        editor.edit(edit => {
            edit.insert(activePos, '\b');
        });
    }
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map