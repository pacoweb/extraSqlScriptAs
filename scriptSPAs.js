'use strict';

const sqlUtils = require('./scriptSqlUtils.js');

const colNameOrdinal = 0;

async function getSqlScriptAsDropAndCreateStoredProcedureAsync(
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

  fullScript.push(`IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[${tableCatalog}].[${tableSchema}].[${routineName}]') AND type in (N'P', N'PC')) `);
    
    fullScript.push(`DROP PROCEDURE [${tableSchema}].[${routineName}] `);
    fullScript.push(`GO \n`);

    fullScript.push(`SET ANSI_NULLS ON `);
    fullScript.push(`GO \n`);

    fullScript.push(`SET QUOTED_IDENTIFIER ON `);
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

module.exports.getSqlScriptAsDropAndCreateStoredProcedureAsync =
  getSqlScriptAsDropAndCreateStoredProcedureAsync;