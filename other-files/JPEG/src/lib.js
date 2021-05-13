
/**
 *
 * @param srcArr
 * @param index
 * @param GPU
 * @returns
 */
const getChannel = (srcArr, index, GPU) => {
    const gpu = GPU || new GPU();
    const channel = gpu.createKernel(function (arr, i) {
        return arr[this.thread.x * 4 + i];
    }).setOutput([srcArr.length / 4]);

    return channel(srcArr, index);
};

// Equation taken from https://sistenix.com/rgb2ycbcr.html
const rgb2yCbCr = ([r, g, b]) => [
    Math.round(16 + (65.738 * r) / 256 + (129.057 * g) / 256 + (25.064 * b) / 256),
    Math.round(128 - (37.945 * r) / 256 - (74.494 * g) / 256 + (112.439 * b) / 256),
    Math.round(128 + (112.439 * r) / 256 - (94.154 * g) / 256 - (18.285 * b) / 256),
];

/**
 * Python style range function.
 * @returns {number[]}
 */
const range = (a, b, c) =>
	new Array(~~((!b ? a : b - a) / (c || 1) + 0.5))
		.fill()
		.map((_, i) => i * (c || 1) + (!b ? 0 : a));

/**
 * Unflaten matrix.
 * @param {Array} arr
 * @param {number} width
 * @returns {Array[]}
 */
const to2d = (arr, width) =>
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

const zigzag = (mtx) => zigzagPath.map(([x, y]) => mtx[x][y]);

const rle = (data) => {
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

const toComps = (mtx) => {
    let out = range(Math.floor(mtx.length / 8)).map(()=> range(Math.floor(mtx[0].length / 8)));

    for (let i = 0; i < out.length; i++) {
        for (let j = 0; j < out[0].length; j++) {
            let tmp = range(8).map(() => range(8));

            for (let x = 0; x < 8; x++) {
                for (let y = 0; y < 8; y++) {
                    tmp[x][y] = mtx[x + i * 8][y + j * 8];
                }
            }

            out[i][j] = tmp;
        }
    }

    return out;
}

const mtxApply = (mtx, fn) => mtx.map(x => x.map(y => fn(y)));

// GPU accelerated DCT2 transform.


/**
 * MD-DCT2 function using GPU.js for parallel computations.
 * TODO: Compute cosines outside function. Have "gpu" be an argument.
 * @param {number[][]} mtx Input 8x8 pixel block.
 * @returns {number[][]}
 */
const mdDct2 = (mtx, GPU) => {
    const gpu = GPU || new GPU(); // New GPU.js instance for computations.

    const cosines = gpu
        .createKernel(function () {
            let u = this.thread.x,
                x = this.thread.y;

            function C(n) {
                if (n == 0) {
                    return 1 / Math.SQRT2;
                } else {
                    return 1;
                }
            }

            function cosine(a, b) {
                return Math.cos(((2 * a + 1) * b * Math.PI) / (2 * 8));
            }

            return C(u) * cosine(x, u);
        })
        .setOutput([8, 8]);

    const dct = gpu
        .createKernel(function (mtx, cosines) {
            let localSum = 0.0;

            for (let u = 0; u < 8; u++) {
                for (let v = 0; v < 8; v++) {
                    localSum +=
                        mtx[v][u] *
                        cosines[u][this.thread.x] *
                        cosines[v][this.thread.y];
                }
            }

            return Math.round((1 / Math.sqrt(2 * 8)) * localSum) % 256;
        })
        .setOutput([8, 8]);

    return gpu.combineKernels(cosines, dct, function (mtx) {
        return dct(mtx, cosines());
    })(mtx);
};

/**
 *
 * @param mtx
 * @returns
 */
const mdDct3 = (mtx) => {
    const gpu = new GPU();

    const cosines = gpu
        .createKernel(function () {
            let u = this.thread.x,
                x = this.thread.y;

            function C(n) {
                if (n == 0) {
                    return 1 / Math.SQRT2;
                } else {
                    return 1;
                }
            }

            function cosine(a, b) {
                return Math.cos(((2 * a + 1) * b * Math.PI) / (2 * 8));
            }

            return C(u) * cosine(x, u);
        })
        .setOutput([8, 8]);

    const dct = gpu
        .createKernel(function (mtx, cosines) {
            let localSum = 0.0;

            for (let u = 1; u < 8; u++) {
                for (let v = 1; v < 8; v++) {
                    localSum +=
                        mtx[v][u] *
                        cosines[u][this.thread.x] *
                        cosines[v][this.thread.y];
                }
            }

            return Math.round(mtx[0][0] / Math.SQRT2 + localSum);
        })
        .setOutput([8, 8]);

    return gpu.combineKernels(cosines, dct, function (mtx) {
        return dct(mtx, cosines());
    })(mtx);
};

const quantise = (mtx, Gpu) => {
    const gpu = Gpu || new GPU();

    let table = [
        [16, 11, 10, 16, 24, 40, 51, 61],
        [12, 12, 14, 19, 26, 58, 60, 55],
        [14, 13, 16, 24, 40, 57, 69, 56],
        [14, 17, 22, 29, 51, 87, 80, 62],
        [18, 22, 37, 56, 68, 109, 103, 77],
        [24, 35, 55, 64, 81, 104, 113, 92],
        [49, 64, 78, 87, 103, 121, 120, 101],
        [72, 92, 95, 98, 112, 100, 103, 99],
    ];

    return gpu
        .createKernel(function (a, b) {
            let x = this.thread.x,
                y = this.thread.y;

            return Math.round(a[x][y] / b[x][y]);
        })
        .setOutput([8, 8])(mtx, table);
};

const revertQuantise = (mtx) => {
    const gpu = new GPU();

    let table = [
        [16, 11, 10, 16, 24, 40, 51, 61],
        [12, 12, 14, 19, 26, 58, 60, 55],
        [14, 13, 16, 24, 40, 57, 69, 56],
        [14, 17, 22, 29, 51, 87, 80, 62],
        [18, 22, 37, 56, 68, 109, 103, 77],
        [24, 35, 55, 64, 81, 104, 113, 92],
        [49, 64, 78, 87, 103, 121, 120, 101],
        [72, 92, 95, 98, 112, 100, 103, 99],
    ];

    return gpu
        .createKernel(function (a, b) {
            let x = this.thread.x,
                y = this.thread.y;

            return Math.round(a[x][y] * b[x][y]);
        })
        .setOutput([8, 8])(mtx, table);
};


