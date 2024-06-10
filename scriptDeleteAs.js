'use strict';

const vscode = require('vscode');
const sqlUtils = require('./scriptSqlUtils.js');

function getDeleteSqlScript(connectionProfile, tableCatalog, tableSchema, tableName)
{
    let provider = connectionProfile.providerName;
    let queryText = "[FAILED TO RESOLVE QUERY TEXT]";
    if (provider === "MSSQL") {
        queryText = `DELETE FROM [${tableCatalog}].[${tableSchema}].[${tableName}]
        WHERE <Search Conditions,,>`;
    }
    else if (provider === "MySQL") {
        queryText = `DELETE FROM \`${tableSchema}\`.\`${tableName}\`
        WHERE <Search Conditions,,>`;
    }
    return queryText;
}

module.exports.getDeleteSqlScript = getDeleteSqlScript;