"use strict";
const { BadRequestError, NotFoundError } = require("../expressError");
/**
 * Takes an object (from query params) some jsToSql to be changed
 * Returns a Object with a string of '&' separated values
 * filterCols -> names of columns we are filtering on
 * values -> values to filter those columns on
 *
 * ex://
 * {
 *    nameLike : "net",
 *    minEmployees : 3,
 *    maxEmployees : 5
 * }
 *
 * Return:
 * {
 *     filterCols: `name=$1 AND num_employees=$2`
 *     values: ['net', '3', '5']
 * }
 *
 */

function sqlForFilteredData(dataToFilter, jsToSql) {
  const keys = Object.keys(dataToFilter);
  if (keys.length === 0) throw new BadRequestError("No data");

  const cols = [];
  const vals = [];
  for (let idx = 0; idx < keys.length; idx++) {
    if (dataToFilter?.nameLike) {
      cols.push(`"${jsToSql[colName] || colName}" ILIKE $%${idx + 1}%`);
      vals.push(dataToFilter[keys[idx]]);
    }
    if (dataToFilter?.minEmployees) {
      cols.push(`"${jsToSql[colName] || colName}" >= $${idx + 1}`);
      vals.push(dataToFilter[keys[idx]]);
    }
    if (dataToFilter?.maxEmployees) {
      cols.push(`"${jsToSql[colName] || colName}" <= $${idx + 1}`);
      vals.push(dataToFilter[keys[idx]]);
    }
  }

  return {
    filterCols: cols.join(" AND "), //things passed into WHERE clause
    values: vals //parameters
  };
}

module.exports = { sqlForFilteredData };