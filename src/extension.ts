// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { debug } from 'console';
import * as vscode from 'vscode';
import { BulletList } from './bulletList';

enum IndentMode {
	random = 'random',
	tier = 'tier',
	cycle = 'cycle'
}

let currentIndentMode:IndentMode;

let isActive:boolean = true;

let bulletString:string = '\u2022';
let bulletLength:number = 1;
let bulletLists:BulletList[];
let activeBulletList:string[];


let justTabbed:boolean = false;
let cycleIndex:number = 0;

export function activate(context: vscode.ExtensionContext) {
	
	currentIndentMode = vscode.workspace.getConfiguration().get("customBulletPoints.BulletPointMode") ?? IndentMode.random;

	reloadBulletLists();
	activeBulletList = bulletLists[0].bulletStringArray;

	const editor = vscode.window.activeTextEditor;
	
	function reloadBulletLists() {
		bulletLists = vscode.workspace.getConfiguration().get("customBulletPoints.BulletPointSets")  
					  ?? [{label : "a", stringSize: 1, bulletStringArray : [""], detail : ""}];
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
			activeBulletList = bulletList?.bulletStringArray ?? [];
			bulletLength = bulletList?.stringSize ?? 1;
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
				
				const randomIndex = Math.floor(Math.random() * activeBulletList.length);
				bulletStr = activeBulletList[randomIndex];

			} else if (currentIndentMode === IndentMode.cycle) {

				bulletStr = activeBulletList[cycleIndex % activeBulletList.length];
				cycleIndex++;

			} else if (currentIndentMode === IndentMode.tier) {

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

			if (justTabbed) {

				const indentPos = activePos.with(activePos.line, 0);
				editor.edit(edit => {
					edit.insert(indentPos, getIndentString());
				});
				
			} else {

				const bulletPos = activePos.with(activePos.line + 1, activePos.character + 1);
				editor.edit(edit => {
					edit.insert(bulletPos, getIndentString() + nextBulletStr());
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
			
			let newLineIndent:string = "";
			let currentIndentLevel = getIndentLevel();
			let currentIndentString = getIndentString();
			for(let i:number = 0; i < currentIndentLevel; i++) {

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
			let startPos:vscode.Position;
			let endPos:vscode.Position;

			let currentIndentLevel:number = getIndentLevel();
			let indentSize:number = getIndentSize();

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
	
	context.subscriptions.push(vscode.commands.registerCommand('customBulletPoints.activate', activateCommand),
							   vscode.commands.registerCommand('customBulletPoints.deactivate', deactivateCommand),
	                           vscode.commands.registerCommand('customBulletPoints.chooseBulletPointSet', bulletQuickPick),
	 						   vscode.commands.registerCommand('customBulletPoints.reloadBulletPointSet', reloadBulletListsQP),
							   vscode.commands.registerCommand('customBulletPoints.doOnTabDown', doOnTabDown),
							   vscode.commands.registerCommand('customBulletPoints.doOnEnterDown', doOnEnterDown),
							   vscode.commands.registerCommand('customBulletPoints.doOnBackspaceDown', doOnBackspaceDown));
}
// this method is called when your extension is deactivated
export function deactivate() {}