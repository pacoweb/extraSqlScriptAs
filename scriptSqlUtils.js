
const azdata = require('azdata');

function getRoutineInfoQuerySql(tableCatalog, tableSchema, routineName) {
  return `USE [${tableCatalog}]
        EXEC sp_helptext '${tableSchema}.${routineName}'`;
}

function getDeleteSqlScript(tableCatalog, tableSchema, tableName)
{
    return `DELETE FROM [${tableCatalog}].[${tableSchema}].[${tableName}]
    WHERE <Search Conditions,,>`;
}

function getColumnInfoQuerySql(tableCatalog, tableSchema, tableName)
{
    return `SELECT 
        COL.COLUMN_NAME,
        COL.DATA_TYPE,
        COL.CHARACTER_MAXIMUM_LENGTH,
        COL.NUMERIC_PRECISION,
        COL.NUMERIC_SCALE,
        COL.IS_NULLABLE,
		SYS_COLS.SUB_ISIDENTITY IS_IDENTITY,
		SYS_COLS.SUB_ISCOMPUTED IS_COMPUTED,
        COL.DATETIME_PRECISION
        FROM [${tableCatalog}].INFORMATION_SCHEMA.TABLES T
        INNER JOIN [${tableCatalog}].INFORMATION_SCHEMA.COLUMNS COL ON COL.TABLE_NAME = T.TABLE_NAME AND COL.TABLE_SCHEMA = T.TABLE_SCHEMA
		INNER JOIN 
		(
		  SELECT 
			cc.name as SUB_COLNAME
			,cc.is_identity as SUB_ISIDENTITY
			,cc.is_computed as SUB_ISCOMPUTED
		  FROM
          [${tableCatalog}].SYS.columns CC
		  inner join  [${tableCatalog}].SYS.tables TT 
		  on CC.object_id = TT.object_id
		  inner join [${tableCatalog}].SYS.schemas SS 
		  on TT.schema_id = SS.schema_id
		  WHERE SS.name = '${tableSchema}' and TT.name = '${tableName}'
		) SYS_COLS ON
			COL.COLUMN_NAME = SYS_COLS.SUB_COLNAME 
        WHERE 
        T.TABLE_TYPE = 'BASE TABLE'
        AND T.TABLE_SCHEMA = '${tableSchema}' 
        AND T.TABLE_CATALOG = '${tableCatalog}' 
        AND T.TABLE_NAME = '${tableName}' 
        ORDER BY COL.ORDINAL_POSITION`;
}

async function getResultsFromQuerySql(connectionProfile, providerText, queryText) 
{
    let connectionResult = await azdata.connection.connect(connectionProfile, false, false);
    let connectionUri = await azdata.connection.getUriForConnection(connectionResult.connectionId);

    let queryProvider = azdata.dataprotocol.getProvider(providerText, azdata.DataProviderType.QueryProvider);

    return await queryProvider.runQueryAndReturn(connectionUri, queryText);
}

function getColTypeString (dataType, charMaxLen, numericPrecision, numericScale, isNullable, datetimePrecision)
{
    const scaleDataTypes = ["decimal", "numeric"];
    const precisionDataTypes = ["time", "datetimeoffset", "datetime2"];
    const maxLenDataTypes = ["char", "nchar", "varchar", "nvarchar", "varbinary"];

    let typeParts = [];

    typeParts.push("<");
    typeParts.push(dataType);

    if(maxLenDataTypes.includes(dataType))
    {
        typeParts.push("(");
        
        if(charMaxLen === "-1")
            typeParts.push("MAX");
        else
            typeParts.push(charMaxLen);

        typeParts.push(")"); 
    }  

    if(precisionDataTypes.includes(dataType) || scaleDataTypes.includes(dataType))
    {
        typeParts.push("(");
        
        if(numericPrecision === "NULL")
            typeParts.push(datetimePrecision);
        else
            typeParts.push(numericPrecision);

        if(numericScale !== "NULL" && numericScale === "0"){
            typeParts.push(",");
            typeParts.push(numericScale);
        }

        typeParts.push(")"); 
    }  

    if(isNullable === "YES")
    {
        typeParts.push(", NULLABLE"); 
    }

    typeParts.push(">");

    return typeParts.join('');
}

module.exports.getRoutineInfoQuerySql = getRoutineInfoQuerySql;
module.exports.getResultsFromQuerySql = getResultsFromQuerySql;
module.exports.getColTypeString = getColTypeString;
module.exports.getColumnInfoQuerySql = getColumnInfoQuerySql;
module.exports.getDeleteSqlScript = getDeleteSqlScript;