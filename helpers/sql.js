const { BadRequestError } = require("../expressError");

/** Converts data object to SQL compatible object with parameterization.
 *
 *  Takes dataToUpdate object and jsToSql object which assigns camel case
 *  column names to snake case column names.
 *
 *  Returns object with parametized table column names as keys and values to
 *  insert as values.
 *
 *  Ex. {name: "Apple", description: "Computers.", numEmployees: 100},
 *      {numEmployees: "num_employees"}
 *
 * --> {
            setCols: '"name"=$1, "description"=$2, "num_employees"=$3',
            values: ["Apple", "Computers.", 100]
        };
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
