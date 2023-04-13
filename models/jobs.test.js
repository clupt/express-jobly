"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "newJob",
    salary: 400,
    equity: 0.4,
    companyHandle: 'c1',
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "newJob",
      salary: 400,
      equity: "0.4",
      companyHandle: 'c1',
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'newJob'`);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "newJob",
        salary: 400,
        equity: "0.4",
        companyHandle: 'c1',
      },
    ]);
  });
});

// /************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0.3",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: filter", async function () {
    const filterData = {
      title : "1",
      minSalary : 100,
      hasEquity : true
    }
    let jobs = await Job.findAll(filterData);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100,
        equity: "0.1",
      }
    ]);
    })
  });

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const jobQuery = await db.query(
      `SELECT id
      FROM jobs
      WHERE title LIKE '%j1%'
    `);
    const jobId = jobQuery.rows[0].id;
    let job = await Job.get(jobId);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "j1",
      salary: 100,
      equity: "0.1",
      companyHandle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 400,
    equity: "0.4",
  };

  test("works", async function () {
    const jobQuery = await db.query(
      `SELECT id
      FROM jobs
      WHERE title LIKE '%j1%'
    `);
    const jobId = jobQuery.rows[0].id;

    let job = await Job.update(jobId, updateData);
    expect(job).toEqual({
      id: jobId,
      companyHandle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${jobId}`);
    expect(result.rows).toEqual([{
      id: jobId,
      title: "New",
      salary: 400,
      equity: "0.4",
      companyHandle: "c1",
    }]);
  });

  test("works: null fields", async function () {
    const jobQuery = await db.query(
      `SELECT id
      FROM jobs
      WHERE title LIKE '%j1%'
    `);
    const jobId = jobQuery.rows[0].id;

    const updateDataSetNulls = {
      title: "Updated",
      salary: null,
      equity: null,
    };

    let job = await Job.update(jobId, updateDataSetNulls);
    expect(job).toEqual({
      id: jobId,
      companyHandle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id =${jobId}`);
    expect(result.rows).toEqual([{
      id: jobId,
      title: "Updated",
      salary: null,
      equity: null,
      companyHandle: "c1",
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    const jobQuery = await db.query(
      `SELECT id
      FROM jobs
      WHERE title LIKE '%j1%'
    `);
    const jobId = jobQuery.rows[0].id;

    try {
      await Job.update(jobId, {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const jobQuery = await db.query(
      `SELECT id
      FROM jobs
      WHERE title LIKE '%j1%'
    `);
    const jobId = jobQuery.rows[0].id;


    await Job.remove(jobId);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${jobId}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
