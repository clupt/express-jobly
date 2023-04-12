const {sqlForFilteredData} = require("./filter");
const { BadRequestError } = require("../expressError");

describe("sqlForFilteredData", function () {
    test("works, all data provided", function () {
        const validData = {
            nameLike : "net",
            minEmployees : 3,
            maxEmployees : 5
        }
        const jsToSql = {
            nameLike: "name",
            minEmployees: "num_employees",
            maxEmployees : "num_employees"};
        const result = sqlForFilteredData(validData, jsToSql);

        expect(result).toEqual({
            filterCols: `"name" ILIKE $1 AND "num_employees" >= $2 AND "num_employees" <= $3`,
            values: ['%net%', 3, 5]});
    });

    test("works, some data provided", function () {
        const validData = {
            minEmployees : 3,
        }
        const jsToSql = {
            nameLike: "name",
            minEmployees: "num_employees",
            maxEmployees : "num_employees"};
        const result = sqlForFilteredData(validData, jsToSql);

        expect(result).toEqual({
            filterCols: `"num_employees" >= $1`,
            values: [3]});
    });

    test("fails: empty filter object", function () {
        const invalidData = {};
        const jsToSql = {
            nameLike: "name",
            minEmployees: "num_employees",
            maxEmployees : "num_employees"};

        try {
            sqlForFilteredData(invalidData, jsToSql);
            throw new Error("fail test");
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    })
})