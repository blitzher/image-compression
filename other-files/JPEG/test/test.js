import { range, to2d } from '../src/utility.mjs';
import assert from 'assert';
/*describe('Array', function() {
    describe('#indexOf()', function() {
        it('should return -1 when the value is not present', function() {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });
    });
});*/

describe('Utility', function () {
    describe('range()', function () {
        const tests = [
            { args: [5], expected: [0, 1, 2, 3, 4] },
            { args: [5, 10], expected: [5, 6, 7, 8, 9] },
            { args: [5, 10, 2], expected: [5, 7, 9] }
        ];

        tests.forEach(({ args, expected }) => {
            it(`range(${args})\t-->\t[${expected}]`, function () {
                const res = range(...args);
                assert.deepStrictEqual(res, expected);
            });
        });
    });

    describe('to2d()', function () {
        let arr = [1, 2, 3, 4],
            width = 2,
            expected = [[1, 2], [3, 4]];

        it(`to2d([${arr}],${width})\t-->\t[${expected.map(x=>`[${x}]`)}]`, function () {
            const res = to2d(arr, width);
            assert.deepStrictEqual(res, expected);
        });
    });
});