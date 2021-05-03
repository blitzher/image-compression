/**
 * Python style range function.
 * @returns {number[]}
 */
export const range = (a, b, c) =>
	new Array(~~((!b ? a : b - a) / (c ?? 1) + 0.5))
		.fill()
		.map((_, i) => i * (c ?? 1) + (!b ? 0 : a));

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