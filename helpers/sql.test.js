"use strict"; 

const {sqlForPartialUpdate} = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
    test("works", function () {
        const validData = {
            name: "Apple", 
            description: "Computers.", 
            numEmployees: 100
        }
        const jsToSql = {numEmployees: "num_employees"};
        const result = sqlForPartialUpdate(validData, jsToSql);

        expect(result).toEqual({
            setCols: '"name"=$1, "description"=$2, "num_employees"=$3',
            values: ["Apple", "Computers.", 100]});
    });

    test("fails: empty update object", function () {
        const invalidData = {};
        const jsToSql = {numEmployees: "num_employees"};

        try {
            sqlForPartialUpdate(invalidData, jsToSql);
            throw new Error("fail test");
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    })
})