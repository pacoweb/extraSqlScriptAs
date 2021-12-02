'use strict';

const vscode = require('vscode');
const sqlUtils = require('./scriptSqlUtils.js');

const colNameOrdinal = 0;
const colDataTypeOrdinal = 1;
const colCharsMaxLenOrdinal = 2;
const colNumericPrecisionOrdinal = 3;
const colNumerocScaleOrdinal = 4;
const colIsNullableOrdinal = 5;
const colIsIdentityOrdinal = 6;
const colComputedOrdinal = 7;
const colDatetimePrecisionOrdinal = 8;

async function getSqlScriptAsInsertAsync(connectionProfile, tableCatalog, tableSchema, tableName) 
{
    let queryText = sqlUtils.getColumnInfoQuerySql(tableCatalog, tableSchema, tableName);

    let results = await sqlUtils.getResultsFromQuerySql(connectionProfile, "MSSQL", queryText);

    if (!results || results.rowCount === 0) {
        throw "No se han obtenido resultados de la consulta";
    }

    let insertSqlScript = buildFinalScript(results, tableCatalog, tableSchema, tableName);

    return insertSqlScript;
}

function buildFinalScript(results, tableCatalog, tableSchema, tableName)
{
    let fullScript = [];
    let columsScriptPart = [];
    let valuesScriptPart = [];

    fullScript.push(`INSERT INTO [${tableCatalog}].[${tableSchema}].[${tableName}]`);

    columsScriptPart.push("(");
    valuesScriptPart.push("(");

    let columnIndex = 0;

    for (let i= 0; i !== results.rowCount; i++) 
    {
        let rowData = results.rows[i];

        let isComputed = rowData[colComputedOrdinal].displayValue;
        let IsIdentity = rowData[colIsIdentityOrdinal].displayValue;

        if(isComputed === "1" || IsIdentity === "1")
            continue;

        const separator = (columnIndex === 0) ? " " : ",";
                
        columsScriptPart.push("\t\t" + separator + "[" + rowData[colNameOrdinal].displayValue + "]");

        valuesScriptPart.push("\t\t" + separator + sqlUtils.getColTypeString(
            rowData[colDataTypeOrdinal].displayValue,
            rowData[colCharsMaxLenOrdinal].displayValue,
            rowData[colNumericPrecisionOrdinal].displayValue,
            rowData[colNumerocScaleOrdinal].displayValue,
            rowData[colIsNullableOrdinal].displayValue,
            rowData[colDatetimePrecisionOrdinal].displayValue
        ));

        columnIndex += 1;
    }

    columsScriptPart.push(")");
    valuesScriptPart.push(")");

    return fullScript.concat(columsScriptPart).concat(["VALUES"]).concat(valuesScriptPart).join('\n');
}

module.exports.getSqlScriptAsInsertAsync = getSqlScriptAsInsertAsync;