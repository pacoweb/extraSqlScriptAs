'use strict';

const sqlUtils = require('./scriptSqlUtils.js');

const colNameOrdinal = 0;
const defaultNoQueryText = "[FAILED TO RESOLVE QUERY TEXT]";
const defaultNoParamText = "[FAILED TO RESOLVE PARAM TEXT]";

async function getSqlScriptAsDropAndCreateStoredProcedureAsync(
  connectionProfile,
  tableCatalog,
  tableSchema,
  routineName
) {
  let provider = connectionProfile.providerName;
  let queryText = defaultNoQueryText;
  let paramText = defaultNoParamText;

  if (provider === "MSSQL") 
  {
    queryText = sqlUtils.getRoutineInfoQuerySql(tableCatalog, tableSchema, routineName);
  }
  else if (provider === "MySQL") 
  {
    queryText = sqlUtils.getRoutineInfoQueryMySql(tableCatalog, tableSchema, routineName);
    paramText = sqlUtils.getRoutineParamsQueryMySql(tableCatalog, tableSchema, routineName);
  }

  let results = await sqlUtils.getResultsFromQuerySql(connectionProfile, provider, queryText);
  
  if (!results || results.rowCount === 0) {
    throw "No query results returned";
  }

  let updateSqlScript = "...";

  if (provider === "MSSQL") 
  {
    updateSqlScript = buildFinalScriptMSSQL(results, tableCatalog, tableSchema, routineName);
  }
  else if (provider === "MySQL") 
  {
    const paramResults = await sqlUtils.getResultsFromQuerySql(connectionProfile, provider, paramText);

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
  const fullScript = [];
  const columsScriptPart = [];

  const firstRow = results.rows[0];
  const definerRaw = firstRow[3].rawObject;
  const dataAccessRaw = firstRow[5].rawObject;
  const commentRaw = firstRow[8].rawObject;

  fullScript.push(`DROP PROCEDURE IF EXISTS \`${routineName}\`;\n\n`);
  fullScript.push(`CREATE DEFINER=\`${definerRaw}\` PROCEDURE \`${routineName}\`(`);

  for (let i = 0; i !== paramResults.rowCount; i++) 
  {
    const rowData = paramResults.rows[i];
    const charMaxLenRaw = rowData[3].rawObject;
    const charMaxLenPart = charMaxLenRaw == null || charMaxLenRaw.toLowerCase() == "null" ? "" : `(${charMaxLenRaw})`;

    const isFirstRow = i === 0;
    const isLastRow  = i === paramResults.rowCount - 1;
    const comma = isLastRow ? "" : ",";

    if(isFirstRow){
      columsScriptPart.push(`\n`);
    }

    columsScriptPart.push(
      `  ${rowData[0].rawObject} ${rowData[1].rawObject} ${rowData[2].rawObject}${charMaxLenPart}${comma} \n`
    );

  }

  fullScript.push(`)`);

  if(dataAccessRaw){
    fullScript.push(`\n${dataAccessRaw}\n`);
  }

  if(commentRaw){
    fullScript.push(`\nCOMMENT '${commentRaw}'\n`);
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
