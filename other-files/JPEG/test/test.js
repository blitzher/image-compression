import { range, to2d, zigzag, rle } from '../src/utility.mjs';
import { assert } from 'chai';
import { mdDct2, mdDct3 } from '../src/dct.mjs';
import { GPU } from 'gpu.js';
import { rgb2yCbCr } from '../src/colour.mjs';
import { getChannel } from '../src/colour.mjs';


const mtxCloseTo = (actual, expected, delta) => {
    actual.forEach((x, i) =>
        x.forEach((y, j) => {
            assert.closeTo(y, expected[i][j], delta)
        }));
};

const prettyTable = (mtx, padding, leftPadding) =>
    `${range(leftPadding).map(() => ' ').join('')}[${mtx.map((x) =>
        `[${x.map((y) => y.toString().padStart(padding))}]`
    ).join(`,\n ${range(leftPadding).map(() => ' ').join('')}`)}]`;


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

        it(`to2d([${arr}],${width})\t-->\t[${expected.map(x => `[${x}]`)}]`, function () {
            const res = to2d(arr, width);
            assert.deepStrictEqual(res, expected);
        });
    });

    describe('zigzag()', function () {
        let
            mtx = [
                [-26, -3, -6, 2, 2, -1, 0, 0],
                [0, -3, 4, 1, 1, 0, 0, 0],
                [-3, 1, 5, -1, -1, 0, 0, 0],
                [-4, 1, 2, -1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
            ],
            expected = [
                -26, 0, -3, -6, -3, -3, -4, 1, 4, 2, 2, 1,
                5, 1, 1, 0, 0, 2, -1, 1, -1, 0, 0, -1,
                -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0
            ];


        it(`zigzag(\n${prettyTable(mtx, 3, 10)}\n\t)\n\t\t-->\t${expected}`, function () {
            const res = [...zigzag(mtx)];
            assert.deepStrictEqual(res, expected);
        });
    });

    describe('rle()', function () {
        const
            args = [
                -26, 0, -3, -6, -3, -3, -4, 1, 4, 2, 2, 1,
                5, 1, 1, 0, 0, 2, -1, 1, -1, 0, 0, -1,
                -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0
            ],
            expected = [
                [-26, 2], [0, 2], [-3, 2],
                [-6, 2], [-3, 3], [-4, 2],
                [1, 2], [4, 2], [2, 3],
                [1, 2], [5, 2], [1, 3],
                [0, 3], [2, 2], [-1, 2],
                [1, 2], [-1, 2], [0, 3],
                [-1, 3], [0, 40]
            ];

        it(`rle([${args}])\n\t\t-->\t[${expected.map(x => `[${x}]`)}]`, function () {
            const res = [...rle(args)];
            assert.deepStrictEqual(res, expected);
        })
    });
});

describe('DCT', function () {
    describe(`mdDct2()`, function () {
        let
            argMtx = [
                [140, 144, 147, 140, 140, 155, 179, 175],
                [144, 152, 140, 147, 140, 148, 167, 179],
                [152, 155, 136, 167, 163, 162, 152, 172],
                [168, 145, 156, 160, 152, 155, 136, 160],
                [162, 148, 156, 148, 140, 136, 147, 162],
                [147, 167, 140, 155, 155, 140, 136, 162],
                [136, 156, 123, 167, 162, 144, 140, 147],
                [148, 155, 136, 155, 152, 147, 147, 136],
            ],
            expected = [
                [186, -17, 14, -8, 23, -9, -13, -18],
                [20, -34, 26, -9, -10, 10, 13, 6],
                [-10, -23, -1, 6, -18, 3, -20, 0],
                [-8, -5, 14, -14, -8, -2, -3, 8],
                [-3, 9, 7, 1, -11, 17, 18, 15],
                [3, -2, -18, 8, 8, -3, 0, -6],
                [8, 0, -2, 3, -1, -7, -1, -1],
                [0, - 7, - 2, 1, 1, 4, - 6, 0]
            ];

        it(`mdDct2()\t-->\n${prettyTable(expected, 3, 10)}`, function () {
            const res = mdDct2(argMtx, new GPU());
            mtxCloseTo(res, expected, 1);
        });
    });
});

describe('Colour', function () {
    describe('rgb2yCbCr([r, g, b])', function () {
        let args = [134, 189, 211],
            expected = [166, 146, 102]; // http://www.picturetopeople.org/p2p/image_utilities.p2p/color_converter?color_space=RGB&color_channel1=134&color_channel2=189&color_channel3=211&ResultType=view

        it(`[${args}] --> [${expected}]`, function () {
            const res = rgb2yCbCr(args);
            assert.deepEqual(res, expected);
        });
    });

    describe('getChannel([r,g,b,a,r,g,b,a,...], index)', function () {
        const
            data = [0, 1, 2, 3, 0, 1, 2, 3],
            tests = [
                { arg: 0, expected: [0, 0] },
                { arg: 1, expected: [1, 1] },
                { arg: 2, expected: [2, 2] },
                { arg: 3, expected: [3, 3] },
            ];


        tests.forEach(({ arg, expected }) => {
            it(`getChannel([${data}], ${arg})\t-->\t[${expected}]`, function () {
                const res = [...getChannel(data, arg, new GPU())];
                assert.deepStrictEqual(res, expected);
            });
        });
    })
})