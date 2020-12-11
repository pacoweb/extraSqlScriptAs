'use strict';

const vscode = require('vscode');
const azdata = require('azdata');

const colNameOrdinal = 0;
const colDataTypeOrdinal = 1;
const colCharsMaxLenOrdinal = 2;
const colNumericPrecisionOrdinal = 3;
const colNumerocScaleOrdinal = 4;
const colIsNullableOrdinal = 5;
const colIsIdentityOrdinal = 6;
const colComputedOrdinal = 7;

async function GetSqlScriptAsInsertAsync(connectionProfile, tableCatalog, tableSchema, tableName) 
{
    var queryText = `SELECT 
        COL.COLUMN_NAME,
        COL.DATA_TYPE,
        COL.CHARACTER_MAXIMUM_LENGTH,
        COL.NUMERIC_PRECISION,
        COL.NUMERIC_SCALE,
        COL.IS_NULLABLE,
        COLUMNPROPERTY(OBJECT_ID(T.TABLE_SCHEMA + '.' +T.TABLE_NAME), COL.COLUMN_NAME, 'IsIdentity') IS_IDENTITY,
        COLUMNPROPERTY(OBJECT_ID(T.TABLE_SCHEMA + '.' +T.TABLE_NAME), COL.COLUMN_NAME, 'IsComputed') IS_COMPUTED
        FROM [${tableCatalog}].INFORMATION_SCHEMA.TABLES T
        INNER JOIN [${tableCatalog}].INFORMATION_SCHEMA.COLUMNS COL ON COL.TABLE_NAME = T.TABLE_NAME AND COL.TABLE_SCHEMA = T.TABLE_SCHEMA
        WHERE 
        T.TABLE_TYPE = 'BASE TABLE'
        AND T.TABLE_SCHEMA = '${tableSchema}' 
        AND T.TABLE_CATALOG = '${tableCatalog}' 
        AND T.TABLE_NAME = '${tableName}' 
        ORDER BY COL.ORDINAL_POSITION`;

    try 
    {
        let connectionResult = await azdata.connection.connect(connectionProfile, false, false);
        let connectionUri = await azdata.connection.getUriForConnection(connectionResult.connectionId);

        let queryProvider = azdata.dataprotocol.getProvider("MSSQL", azdata.DataProviderType.QueryProvider);

        let results = await queryProvider.runQueryAndReturn(connectionUri, queryText);

        if (!results || results.rowCount === 0) {
            vscode.window.showErrorMessage("Error!!"); //TODO: CHANGE TEXT
            return;
        }

        return buildFinalScript(results, tableCatalog, tableSchema, tableName);
    } 
    catch (error) 
    {
        
    }

    return null;
}

function buildFinalScript(results, tableCatalog, tableSchema, tableName)
{
    let fullScript = [];
    let columsScriptPart = [];
    let valuesScriptPart = [];

    fullScript.push(`INSERT INTO [${tableCatalog}].[${tableSchema}].[${tableName}]`);

    columsScriptPart.push("(");
    valuesScriptPart.push("(");

    for (let i= 0; i !== results.rowCount; i++) 
    {
        let rowData = results.rows[i];

        let isComputed = rowData[colIsIdentityOrdinal];
        let IsIdentity = rowData[colIsIdentityOrdinal];

        let separator = i===0 ? "" : ", ";

        if(i !== 0)
        {
            columsScriptPart.push(separator);
            valuesScriptPart.push(separator);
        }
        
        columsScriptPart.push("[" + rowData[colNameOrdinal].displayValue + "]");
        
    }

    columsScriptPart.push(")");
    valuesScriptPart.push(")");

    return fullScript.concat(columsScriptPart).concat(valuesScriptPart).join('\n');
}

module.exports.GetSqlScriptAsInsertAsync = GetSqlScriptAsInsertAsync;