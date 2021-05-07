/**
 * Python style range function.
 * @returns {number[]}
 */
export const range = (a, b, c) =>
	new Array(~~((!b ? a : b - a) / (c || 1) + 0.5))
		.fill()
		.map((_, i) => i * (c || 1) + (!b ? 0 : a));

/**
 * Unflaten matrix.
 * @param {Array} arr
 * @param {number} width
 * @returns {Array[]}
 */
export const to2d = (arr, width) =>
    range(arr.length / width)
        .map((_, i) => range(width)
            .map((_, j) => arr[(i * width) + j]));



// Lazy... i know...
const zigzagPath = [
    [0, 0], //--
    [1, 0],
    [0, 1], //--

    [0, 2], //--
    [1, 1],
    [2, 0], //--

    [3, 0], //--
    [2, 1],
    [1, 2],
    [0, 3], //--

    [0, 4], //--
    [1, 3],
    [2, 2],
    [3, 1],
    [4, 0], //--

    [5, 0], //--
    [4, 1],
    [3, 2],
    [2, 3],
    [1, 4],
    [0, 5], //--

    [0, 6], //--
    [1, 5],
    [2, 4],
    [3, 3],
    [4, 2],
    [5, 1],
    [6, 0], //--

    [7, 0], //--
    [6, 1],
    [5, 2],
    [4, 3],
    [3, 4],
    [2, 5],
    [1, 6],
    [0, 7], //--

    [1, 7], //--
    [2, 6],
    [3, 5],
    [4, 4],
    [5, 3],
    [6, 2],
    [7, 1], //--

    [7, 2], //--
    [6, 3],
    [5, 4],
    [4, 5],
    [3, 6],
    [2, 7], //--

    [3, 7], //--
    [4, 6],
    [5, 5],
    [6, 4],
    [7, 3], //--

    [7, 4], //--
    [6, 5],
    [5, 6],
    [4, 7], //--

    [5, 7], //--
    [6, 6],
    [7, 5], //--

    [7, 6], //--
    [6, 7], //--

    [7, 7], //--
];

export const zigzag = (mtx) => zigzagPath.map(([x, y]) => mtx[x][y]);

export const rle = (data) => {
    let out = [
            /* [curr, count] */
        ],
        iter = -1;

    data.forEach((x) => {
        if (typeof out[iter] != 'undefined' && x === out[iter][0]) {
            out[iter][1]++;
        } else {
            iter++;
            out.push([x, 1]);
            out[iter][1]++;
        }
    });

    return out;
};