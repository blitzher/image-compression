// GPU accelerated DCT2 transform.

/**
 * MD-DCT2 function using GPU.js for parallel computations.
 * TODO: Compute cosines outside function. Have "gpu" be an argument.
 * @param {number[][]} mtx Input 8x8 pixel block.
 * @returns {number[][]}
 */
export const mdDct2 = (mtx, GPU) => {
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

            return Math.round((1 / sqrt(2 * 8)) * localSum) % 256;
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
export const mdDct3 = (mtx) => {
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

export const quantise = (mtx) => {
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

            return Math.round(a[x][y] / b[x][y]);
        })
        .setOutput([8, 8])(mtx, table);
};

export const revertQuantise = (mtx) => {
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
