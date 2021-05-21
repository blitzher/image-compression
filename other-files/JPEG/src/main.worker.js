importScripts('https://unpkg.com/gpu.js@latest/dist/gpu-browser.min.js');

onmessage = (e) => {
    let range = (a, b, c) =>
            new Array(~~((!b ? a : b - a) / (c || 1) + 0.5))
                .fill()
                .map((_, i) => i * (c || 1) + (!b ? 0 : a)),
        gpu = new GPU({ mode: 'cpu' }),
        cosines = gpu.createKernel(
            function () {
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
            },
            {
                output: [8, 8],
            },
        )(),
        mapDct2 = gpu.createKernel(
            function (arr, cosines) {
                let localSum = 0.0;

                for (let u = 0; u < 8; u++) {
                    for (let v = 0; v < 8; v++) {
                        localSum +=
                            arr[this.thread.z][v][u] *
                            cosines[u][this.thread.x] *
                            cosines[v][this.thread.y];
                    }
                }

                return Math.round((1 / Math.sqrt(2 * 8)) * localSum) % 256;
            },
            {
                output: [8, 8, e.data.length],
            },
        ),
        mapQuantise = gpu.createKernel(
            function (arr, table) {
                return Math.round(
                    arr[this.thread.z][this.thread.y][this.thread.x] /
                        table[this.thread.y][this.thread.x],
                );
            },
            {
                output: [8, 8, e.data.length],
            },
        ),
        zigzag = [
            0,
            0,
            1,
            0,
            0,
            1,
            0,
            2,
            1,
            1,
            2,
            0,
            3,
            0,
            2,
            1, //
            1,
            2,
            0,
            3,
            0,
            4,
            1,
            3,
            2,
            2,
            3,
            1,
            4,
            0,
            5,
            0, //
            4,
            1,
            3,
            2,
            2,
            3,
            1,
            4,
            0,
            5,
            0,
            6,
            1,
            5,
            2,
            4, //
            3,
            3,
            4,
            2,
            5,
            1,
            6,
            0,
            7,
            0,
            6,
            1,
            5,
            2,
            4,
            3, //
            3,
            4,
            2,
            5,
            1,
            6,
            0,
            7,
            1,
            7,
            2,
            6,
            3,
            5,
            4,
            4, //
            5,
            3,
            6,
            2,
            7,
            1,
            7,
            2,
            6,
            3,
            5,
            4,
            4,
            5,
            3,
            6, //
            2,
            7,
            3,
            7,
            4,
            6,
            5,
            5,
            6,
            4,
            7,
            3,
            7,
            4,
            6,
            5, //
            5,
            6,
            4,
            7,
            5,
            7,
            6,
            6,
            7,
            5,
            7,
            6,
            6,
            7,
            7,
            7, //
        ],
        serialise = (mtx, path) =>
            range(64).map((i) => mtx[path[i * 2]][path[i * 2 + 1]]),
        rle = (data) => {
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
                }
            });

            return out;
        };

    let defaultTable = [
            [16, 11, 10, 16, 24, 40, 51, 61],
            [12, 12, 14, 19, 26, 58, 60, 55],
            [14, 13, 16, 24, 40, 57, 69, 56],
            [14, 17, 22, 29, 51, 87, 80, 62],
            [18, 22, 37, 56, 68, 109, 103, 77],
            [24, 35, 55, 64, 81, 104, 113, 92],
            [49, 64, 78, 87, 103, 121, 120, 101],
            [72, 92, 95, 98, 112, 100, 103, 99],
        ],
        dctBlocks = mapDct2(e.data, cosines),
        qBlocks = mapQuantise(dctBlocks, defaultTable),
        zzBlocks = qBlocks.map((block) => serialise(block, zigzag)),
        rleBlocks = zzBlocks.map((block) => rle(block).flat());

    console.table(dctBlocks[0]);

    postMessage({
        dctBlocks,
        qBlocks,
        zzBlocks,
        rleBlocks,
        srcBlocks: e.data,
    });

    gpu.destroy();
    close();
};
