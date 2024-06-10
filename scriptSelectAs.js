'use strict';

const sqlUtils = require('./scriptSqlUtils.js');

const colNameOrdinal = 0;

async function getSqlScriptAsSelectAsync(connectionProfile, tableCatalog, tableSchema, tableName) 
{
    let provider = connectionProfile.providerName;
    let queryText = "[FAILED TO RESOLVE QUERY TEXT]";
    if (provider === "MSSQL") {
        queryText = sqlUtils.getColumnInfoQuerySql(tableCatalog, tableSchema, tableName);
    }
    else if (provider === "MySQL") {
        queryText = sqlUtils.getColumnInfoQueryMySql(tableCatalog, tableSchema, tableName);
    }

    let results = await sqlUtils.getResultsFromQuerySql(connectionProfile, provider, queryText, tableCatalog);

    if (!results || results.rowCount === 0) {
        throw "No results";
    }

    let selectSqlScript = "...";
    if (provider === "MSSQL") {
        selectSqlScript = buildFinalScriptMSSQL(results, tableCatalog, tableSchema, tableName);
    }
    else if (provider === "MySQL") {
        selectSqlScript = buildFinalScriptMySQL(results, tableCatalog, tableSchema, tableName);
    }

    return selectSqlScript;
}

function buildFinalScriptMSSQL(results, tableCatalog, tableSchema, tableName)
{
    let fullScript = [];
    let columsScriptPart = [];

    fullScript.push("SELECT ");

    let columnIndex = 0;

    for (let i= 0; i !== results.rowCount; i++) 
    {
        let rowData = results.rows[i];

        const separator = (columnIndex === 0) ? " " : ",";
        
        columsScriptPart.push("\t\t" + separator + "[" + rowData[colNameOrdinal].displayValue + "]");

        columnIndex += 1;
    }

    return fullScript.concat(columsScriptPart).concat([`FROM [${tableCatalog}].[${tableSchema}].[${tableName}] `]).join('\n');
}

function buildFinalScriptMySQL(results, tableCatalog, tableSchema, tableName)
{
    let fullScript = [];
    let columsScriptPart = [];

    fullScript.push("SELECT ");

    let columnIndex = 0;

    for (let i= 0; i !== results.rowCount; i++) 
    {
        let rowData = results.rows[i];

        const separator = (columnIndex === 0) ? " " : ",";
        
        columsScriptPart.push("\t\t" + separator + "`" + rowData[colNameOrdinal].displayValue + "`");

        columnIndex += 1;
    }

    return fullScript.concat(columsScriptPart).concat([`FROM \`${tableSchema}\`.\`${tableName}\` `, `LIMIT 1000`, `;`]).join('\n');
}

module.exports.getSqlScriptAsSelectAsync = getSqlScriptAsSelectAsync;