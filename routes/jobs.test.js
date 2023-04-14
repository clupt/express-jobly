"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "newJob",
    salary: 400,
    equity: 0.4,
    companyHandle: 'c1',
  };

  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "newJob",
        salary: 400,
        equity: "0.4",
        companyHandle: 'c1',
      },
    });
  });

  test("fails for non-admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("fails for anon", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 300,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        equity: 4,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

/** GET /jobs without filtering */
describe("GET /jobs", function () {
  test("ok for anon without filtering", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
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
        ],
    });
  });
});

/************************************** GET /jobs/:id */
//TODO: how to get j1Id from _testCommon?

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/j1`);
    expect(resp.body).toEqual({
      job: {
        handle: "j1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});