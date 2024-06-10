'use strict';

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

async function getSqlScriptAsUpdateAsync(connectionProfile, tableCatalog, tableSchema, tableName) 
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

    let updateSqlScript = "...";
    if (provider === "MSSQL") {
        updateSqlScript = buildFinalScriptMSSQL(results, tableCatalog, tableSchema, tableName);
    }
    else if (provider === "MySQL") {
        updateSqlScript = buildFinalScriptMySQL(results, tableCatalog, tableSchema, tableName);
    }

    return updateSqlScript;
}

function buildFinalScriptMSSQL(results, tableCatalog, tableSchema, tableName)
{
    let fullScript = [];
    let columsScriptPart = [];

    fullScript.push(`UPDATE [${tableCatalog}].[${tableSchema}].[${tableName}] `);
    fullScript.push("SET");

    let columnIndex = 0;

    for (let i= 0; i !== results.rowCount; i++) 
    {
        let rowData = results.rows[i];

        let isComputedRaw = rowData[colComputedOrdinal].displayValue;
        let isIdentityRaw = rowData[colIsIdentityOrdinal].displayValue;
        let dataTypeRaw   = rowData[colDataTypeOrdinal].displayValue;

        let isComputedColumn  = isComputedRaw === "1";
        let isIdentityColumn  = isIdentityRaw === "1";
        let isTimeStampColumn = dataTypeRaw == "timestamp";

        if(isComputedColumn || isIdentityColumn || isTimeStampColumn)
            continue;

        const separator = (columnIndex === 0) ? " " : ",";
        
        columsScriptPart.push("\t\t" + separator + "[" + rowData[colNameOrdinal].displayValue + "]"
                    + "="
                    + sqlUtils.getColTypeString(
                        rowData[colDataTypeOrdinal].displayValue,
                        rowData[colCharsMaxLenOrdinal].displayValue,
                        rowData[colNumericPrecisionOrdinal].displayValue,
                        rowData[colNumerocScaleOrdinal].displayValue,
                        rowData[colIsNullableOrdinal].displayValue,
                        rowData[colDatetimePrecisionOrdinal].displayValue
                    ));

        columnIndex += 1;
    }

    return fullScript.concat(columsScriptPart).concat(["WHERE <Search Conditions,,>"]).join('\n');
}

function buildFinalScriptMySQL(results, tableCatalog, tableSchema, tableName)
{
    let fullScript = [];
    let columsScriptPart = [];

    fullScript.push(`UPDATE \`${tableSchema}\`.\`${tableName}\` `);
    fullScript.push("SET");

    let columnIndex = 0;

    for (let i= 0; i !== results.rowCount; i++) 
    {
        let rowData = results.rows[i];

        let isComputedRaw = rowData[colComputedOrdinal].displayValue;
        let isIdentityRaw = rowData[colIsIdentityOrdinal].displayValue;
        let dataTypeRaw   = rowData[colDataTypeOrdinal].displayValue;

        let isComputedColumn  = isComputedRaw === "1";
        let isIdentityColumn  = isIdentityRaw === "1";
        let isTimeStampColumn = dataTypeRaw == "timestamp";

        if(isComputedColumn || isIdentityColumn || isTimeStampColumn)
            continue;

        const separator = (columnIndex === 0) ? " " : ",";
        
        columsScriptPart.push("\t\t" + separator + "`" + rowData[colNameOrdinal].displayValue + "`"
                    + "="
                    + sqlUtils.getColTypeString(
                        rowData[colDataTypeOrdinal].displayValue,
                        rowData[colCharsMaxLenOrdinal].displayValue,
                        rowData[colNumericPrecisionOrdinal].displayValue,
                        rowData[colNumerocScaleOrdinal].displayValue,
                        rowData[colIsNullableOrdinal].displayValue,
                        rowData[colDatetimePrecisionOrdinal].displayValue
                    ));

        columnIndex += 1;
    }

    return fullScript.concat(columsScriptPart).concat(["WHERE <Search Conditions,,>"]).join('\n');
}

module.exports.getSqlScriptAsUpdateAsync = getSqlScriptAsUpdateAsync;