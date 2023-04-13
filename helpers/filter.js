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
 *    filterCols: `"name" ILIKE $1 AND "num_employees" >= $2 AND "num_employees" <= $3`,
      values: ['%net%', 3, 5]
 * }
 *
 */

// TODO: this function isn't really generic. maybe put it as a class method in the companies model
// remove jsToSql and just put what you need for column names
// also don't need the iteration. You're only looking for 3 items and check 
function sqlForFilteredData(dataToFilter, jsToSql) {
  const keys = Object.keys(dataToFilter);
  if (keys.length === 0) throw new BadRequestError("No data");

  const cols = [];
  const vals = [];
  for (let idx = 0; idx < keys.length; idx++) {
    // if ("nameLike" in dataToFilter) {                 // this is a stragegy without the for loop
    //   vals.push(`%${dataToFilter["nameLike"]}%`);      
    //   cols.push(`"${jsToSql[keys[idx]]}" ILIKE ${vals.length}`);
    // }
    if (keys[idx] === "nameLike") {
      cols.push(`"${jsToSql[keys[idx]]}" ILIKE $${idx + 1}`);
      vals.push(`%${dataToFilter[keys[idx]]}%`);
    }
    if (keys[idx] === "minEmployees") {
      cols.push(`"${jsToSql[keys[idx]]}" >= $${idx + 1}`);
      vals.push(dataToFilter[keys[idx]]);
    }
    if (keys[idx] === "maxEmployees") {
      cols.push(`"${jsToSql[keys[idx]]}" <= $${idx + 1}`);
      vals.push(dataToFilter[keys[idx]]);
    }
  }

  return {
    filterCols: cols.join(" AND "), //things passed into WHERE clause
    values: vals //parameters
  };
}

module.exports = { sqlForFilteredData };