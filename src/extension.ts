import { debug } from 'console';
import * as vscode from 'vscode';
import { BulletCollection } from './bulletCollection';

enum BulletMode {
	random = 'random',
	tier = 'tier',
	cycle = 'cycle'
}

let currentBulletMode: BulletMode;
let isActive: boolean = false;

let activityStatusBarItem: vscode.StatusBarItem;

let bulletString: string;
let bulletLength: number;
let bulletCollections: BulletCollection[];
let activeBulletCollection: string[];

let justTabbed: boolean = false;
let cycleIndex: number = 0;

export function activate(context: vscode.ExtensionContext) {

	activityStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
	activityStatusBarItem.command = "customBulletPoints.activityQuickPick";
	//activateCommand();
	currentBulletMode = vscode.workspace.getConfiguration().get("customBulletPoints.BulletPointMode")
		?? BulletMode.random;

	reloadBulletCollections();
	activeBulletCollection = bulletCollections[0].bulletStringArray;

	deactivateCommand();

	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration("customBulletPoints.BulletPointMode")) {
			currentBulletMode = vscode.workspace.getConfiguration().get("customBulletPoints.BulletPointMode")
				?? BulletMode.tier;
		}
	});

	vscode.window.onDidChangeActiveTextEditor(editor => {

		if (!editor) {
			activityStatusBarItem.hide();
		} else if (!isActive) {
			activityStatusBarItem.hide();
		} else if (editor.document.languageId !== 'plaintext') {
			activityStatusBarItem.hide();
		} else if (editor.document.languageId === 'plaintext') {
			activityStatusBarItem.show();
		} else {
			activityStatusBarItem.show();
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('customBulletPoints.activate', activateCommand),
		vscode.commands.registerCommand('customBulletPoints.deactivate', deactivateCommand),
		vscode.commands.registerCommand('customBulletPoints.activityQuickPick', activityQuickPick),
		vscode.commands.registerCommand('customBulletPoints.chooseModeQuickPick', chooseModeQuickPick),
		vscode.commands.registerCommand('customBulletPoints.chooseBulletPointCollections', bulletQuickPick),
		vscode.commands.registerCommand('customBulletPoints.reloadBulletPointCollections', reloadBulletCollectionsQP),
		vscode.commands.registerCommand('customBulletPoints.doOnTabDown', doOnTabDown),
		vscode.commands.registerCommand('customBulletPoints.doOnEnterDown', doOnEnterDown),
		vscode.commands.registerCommand('customBulletPoints.doOnBackspaceDown', doOnBackspaceDown));
}

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
	cycleIndex = 0;
	isActive = false;
	justTabbed = false;
};

function activityQuickPick() {
	let optionCollection: string[] = ["Custom Bullet Points: Activate",
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

function chooseModeQuickPick() {
	let optionCollection: string[] = ["Tier",
		"Cycle",
		"Random"];
	vscode.window.showQuickPick(optionCollection).then(choice => {
		if (choice === optionCollection[0]) {
			currentBulletMode = BulletMode.tier;
		}
		else if (choice === optionCollection[1]) {
			currentBulletMode = BulletMode.cycle;
		}
		else if (choice === optionCollection[2]) {
			currentBulletMode = BulletMode.random;
		}
	});
}

function reloadBulletCollections() {
	bulletCollections = vscode.workspace.getConfiguration().get("customBulletPoints.BulletPointCollections")
		?? [{ label: "a", stringSize: 1, bulletStringArray: [""], detail: "" }];
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
		activeBulletCollection = bulletCollection?.bulletStringArray ?? [];
		bulletLength = bulletCollection?.stringSize ?? 1;
	});
}

//Returns -1 if using tabs, >= 1 when using spaces
function getIndentSize(): number {
	let editor = vscode.window.activeTextEditor;
	let size: number = 0;

	let isUsingSpaces: boolean = vscode.workspace.getConfiguration().get("editor.insertSpaces")
		?? false;

	if (isUsingSpaces) {

		size = vscode.workspace.getConfiguration().get("editor.tabSize") ?? 4;
	} else {
		size = -1;
	}
	return size;
}

function getIndentLevel(): number {
	let indentCount: number = 0;
	let editor = vscode.window.activeTextEditor;
	if (editor) {

		let indentString: string = getIndentString();
		let indentSize: number = getIndentSize();

		//If using tabs, convert to actual tab size
		if (indentSize === -1) {
			indentSize = 1;
		}
		const activePos = editor.selection.active;
		for (let i: number = 0; i <= activePos.character; i += indentSize) {

			const character: string = editor.document.getText(new vscode.Range(
				new vscode.Position(activePos.line, i),
				new vscode.Position(activePos.line, i + indentSize)
			));
			if (character === indentString) {
				indentCount++;
			}
		}
	}

	return indentCount;
}

function getIndentString(): string {

	let indentSize: number = getIndentSize();
	let indentStr: string = "";
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

function nextBulletStr(): string {
	let editor = vscode.window.activeTextEditor;
	let bulletStr = "";
	if (editor) {

		const activePos = editor.selection.active;

		if (currentBulletMode === BulletMode.random) {

			const randomIndex = Math.floor(Math.random() * activeBulletCollection.length);
			bulletStr = activeBulletCollection[randomIndex];

		} else if (currentBulletMode === BulletMode.cycle) {

			bulletStr = activeBulletCollection[cycleIndex % activeBulletCollection.length];
			cycleIndex++;

		} else if (currentBulletMode === BulletMode.tier) {

			bulletStr = tierNextBulletStr(getIndentLevel());
		}

	}
	bulletLength = bulletStr.length;
	return bulletStr;
}

function tierNextBulletStr(indentLevel: number) {

	let bulletStr = "";

	bulletStr = activeBulletCollection[(indentLevel % activeBulletCollection.length)];
	return bulletStr;
}


function doOnTabDown() {
	let editor = vscode.window.activeTextEditor;
	if (isActive && editor) {

		const activePos = editor.selection.active;
		let startPos: vscode.Position;
		let endPos: vscode.Position;

		let replaceStr = "";

		if (justTabbed) {

			if (currentBulletMode === BulletMode.tier) {

				startPos = activePos.with(activePos.line, getIndentLevel() * Math.abs(getIndentSize()));
				endPos = activePos.with(activePos.line, getIndentLevel() * Math.abs(getIndentSize()) + bulletLength);
				replaceStr = getIndentString() + nextBulletStr();
				editor.edit(edit => {
					edit.replace(new vscode.Range(startPos, endPos), replaceStr);
				}).then(success => {

					let endPos = editor!.selection.end;
					editor!.selection = new vscode.Selection(endPos, endPos);

				});

			} else {
				const indentPos = activePos.with(activePos.line, 0);
				editor.edit(edit => {
					edit.insert(indentPos, getIndentString());
				});
			}

		} else {

			startPos = activePos.with(activePos.line, activePos.character + 1);

			editor.edit(edit => {
				edit.insert(startPos, getIndentString() + nextBulletStr() + " ");
			});
			justTabbed = true;
		}
	} else if (!isActive && editor) {
		//If tabbing when not active and at the beginning of the document
		if (editor?.selection.active.character === 0) {
			activateCommand();
			doOnTabDown();
		} else {
			const activePos = editor.selection.active;
			let startPos = activePos.with(activePos.line, activePos.character + 1);
			editor.edit(edit => {
				edit.insert(startPos, getIndentString());
			});
		}
	}
}

function doOnEnterDown() {
	let editor = vscode.window.activeTextEditor;
	console.log("enter");
	if (isActive && editor && justTabbed) {

		let insertStr: string = "\n";
		let currentIndentLevel = getIndentLevel();
		let currentIndentStr = getIndentString();
		for (let i: number = 0; i < currentIndentLevel; i++) {

			insertStr += currentIndentStr;
		}

		const activePos = editor.selection.active;
		const bulletPos = activePos.with(activePos.line, activePos.character + 1);
		if (currentBulletMode === BulletMode.tier) {
			insertStr += tierNextBulletStr(currentIndentLevel - 1) + " ";
		} else {
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
		let startPos: vscode.Position;
		let endPos: vscode.Position;

		let currentIndentLevel: number = getIndentLevel();
		let indentSize: number = getIndentSize();
		let replaceStr = "";
		if (activePos.character <= (currentIndentLevel * indentSize + bulletLength + 1)) {

			startPos = activePos.with(activePos.line, 0);

			if (currentIndentLevel === 1) {

				endPos = activePos.with(activePos.line, indentSize + bulletLength + 1);
				deactivateCommand();
			} else if (currentIndentLevel >= 0) {

				if (currentBulletMode === BulletMode.tier) {
					startPos = activePos.with(activePos.line, activePos.character - bulletLength - Math.abs(indentSize) - 1);
					endPos = activePos.with(activePos.line, activePos.character - 1);
					replaceStr = tierNextBulletStr(getIndentLevel() - 2);
				} else {
					endPos = activePos.with(activePos.line, Math.abs(indentSize));
				}

			} else {
				deactivateCommand();
			}
		} else {
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
export function deactivate() { }