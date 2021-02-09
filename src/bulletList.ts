import * as vscode from 'vscode';

export interface BulletList extends vscode.QuickPickItem{

    label:string;
    stringSize:number;
    bulletStringArray:string[];
    detail:string;
}
