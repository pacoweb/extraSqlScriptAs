'use strict';

const sqlUtils = require('./scriptSqlUtils.js');

const colNameOrdinal = 0;

async function getSqlScriptAsDropAndCreateFunctionAsync(
  connectionProfile,
  tableCatalog,
  tableSchema,
  routineName
) {
  let queryText = sqlUtils.getRoutineInfoQuerySql(
    tableCatalog,
    tableSchema,
    routineName
  );

  let results = await sqlUtils.getResultsFromQuerySql(
    connectionProfile,
    "MSSQL",
    queryText
  );

  if (!results || results.rowCount === 0) {
    throw "No query results returned";
  }

  let updateSqlScript = buildFinalScript(
    results,
    tableCatalog,
    tableSchema,
    routineName
  );

  return updateSqlScript;
}

function buildFinalScript(results, tableCatalog, tableSchema, routineName) {
  let fullScript = [];
  let columsScriptPart = [];

  fullScript.push(`DROP FUNCTION IF EXISTS [${tableSchema}].[${routineName}];\n`);
  fullScript.push(`GO \n\n`);

  fullScript.push(`SET ANSI_NULLS ON;\n`);
  fullScript.push(`SET QUOTED_IDENTIFIER ON;\n`);
  fullScript.push(`GO \n\n`);



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

module.exports.getSqlScriptAsDropAndCreateFunctionAsync =
  getSqlScriptAsDropAndCreateFunctionAsync;
