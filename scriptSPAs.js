'use strict';

const sqlUtils = require('./scriptSqlUtils.js');

const colNameOrdinal = 0;

async function getSqlScriptAsDropAndCreateStoredProcedureAsync(
  connectionProfile,
  tableCatalog,
  tableSchema,
  routineName
) {
  let provider = connectionProfile.providerName;
  let queryText = "[FAILED TO RESOLVE QUERY TEXT]";
  let paramText = "[FAILED TO RESOLVE PARAM TEXT]";
  if (provider === "MSSQL") {
    queryText = sqlUtils.getRoutineInfoQuerySql(tableCatalog, tableSchema, routineName);
  }
  else if (provider === "MySQL") {
    queryText = sqlUtils.getRoutineInfoQueryMySql(tableCatalog, tableSchema, routineName);
    paramText = sqlUtils.getRoutineParamsQueryMySql(tableCatalog, tableSchema, routineName);
  }

  let results = await sqlUtils.getResultsFromQuerySql(connectionProfile, provider, queryText);
  let paramResults = await sqlUtils.getResultsFromQuerySql(connectionProfile, provider, paramText);

  if (!results || results.rowCount === 0) {
    throw "No query results returned";
  }

  let updateSqlScript = "...";
  if (provider === "MSSQL") {
    updateSqlScript = buildFinalScriptMSSQL(results, tableCatalog, tableSchema, routineName);
  }
  else if (provider === "MySQL") {
    updateSqlScript = buildFinalScriptMySQL(results, paramResults, tableCatalog, tableSchema, routineName);
  }

  return updateSqlScript;
}

function buildFinalScriptMSSQL(results, tableCatalog, tableSchema, routineName) {
  let fullScript = [];
  let columsScriptPart = [];

  fullScript.push(`DROP PROCEDURE IF EXISTS [${tableSchema}].[${routineName}];\n`);
  fullScript.push(`GO \n\n`);

  fullScript.push(`SET ANSI_NULLS ON;\n`);
  fullScript.push(`SET QUOTED_IDENTIFIER ON;\n`);
  fullScript.push(`GO \n`);

  for (let i = 0; i !== results.rowCount; i++) {
    let rowData = results.rows[i];

    columsScriptPart.push(
      rowData[colNameOrdinal].displayValue
    );
  }

  return fullScript
    .concat(columsScriptPart)
    .join("");
}

function buildFinalScriptMySQL(results, paramResults, tableCatalog, tableSchema, routineName) {
  let fullScript = [];
  let columsScriptPart = [];

  fullScript.push(`DROP PROCEDURE IF EXISTS \`${routineName}\`;\n\n`);
  fullScript.push(`CREATE DEFINER=\`${results.rows[0][3].rawObject}\` PROCEDURE \`${routineName}\`(`);
  if (paramResults.rowCount === 0) {
    fullScript.push(`)`);
  }

  for (let i = 0; i !== paramResults.rowCount; i++) {
    fullScript.push(`\n`);
    let rowData = paramResults.rows[i];

    if (i === paramResults.rowCount - 1) {
      columsScriptPart.push(
        `  ${rowData[0].rawObject} ${rowData[1].rawObject} ${rowData[2].rawObject}(${rowData[3].rawObject})\n)\n\n`
      );
    } else {
      columsScriptPart.push(
        `  ${rowData[0].rawObject} ${rowData[1].rawObject} ${rowData[2].rawObject}(${rowData[3].rawObject}), \n`
      );
    }
  }

  for (let i = 0; i !== results.rowCount; i++) {
    let rowData = results.rows[i];

    columsScriptPart.push(
      rowData[colNameOrdinal].displayValue
    );
  }

  return fullScript
    .concat(columsScriptPart)
    .join("");
}

module.exports.getSqlScriptAsDropAndCreateStoredProcedureAsync =
  getSqlScriptAsDropAndCreateStoredProcedureAsync;
