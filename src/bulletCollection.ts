import * as vscode from 'vscode';

export interface BulletCollection extends vscode.QuickPickItem{

    label:string;
    stringSize:number;
    bulletStringArray:string[];
    detail:string;
}
