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
  adminToken,
  jobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/******************************** assign value to job Id for all future tests */

let j1Id;
let j2Id;
let j3Id;

test("create job Id", async function () {
  j1Id = jobIds[0];
  j2Id = jobIds[1];
  j3Id = jobIds[2];
});

/************************************** POST /jobs */

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
      .send(newJob);
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

/** GET /jobs with filtering */
describe("GET /jobs", function () {

  test("test fails when hasEquity not boolean", async function () {
    const resp = await request(app).get(
      '/jobs/?hasEquity=0'
    );
    expect(resp.statusCode).toEqual(400);
  });

  test("test fails when inappropriate data passed to field", async function () {
    const resp = await request(app).get(
      '/jobs?isHiring=eqfrewq'
    );
    expect(resp.statusCode).toEqual(400);
  });

  test("test for all filtering working", async function () {
    const resp = await request(app).get(
      '/jobs?hasEquity=true&minSalary=2&title=j2'
    );
    expect(resp.body).toEqual(
      {
        jobs: [
          {
            id: expect.any(Number),
            title: "j2",
            salary: 200,
            equity: "0.2",
            companyHandle: "c2",
          }
        ]
      });
  });
});


test("fails: test next() handler", async function () {
  // there's no normal failure event which will cause this route to fail ---
  // thus making it hard to test that the error-handler works with it. This
  // should cause an error, all right :)
  await db.query("DROP TABLE jobs CASCADE");
  const resp = await request(app)
    .get("/jobs")
    .set("authorization", `Bearer ${u1Token}`);
  expect(resp.statusCode).toEqual(500);
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${j1Id}`);
    console.log("j1Id=", j1Id);
    expect(resp.body).toEqual({
      job: {
        id: j1Id,
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id*/

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/jobs/${j1Id}`)
      .send({
        title: "j1-Updated",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: j1Id,
        title: "j1-Updated",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non-admins", async function () {
    const resp = await request(app)
      .patch(`/jobs/${j1Id}`)
      .send({
        title: "J1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/companies/${j1Id}`)
      .send({
        title: "J1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${j1Id}`)
      .send({
        id: 99
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${j1Id}`)
      .send({
        equity: "2",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .delete(`/jobs/${j1Id}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${j1Id}` });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${j1Id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/${j1Id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});