"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be {title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle}
   * */

  static async create({ title, salary, equity, companyHandle}) {

    const result = await db.query(
      `INSERT INTO jobs(
          title,
          salary,
          equity,
          company_handle
          )
           VALUES
             ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        companyHandle,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all jobs
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * Accepts optional filter object with title, minSalary, hasEquity.
   * If provided, will filter results. Else, will return all jobs.
   * */

  static async findAll(filter) {
      let where = '';
      let values = [];
      if (filter) {
        if(filter["hasEquity"] === "true"){
          filter["hasEquity"] = true;
        } else{
          (filter["hasEquity"] = false);
        }

        const filteredData = Job._sqlForFilteredJobData(filter)
        where = "WHERE " + filteredData.filterCols;
        values = filteredData.values;
      }

      console.log("where, values", where, values);

      // console.log("filteredData ", filteredData);

      const jobsFiltered = await db.query(
        `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
          FROM jobs
          ${where}
          ORDER BY title
        `,
        values
        );
      return jobsFiltered.rows;
    }


  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * Updating a job never changes ID / companyHandle
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Takes id and Data Object.
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {}); // passing in an empty object since no snake_case col names to be updated
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

  /**
 * Takes an object (from query params) to be changed into a SQL WHERE clause for
 * Job filtering
 * Returns a Object with a string of 'AND' separated values
 * filterCols -> names of columns we are filtering on (title, salary, equity)
 * values -> values to filter those columns on
 *
 * ex://
 * {
 *    title : "net",
 *    minSalary : 300,
 *    hasEquity : true
 * }
 *
 * Return:
 * {
 *    filterCols: `"title" ILIKE $1 AND "salary" >= $2 AND "equity" > 0`,
      values: ['%net%', 300]
 * }
 *
 */

  static _sqlForFilteredJobData(dataToFilter) {
    const keys = Object.keys(dataToFilter);
    if (keys.length === 0) throw new BadRequestError("No data");

    const cols = [];
    const vals = [];
      if ("title" in dataToFilter) {
        vals.push(`%${dataToFilter["title"]}%`);
        cols.push(`"title" ILIKE $${vals.length}`);
      }
      if ("minSalary" in dataToFilter) {
        vals.push(dataToFilter["minSalary"]);
        cols.push(`"salary" >= $${vals.length}`);
      }
      if ("hasEquity" in dataToFilter && dataToFilter["hasEquity"] === true) {
        cols.push(`"equity" > 0`);
      } else {
        cols.push(`"equity" >= 0`);
      }

      return {
        filterCols: cols.join(" AND "), //things passed into WHERE clause
        values: vals //parameters
      };
};

};


module.exports = Job;