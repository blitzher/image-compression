importScripts('https://unpkg.com/gpu.js@latest/dist/gpu-browser.min.js');

onmessage = (e) => {
    let range = (a, b, c) =>
            new Array(~~((!b ? a : b - a) / (c || 1) + 0.5))
                .fill()
                .map((_, i) => i * (c || 1) + (!b ? 0 : a)),
        to2d = (arr, width) =>
            range(arr.length / width).map((_, i) =>
                range(width).map((_, j) => arr[i * width + j]),
            ),
        { blocks, w, h } = e.data,
        gpu = new GPU({ mode: 'cpu' });

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

            function cosine(x, u) {
                return Math.cos(((2 * x + 1) / 16) * u * Math.PI);
            }

            return C(u) * cosine(x, u);
        })
        .setOutput([8, 8])();

    const mapDct3 = gpu
        .createKernel(function (arr, cosines) {
            let localSum = 0.0;

            for (let u = 1; u < 8; u++) {
                for (let v = 1; v < 8; v++) {
                    localSum +=
                        arr[this.thread.z][v][u] *
                        cosines[u][this.thread.x] *
                        cosines[v][this.thread.y];
                }
            }

            return Math.round(
                (arr[this.thread.z][0][0] + localSum) / Math.SQRT2,
            );
        })
        .setOutput([8, 8, blocks[0].dctBlocks.length])
        .setPrecision('single');

    const toRgb = (data2D, size) =>
        gpu.createKernel(
            function (arr) {
                let i = this.thread.x,
                    y = arr[i][0],
                    cb = arr[i][1],
                    cr = arr[i][2];

                return [
                    Math.min(
                        Math.max(0, Math.round(y + 1.402 * (cr - 128))),
                        255,
                    ),
                    Math.min(
                        Math.max(
                            0,
                            Math.round(
                                y - 0.3441 * (cb - 128) - 0.7141 * (cr - 128),
                            ),
                        ),
                        255,
                    ),
                    Math.min(
                        Math.max(0, Math.round(y + 1.772 * (cb - 128))),
                        255,
                    ),
                ];
            },
            {
                output: [size],
                precision: 'single',
            },
        )(data2D);

    const mapUnQuantise = gpu.createKernel(
        function (arr, table) {
            return Math.round(
                arr[this.thread.z][this.thread.y][this.thread.x] *
                    table[this.thread.y][this.thread.x],
            );
        },
        {
            output: [8, 8, blocks[0].dctBlocks.length],
        },
    );

    let defaultTable = [
        [16, 11, 10, 16, 24, 40, 51, 61],
        [12, 12, 14, 19, 26, 58, 60, 55],
        [14, 13, 16, 24, 40, 57, 69, 56],
        [14, 17, 22, 29, 51, 87, 80, 62],
        [18, 22, 37, 56, 68, 109, 103, 77],
        [24, 35, 55, 64, 81, 104, 113, 92],
        [49, 64, 78, 87, 103, 121, 120, 101],
        [72, 92, 95, 98, 112, 100, 103, 99],
    ];

    let [cY, cCb, cCr] = [0, 1, 2].map((i) =>
            to2d(mapDct3(blocks[i].dctBlocks, cosines), Math.floor(w / 8)),
        ),
        [cYout, cCbout, cCrout] = [0, 1, 2].map(() =>
            range(h - (h % 8)).map(() => range(w - (w % 8))),
        );

    range(Math.floor(h / 8)).forEach((i) =>
        range(Math.floor(w / 8)).forEach((j) => {
            range(8).forEach((x, _, rr) =>
                rr.forEach((y) => {
                    cYout[i * 8 + y][j * 8 + x] = cY[i][j][y][x];
                    cCbout[i * 8 + y][j * 8 + x] = cCb[i][j][y][x];
                    cCrout[i * 8 + y][j * 8 + x] = cCr[i][j][y][x];
                }),
            );
        }),
    );

    let newSplice = gpu.createKernel(
        function (a, b, c) {
            let x = this.thread.x;

            return [a[x], b[x], c[x]];
        },
        {
            output: [w * h],
        },
    );

    console.table(cY[0][0]);
    //console.table()

    let output = to2d(
        toRgb(
            newSplice(cYout.flat(), cCbout.flat(), cCrout.flat()),
            (w - (w % 8)) * (h - (h % 8)),
        ),
        w - (w % 8),
    );

    //console.table(blocks[0].srcBlocks[0]);
    console.table(blocks[0].dctBlocks[0]);

    postMessage({
        rgbArr: output,
        cY,
    });

    gpu.destroy();
    close();
};
