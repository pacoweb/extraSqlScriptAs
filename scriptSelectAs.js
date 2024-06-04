'use strict';

const sqlUtils = require('./scriptSqlUtils.js');

const colNameOrdinal = 0;

async function getSqlScriptAsSelectAsync(connectionProfile, tableCatalog, tableSchema, tableName) 
{
    let queryText = sqlUtils.getColumnInfoQuerySql(tableCatalog, tableSchema, tableName);

    let results = await sqlUtils.getResultsFromQuerySql(connectionProfile, "MSSQL", queryText, tableCatalog);

    if (!results || results.rowCount === 0) {
        throw "No se han obtenido resultados de la consulta";
    }

    let updateSqlScript = buildFinalScript(results, tableCatalog, tableSchema, tableName);

    return updateSqlScript;
}

function buildFinalScript(results, tableCatalog, tableSchema, tableName)
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

module.exports.getSqlScriptAsSelectAsync = getSqlScriptAsSelectAsync;