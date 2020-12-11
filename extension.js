const vscode = require('vscode');
const azdata = require('azdata');
const {GetSqlScriptAsInsertAsync} = require('./scriptInsertAs.js');

function activate(context) 
{
    let insertTableCommand = vscode.commands.registerCommand("extraSqlScriptAs.insertTable", function(context) 
    {
        let databaseName = context.connectionProfile.databaseName;
        let schemaName = context.nodeInfo.metadata.schema;
        let tableName = context.nodeInfo.metadata.name;

        let query = GetSqlScriptAsInsertAsync(context.connectionProfile, databaseName, schemaName, tableName)
                        .then(t => t)
                        .catch(t => t);
    });

    context.subscriptions.push(insertTableCommand);
};

function deactivate() {

};

exports.activate = activate;
exports.deactivate = deactivate;