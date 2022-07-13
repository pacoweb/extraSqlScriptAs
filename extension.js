const vscode = require('vscode');

const {getSqlScriptAsInsertAsync} = require('./scriptInsertAs.js');
const {getSqlScriptAsUpdateAsync} = require('./scriptUpdateAs.js');
const {getSqlScriptAsSelectAsync} = require('./scriptSelectAs.js');
const {
  getSqlScriptAsDropAndCreateStoredProcedureAsync,
} = require("./scriptSPAs.js");
const sqlUtils = require('./scriptSqlUtils.js');
const { getSqlScriptAsDropAndCreateFunctionAsync } = require('./scriptFuncAs.js');

function activate(context) 
{
    let insertTableCommandToClipBoard = vscode.commands.registerCommand("extraSqlScriptAs.insertTableToClipboard"
    , function(context) 
        {
            let databaseName = context.connectionProfile.databaseName;
            let schemaName = context.nodeInfo.metadata.schema;
            let tableName = context.nodeInfo.metadata.name;

            getSqlScriptAsInsertAsync(context.connectionProfile, databaseName, schemaName, tableName)
                .then(scriptText => 
                {
                    vscode.env.clipboard.writeText(scriptText).then((text)=>{
                        vscode.window.showInformationMessage('Script copied to clipboard.');
                    });
                })
                .catch(reason => 
                    {
                        vscode.window.showErrorMessage(reason);
                    }
                );     
        }
    );
   
    let insertTableCommand = vscode.commands.registerCommand("extraSqlScriptAs.insertTable"
        , function(context) 
        {
            let databaseName = context.connectionProfile.databaseName;
            let schemaName = context.nodeInfo.metadata.schema;
            let tableName = context.nodeInfo.metadata.name;

            getSqlScriptAsInsertAsync(context.connectionProfile, databaseName, schemaName, tableName)
                .then(scriptText => 
                {
                    vscode.commands.executeCommand('newQuery').then(s => {
                        
                        let editor = vscode.window.activeTextEditor;

                        editor.edit(edit => {
                            edit.insert(new vscode.Position(0, 0), scriptText);
                        });
                    });
                })
                .catch(reason => 
                    {
                        vscode.window.showErrorMessage(reason);
                    }
                );        
        }
    );

    let updateTableCommandToClipBoard = vscode.commands.registerCommand("extraSqlScriptAs.updateTableToClipboard"
    , function(context) 
        {
            let databaseName = context.connectionProfile.databaseName;
            let schemaName = context.nodeInfo.metadata.schema;
            let tableName = context.nodeInfo.metadata.name;

            getSqlScriptAsUpdateAsync(context.connectionProfile, databaseName, schemaName, tableName)
                .then(scriptText => 
                {
                    vscode.env.clipboard.writeText(scriptText).then((text)=>{
                        vscode.window.showInformationMessage('Script copied to clipboard.');
                    });
                })
                .catch(reason => 
                        {
                            vscode.window.showErrorMessage(reason);
                        }
                );      
        }
    );
   
    let updateTableCommand = vscode.commands.registerCommand("extraSqlScriptAs.updateTable"
        , function(context) 
        {
            let databaseName = context.connectionProfile.databaseName;
            let schemaName = context.nodeInfo.metadata.schema;
            let tableName = context.nodeInfo.metadata.name;
            
            //Test
            getSqlScriptAsUpdateAsync(context.connectionProfile, databaseName, schemaName, tableName)
                .then(scriptText => 
                {
                    vscode.commands.executeCommand('newQuery').then(s => {
                        
                        let editor = vscode.window.activeTextEditor;

                        editor.edit(edit => {
                            edit.insert(new vscode.Position(0, 0), scriptText);
                        });
                    });
                })
                .catch(reason => 
                    {
                        vscode.window.showErrorMessage(reason);
                    }
            );      
        }
    );

    let deleteTableCommandToClipBoard = vscode.commands.registerCommand("extraSqlScriptAs.deleteTableToClipboard"
    , function(context) 
        {
            let databaseName = context.connectionProfile.databaseName;
            let schemaName = context.nodeInfo.metadata.schema;
            let tableName = context.nodeInfo.metadata.name;

            vscode.env.clipboard.writeText(sqlUtils.getDeleteSqlScript(databaseName, schemaName, tableName)).then((text)=>{
                vscode.window.showInformationMessage('Script copied to clipboard.');
            });     
        }
    );
   
    let deleteTableCommand = vscode.commands.registerCommand("extraSqlScriptAs.deleteTable"
        , function(context) 
        {
            let databaseName = context.connectionProfile.databaseName;
            let schemaName = context.nodeInfo.metadata.schema;
            let tableName = context.nodeInfo.metadata.name;

            vscode.commands.executeCommand('newQuery').then(s => {
                
                let editor = vscode.window.activeTextEditor;

                editor.edit(edit => {
                    edit.insert(new vscode.Position(0, 0)
                    , sqlUtils.getDeleteSqlScript(databaseName, schemaName, tableName))
                });
            });      
        }
    );

    let selectTableCommandToClipBoard = vscode.commands.registerCommand("extraSqlScriptAs.selectTableToClipboard"
    , function(context) 
        {
            let databaseName = context.connectionProfile.databaseName;
            let schemaName = context.nodeInfo.metadata.schema;
            let tableName = context.nodeInfo.metadata.name;

            getSqlScriptAsSelectAsync(context.connectionProfile, databaseName, schemaName, tableName)
                .then(scriptText => 
                {
                    vscode.env.clipboard.writeText(scriptText).then((text)=>{
                        vscode.window.showInformationMessage('Script copied to clipboard.');
                    });
                })
                .catch(reason => 
                        {
                            vscode.window.showErrorMessage(reason);
                        }
                );      
        }
    );
   
    let selectTableCommand = vscode.commands.registerCommand("extraSqlScriptAs.selectTable"
        , function(context) 
        {
            let databaseName = context.connectionProfile.databaseName;
            let schemaName = context.nodeInfo.metadata.schema;
            let tableName = context.nodeInfo.metadata.name;
            
            //Test
            getSqlScriptAsSelectAsync(context.connectionProfile, databaseName, schemaName, tableName)
                .then(scriptText => 
                {
                    vscode.commands.executeCommand('newQuery').then(s => {
                        
                        let editor = vscode.window.activeTextEditor;

                        editor.edit(edit => {
                            edit.insert(new vscode.Position(0, 0), scriptText);
                        });
                    });
                })
                .catch(reason => 
                    {
                        vscode.window.showErrorMessage(reason);
                    }
            );      
        }
    );

    let dropAndCreateSPCommandToClipBoard = vscode.commands.registerCommand(
      "extraSqlScriptAs.dropandCreateStoredProcedureToClipboard",
      function (context) {
        let databaseName = context.connectionProfile.databaseName;
        let schemaName = context.nodeInfo.metadata.schema;
        let routineName = context.nodeInfo.metadata.name;

        getSqlScriptAsDropAndCreateStoredProcedureAsync(
          context.connectionProfile,
          databaseName,
          schemaName,
          routineName
        )
          .then((scriptText) => {
            vscode.env.clipboard.writeText(scriptText).then(() => {
              vscode.window.showInformationMessage(
                "Script copied to clipboard."
              );
            });
          })
          .catch((reason) => {
            vscode.window.showErrorMessage(reason);
          });
      }
    );

    let dropAndCreateSPCommand = vscode.commands.registerCommand(
      "extraSqlScriptAs.dropandCreateStoredProcedure",
      function (context) {
        let databaseName = context.connectionProfile.databaseName;
        let schemaName = context.nodeInfo.metadata.schema;
        let routineName = context.nodeInfo.metadata.name;

        //Test
        getSqlScriptAsDropAndCreateStoredProcedureAsync(
          context.connectionProfile,
          databaseName,
          schemaName,
          routineName
        )
          .then((scriptText) => {
            vscode.commands.executeCommand("newQuery").then(() => {
              let editor = vscode.window.activeTextEditor;

              editor.edit((edit) => {
                edit.insert(new vscode.Position(0, 0), scriptText);
              });
            });
          })
          .catch((reason) => {
            vscode.window.showErrorMessage(reason);
          });
      }
    );
    let dropAndCreateFuncCommandToClipBoard = vscode.commands.registerCommand(
      "extraSqlScriptAs.dropandCreateFunctionToClipboard",
      function (context) {
        let databaseName = context.connectionProfile.databaseName;
        let schemaName = context.nodeInfo.metadata.schema;
        let routineName = context.nodeInfo.metadata.name;

        getSqlScriptAsDropAndCreateFunctionAsync(
          context.connectionProfile,
          databaseName,
          schemaName,
          routineName
        )
          .then((scriptText) => {
            vscode.env.clipboard.writeText(scriptText).then(() => {
              vscode.window.showInformationMessage(
                "Script copied to clipboard."
              );
            });
          })
          .catch((reason) => {
            vscode.window.showErrorMessage(reason);
          });
      }
    );

    let dropAndCreateFuncCommand = vscode.commands.registerCommand(
      "extraSqlScriptAs.dropandCreateFunction",
      function (context) {
        let databaseName = context.connectionProfile.databaseName;
        let schemaName = context.nodeInfo.metadata.schema;
        let routineName = context.nodeInfo.metadata.name;

        //Test
        getSqlScriptAsDropAndCreateFunctionAsync(
          context.connectionProfile,
          databaseName,
          schemaName,
          routineName
        )
          .then((scriptText) => {
            vscode.commands.executeCommand("newQuery").then(() => {
              let editor = vscode.window.activeTextEditor;

              editor.edit((edit) => {
                edit.insert(new vscode.Position(0, 0), scriptText);
              });
            });
          })
          .catch((reason) => {
            vscode.window.showErrorMessage(reason);
          });
      }
    );


    context.subscriptions.push(insertTableCommand);
    context.subscriptions.push(insertTableCommandToClipBoard);

    context.subscriptions.push(updateTableCommand);
    context.subscriptions.push(updateTableCommandToClipBoard);

    context.subscriptions.push(deleteTableCommand);
    context.subscriptions.push(deleteTableCommandToClipBoard);

    context.subscriptions.push(selectTableCommand);
    context.subscriptions.push(selectTableCommandToClipBoard);

    context.subscriptions.push(dropAndCreateSPCommand);
    context.subscriptions.push(dropAndCreateSPCommandToClipBoard);

    context.subscriptions.push(dropAndCreateFuncCommand);
    context.subscriptions.push(dropAndCreateFuncCommandToClipBoard);
};

function deactivate() {

};

exports.activate = activate;
exports.deactivate = deactivate;