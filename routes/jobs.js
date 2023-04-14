"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login and admin
 */

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobNewSchema,
    {required: true}
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity
 *
 * Authorization required: none
 */

//TODO: come back to this after filter

router.get("/", async function (req, res, next) {
  let jobs;
  const searchQuery = req.query;
  // if ("minEmployees" in searchQuery
  //   && "maxEmployees" in searchQuery
  //   && parseInt(searchQuery.minEmployees) > parseInt(searchQuery.maxEmployees)) {
  //     throw new BadRequestError(
  //       "minEmployees cannot be greater than maxEmployees"
  //     );
  //   }

  if (!Object.keys(searchQuery).length){
    jobs = await Job.findAll();
  } else {
      const validFilters = ["title", "minSalary", "hasEquity"]
      const filterData = {};
      for (let filter in searchQuery){
        if (validFilters.includes(filter)) {
          filterData[filter] = searchQuery[filter];
        } else {
          throw new BadRequestError(
            "only filter on title, minSalary, hasEquity"
      );
    }
  }
  jobs = await Job.findAll(filterData);
  console.log("jobs=", jobs);
}

  return res.json({ jobs });
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login and admin
 */

router.patch("/:id",
                ensureLoggedIn,
                ensureAdmin,
                async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobUpdateSchema,
    {required:true}
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.update(req.params.id, req.body);
  return res.json({ job });
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login and admin
 */

router.delete("/:id",
                  ensureLoggedIn,
                  ensureAdmin,
                  async function (req, res, next) {
  await Job.remove(req.params.id);
  return res.json({ deleted: req.params.id });
});


module.exports = router;
