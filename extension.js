const vscode = require('vscode');
const {getSqlScriptAsInsertAsync} = require('./scriptInsertAs.js');
const {getSqlScriptAsUpdateAsync} = require('./scriptUpdateAs.js');
const {getSqlScriptAsSelectAsync} = require('./scriptSelectAs.js');
const sqlUtils = require('./scriptSqlUtils.js');

const databaseNotFoundMessage = 'Database name not found.';

function tryGetBestDatabaseName(context) 
{
    let databaseName = context.connectionProfile.databaseName;
    
    if (databaseName) 
        return databaseName;

    //In Macos, in some cases, the database name is not available in the connection profile.
    //In this case, we try to get the database name from metadata.urn
    const metadataUrn = context.nodeInfo.metadata.urn;

    if (metadataUrn) {
        const regex = /\/Database\[@Name='([^']*)'\]/;
        const match = metadataUrn.match(regex);
        if (match) return match[1];
    }

    return null;
}

async function handleCommand(context, getScriptFunc, clipboard = false, identityOn = false) {
    let databaseName = tryGetBestDatabaseName(context);
    if (!databaseName) {
        vscode.window.showErrorMessage(databaseNotFoundMessage);
        return;
    }

    let schemaName = context.nodeInfo.metadata.schema;
    let tableName = context.nodeInfo.metadata.name;

    try {
        let scriptText = await getScriptFunc(context.connectionProfile, databaseName, schemaName, tableName, identityOn);
        if (clipboard) {
            await vscode.env.clipboard.writeText(scriptText);
            vscode.window.showInformationMessage('Script copied to clipboard.');
        } else {
            await vscode.commands.executeCommand('newQuery');
            let editor = vscode.window.activeTextEditor;
            editor.edit(edit => {
                edit.insert(new vscode.Position(0, 0), scriptText);
            });
        }
    } catch (reason) {
        vscode.window.showErrorMessage(reason);
    }
}

function activate(context) {
    const commands = [
        { name: "extraSqlScriptAs.insertTableToClipboard", func: getSqlScriptAsInsertAsync, clipboard: true },
        { name: "extraSqlScriptAs.insertTable", func: getSqlScriptAsInsertAsync },
        { name: "extraSqlScriptAs.insertTableToClipboardIdentityOn", func: getSqlScriptAsInsertAsync, clipboard: true, identityOn: true },
        { name: "extraSqlScriptAs.insertTableIdentityOn", func: getSqlScriptAsInsertAsync, identityOn: true },
        { name: "extraSqlScriptAs.updateTableToClipboard", func: getSqlScriptAsUpdateAsync, clipboard: true },
        { name: "extraSqlScriptAs.updateTable", func: getSqlScriptAsUpdateAsync },
        { name: "extraSqlScriptAs.deleteTableToClipboard", func: (profile, db, schema, table) => Promise.resolve(sqlUtils.getDeleteSqlScript(db, schema, table)), clipboard: true },
        { name: "extraSqlScriptAs.deleteTable", func: (profile, db, schema, table) => Promise.resolve(sqlUtils.getDeleteSqlScript(db, schema, table)) },
        { name: "extraSqlScriptAs.selectTableToClipboard", func: getSqlScriptAsSelectAsync, clipboard: true },
        { name: "extraSqlScriptAs.selectTable", func: getSqlScriptAsSelectAsync },
    ];

    for (const { name, func, clipboard, identityOn } of commands) {
        let command = vscode.commands.registerCommand(name, context => handleCommand(context, func, clipboard, identityOn));
        context.subscriptions.push(command);
    }
}

function deactivate() {}

exports.activate = activate;
exports.deactivate = deactivate;