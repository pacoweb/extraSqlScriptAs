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

async function getSqlScriptAsInsertAsync(connectionProfile, tableCatalog, tableSchema, tableName, allowIdentityOn = false) 
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

    let insertSqlScript = "...";
    if (provider === "MSSQL") {
        insertSqlScript = buildFinalScriptMSSQL(results, tableCatalog, tableSchema, tableName, allowIdentityOn);
    }
    else if (provider === "MySQL") {
        insertSqlScript = buildFinalScriptMySQL(results, tableCatalog, tableSchema, tableName, allowIdentityOn);
    }

    return insertSqlScript;
}

function buildFinalScriptMSSQL(results, tableCatalog, tableSchema, tableName, allowIdentityOn)
{
    let fullScript = [];
    let columsScriptPart = [];
    let valuesScriptPart = [];

    columsScriptPart.push("(");
    valuesScriptPart.push("(");

    let columnIndex = 0;
    let anyIdentityColumn = false;

    for (let i= 0; i !== results.rowCount; i++) 
    {
        let rowData = results.rows[i];

        let isComputedRaw = rowData[colComputedOrdinal].displayValue;
        let isIdentityRaw = rowData[colIsIdentityOrdinal].displayValue;
        let dataTypeRaw = rowData[colDataTypeOrdinal].displayValue;

        let isComputedColumn  = isComputedRaw === "1";
        let isIdentityColumn  = isIdentityRaw === "1";
        let isTimeStampColumn = dataTypeRaw == "timestamp";

        if(isComputedColumn || isTimeStampColumn){
            continue;
        }

        if(isIdentityColumn)
        {
            if(!allowIdentityOn){
                continue;
            }

            if(!anyIdentityColumn){
                anyIdentityColumn = true;
            }
        }

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

    const printSetIdentity = allowIdentityOn && anyIdentityColumn;

    if(printSetIdentity){
        fullScript.push(`SET IDENTITY_INSERT [${tableCatalog}].[${tableSchema}].[${tableName}] ON\n`);
    }

    fullScript.push(`INSERT INTO [${tableCatalog}].[${tableSchema}].[${tableName}]`);

    columsScriptPart.push(")");
    valuesScriptPart.push(")");

    if(printSetIdentity){
        valuesScriptPart.push(`\nSET IDENTITY_INSERT [${tableCatalog}].[${tableSchema}].[${tableName}] OFF\n`);
    }

    return fullScript.concat(columsScriptPart).concat(["VALUES"]).concat(valuesScriptPart).join('\n');
}

function buildFinalScriptMySQL(results, tableCatalog, tableSchema, tableName, allowIdentityOn)
{
    let fullScript = [];
    let columsScriptPart = [];
    let valuesScriptPart = [];

    columsScriptPart.push("(");
    valuesScriptPart.push("(");

    let columnIndex = 0;
    let anyIdentityColumn = false;

    for (let i= 0; i !== results.rowCount; i++) 
    {
        let rowData = results.rows[i];

        let isComputedRaw = rowData[colComputedOrdinal].displayValue;
        let isIdentityRaw = rowData[colIsIdentityOrdinal].displayValue;
        let dataTypeRaw = rowData[colDataTypeOrdinal].displayValue;

        let isComputedColumn  = isComputedRaw === "1";
        let isIdentityColumn  = isIdentityRaw === "1";
        let isTimeStampColumn = dataTypeRaw == "timestamp";

        if(isComputedColumn || isTimeStampColumn){
            continue;
        }

        if(isIdentityColumn)
        {
            if(!allowIdentityOn){
                continue;
            }

            if(!anyIdentityColumn){
                anyIdentityColumn = true;
            }
        }

        const separator = (columnIndex === 0) ? " " : ",";
                
        columsScriptPart.push("\t\t" + separator + "`" + rowData[colNameOrdinal].displayValue + "`");

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

    const printSetIdentity = allowIdentityOn && anyIdentityColumn;

    if(printSetIdentity){
        // no need in MySQL
        //fullScript.push(`SET IDENTITY_INSERT \`${tableSchema}\`.\`${tableName}\` ON;\n`);
    }

    fullScript.push(`INSERT INTO \`${tableSchema}\`.\`${tableName}\``);

    columsScriptPart.push(")");
    valuesScriptPart.push(");");

    if(printSetIdentity){
        // no need in MySQL
        //valuesScriptPart.push(`\nSET IDENTITY_INSERT \`${tableSchema}\`.\`${tableName}\` OFF;\n`);
    }

    return fullScript.concat(columsScriptPart).concat(["VALUES"]).concat(valuesScriptPart).join('\n');
}

module.exports.getSqlScriptAsInsertAsync = getSqlScriptAsInsertAsync;