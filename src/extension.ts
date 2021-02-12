// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { debug } from 'console';
import * as vscode from 'vscode';
import { BulletCollection } from './bulletCollection';

enum IndentMode {
	random = 'random',
	tier = 'tier',
	cycle = 'cycle'
}

let currentIndentMode:IndentMode;

let isActive:boolean = true;

let bulletString:string = '\u2022';
let bulletLength:number = 1;
let bulletCollections:BulletCollection[];
let activeBulletCollection:string[];


let justTabbed:boolean = false;
let cycleIndex:number = 0;

export function activate(context: vscode.ExtensionContext) {
	
	currentIndentMode = vscode.workspace.getConfiguration().get("customBulletPoints.BulletPointMode") ?? IndentMode.random;

	reloadBulletCollections();
	activeBulletCollection = bulletCollections[0].bulletStringArray;

	const editor = vscode.window.activeTextEditor;
	
	function reloadBulletCollections() {
		bulletCollections = vscode.workspace.getConfiguration().get("customBulletPoints.BulletPointCollectionss")  
					  ?? [{label : "a", stringSize: 1, bulletStringArray : [""], detail : ""}];
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
	function getIndentSize():number {

		let size:number = 0;

		let isUsingSpaces:boolean = vscode.workspace.getConfiguration().get("editor.insertSpaces") ?? false;

		if (isUsingSpaces) {

			size = vscode.workspace.getConfiguration().get("editor.tabSize") ?? 4;
		} else {
			size = -1;
		}
		return size;
	}

	function getIndentLevel():number {
		let indentCount:number = 0;

		if (editor) {

			let indentString:string = getIndentString();
			let indentSize:number = getIndentSize();

			//If using tabs, convert to actual tab size
			if (indentSize === -1) {
				indentSize = 1;
			}
			const activePos = editor.selection.active;
			for (let i:number = 0; i <= activePos.character; i += indentSize) {
					
				const character:string = editor.document.getText(new vscode.Range(
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

	function getIndentString():string {

		let indentSize:number = getIndentSize();
		let indentStr:string = "";
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
	function nextBulletStr():string {
		let bulletStr = "";
		if (editor) {

			const activePos = editor.selection.active;

			if (currentIndentMode === IndentMode.random) {
				
				const randomIndex = Math.floor(Math.random() * activeBulletCollection.length);
				bulletStr = activeBulletCollection[randomIndex];

			} else if (currentIndentMode === IndentMode.cycle) {

				bulletStr = activeBulletCollection[cycleIndex % activeBulletCollection.length];
				cycleIndex++;

			} else if (currentIndentMode === IndentMode.tier) {

				bulletStr = tierNextBulletStr(getIndentLevel());
			}

		}
		bulletLength = bulletStr.length;
		return bulletStr;
	}

	function tierNextBulletStr(indentLevel:number) {

		let bulletStr = "";

		bulletStr = activeBulletCollection[(indentLevel % activeBulletCollection.length)];
		return bulletStr;
	}

	const activateCommand = () => {
		
		vscode.commands.executeCommand("setContext", "customBulletPoints:active", true);
		justTabbed = false;

		if (isActive) {

			vscode.window.showInformationMessage('customBulletPoints: Already Active');

		} else {

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
			let startPos:vscode.Position;
			let endPos:vscode.Position;

			let replaceStr  = "";

			if (justTabbed) {
				
				if (currentIndentMode === IndentMode.tier) {

				startPos = activePos.with(activePos.line, getIndentLevel() * Math.abs(getIndentSize()) + 1);
				endPos = activePos.with(activePos.line, getIndentLevel() * Math.abs(getIndentSize()) + 2);
				replaceStr = getIndentString() + nextBulletStr();
				editor.edit(edit => {
					edit.replace(new vscode.Range(startPos, endPos), replaceStr);
				}).then(success => {
					let endPos = editor.selection.end; 
    				editor.selection = new vscode.Selection(endPos, endPos);
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
			
			
		} else if (!isActive){

			activateCommand();
			doOnTabDown();
		}
	}

	function doOnEnterDown() {

		if (isActive && editor && justTabbed) {
			
			let insertStr:string = "\n";
			let currentIndentLevel = getIndentLevel();
			let currentIndentStr = getIndentString();
			for(let i:number = 0; i < currentIndentLevel; i++) {

				insertStr += currentIndentStr;
			}

			const activePos = editor.selection.active;
			const bulletPos = activePos.with(activePos.line, activePos.character + 1);
			if (currentIndentMode = IndentMode.tier) {
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

		if (isActive && editor && justTabbed) {
			
			const activePos = editor.selection.active;
			let startPos:vscode.Position;
			let endPos:vscode.Position;

			let currentIndentLevel:number = getIndentLevel();
			let indentSize:number = getIndentSize();
			let replaceStr = "";
			if (activePos.character <= (currentIndentLevel * indentSize + bulletLength + 1)) {
				
				startPos = activePos.with(activePos.line, 0);
				
				if (currentIndentLevel === 1) {

					endPos = activePos.with(activePos.line, indentSize + bulletLength + 1);
					deactivateCommand();
				} else if (currentIndentLevel >= 0){

					//If indenting with Tabs
					if (indentSize === -1) {
	
						endPos = activePos.with(activePos.line, 1);
					//Else indenting with spaces
					} else {
						endPos = activePos.with(activePos.line, indentSize);
					}

				} else {
					deactivateCommand();
				}				
			}
			
			else {
				startPos = activePos.with(activePos.line, activePos.character - 1);
				endPos = activePos.with(activePos.line, activePos.character);
			}

			editor.edit(edit => {
				edit.replace(new vscode.Range(startPos, endPos), "");
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
	
	context.subscriptions.push(vscode.commands.registerCommand('customBulletPoints.activate', activateCommand),
							   vscode.commands.registerCommand('customBulletPoints.deactivate', deactivateCommand),
	                           vscode.commands.registerCommand('customBulletPoints.chooseBulletPointCollections', bulletQuickPick),
	 						   vscode.commands.registerCommand('customBulletPoints.reloadBulletPointCollections', reloadBulletCollectionsQP),
							   vscode.commands.registerCommand('customBulletPoints.doOnTabDown', doOnTabDown),
							   vscode.commands.registerCommand('customBulletPoints.doOnEnterDown', doOnEnterDown),
							   vscode.commands.registerCommand('customBulletPoints.doOnBackspaceDown', doOnBackspaceDown));
}
// this method is called when your extension is deactivated
export function deactivate() {}