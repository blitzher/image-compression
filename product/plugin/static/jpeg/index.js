'use strict';

//const gpu = new GPU({ mode: 'cpu' }); // Global instance of GPU.JS.

const cosines = (gpu) =>
    (gpu || new GPU({ mode: 'cpu' })).createKernel(
        function () {
            let { x, y } = this.thread;

            Math.cos(((2 * x + 1) * y * Math.PI) / 16);
        },
        {
            output: [8, 8],
            precision: 'single',
        },
    );

//const C = [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1];

/**
 * FDCT function based on JPEG spec of 1992 from CCITT Recommendation T.81.
 * @param {number[][]} mcu
 * @param {object} [gpu]
 * @returns {number[][]} MCU with FDCT applied.
 */
const toDct = (mcu, gpu) =>
    (gpu || new GPU({ mode: 'cpu' })).createKernel(
        function (mcu, C) {
            let u = this.thread.x,
                v = this.thread.y,
                sum = 0.0;

            for (let x = 0; x < 8; x++) {
                for (let y = 0; y < 8; y++) {
                    sum +=
                        mcu[y][x] *
                        Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                        Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }

            return Math.round((1 / 4) * C[u] * C[v] * sum);
        },
        {
            output: [8, 8],
            precision: 'single',
        },
    )(mcu, [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1]);

const toDctMap = (mcuArr, gpu) =>
    (gpu || new GPU({ mode: 'cpu' })).createKernel(
        function (arr, C) {
            let u = this.thread.x,
                v = this.thread.y,
                sum = 0.0;

            for (let x = 0; x < 8; x++) {
                for (let y = 0; y < 8; y++) {
                    sum +=
                        arr[this.thread.z][y][x] *
                        // cosines[x][u] *
                        // cosines[y][v];
                        Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                        Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }

            return Math.round((1 / 4) * C[u] * C[v] * sum);
        },
        {
            output: [8, 8, mcuArr.length],
            precision: 'single',
        },
    )(mcuArr, [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1]);

/**
 * IDCT function based on JPEG spec of 1992 from CCITT Recommendation T.81.
 * @param {number[][]} mcu MCU with FDCT applied.
 * @returns {number[][]} MCU with FDCT reversed.
 */
const fromDct = (mcu, gpu) =>
    (gpu || new GPU({ mode: 'cpu' })).createKernel(
        function (mcu, C) {
            let x = this.thread.x,
                y = this.thread.y,
                sum = 0.0;

            for (let u = 0; u < 8; u++) {
                for (let v = 0; v < 8; v++) {
                    sum +=
                        mcu[v][u] *
                        C[u] *
                        C[v] *
                        Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                        Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }

            return Math.round(sum / 4);
        },
        {
            output: [8, 8],
            precision: 'single',
        },
    )(mcu, [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1]);

const fromDctMap = (mcuArr, gpu) =>
    (gpu || new GPU({ mode: 'cpu' })).createKernel(
        function (arr, C) {
            let { x, y, z } = this.thread,
                sum = 0.0;

            for (let u = 0; u < 8; u++) {
                for (let v = 0; v < 8; v++) {
                    sum +=
                        arr[z][v][u] *
                        C[u] *
                        C[v] *
                        Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                        Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }

            return Math.round(sum / 4);
        },
        {
            output: [8, 8, mcuArr.length],
            precision: 'single',
        },
    )(mcuArr, [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1]);

/**
 * Non-GPU.JS JPEG methods for reference.
 */

const fdctControlImpl = (mcu) => {
    let out = [];

    let C = [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1];

    for (let u = 0; u < 8; u++) {
        out.push([]);

        for (let v = 0; v < 8; v++) {
            let local = 0.0;

            for (let x = 0; x < 8; x++) {
                for (let y = 0; y < 8; y++) {
                    local +=
                        mcu[x][y] *
                        Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                        Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }

            out[u].push(Math.round((1 / 4) * C[u] * C[v] * local));
        }
    }

    return out;
};

const idctControlImpl = (mcu) => {
    let out = [];

    let C = [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1];

    for (let y = 0; y < 8; y++) {
        out.push([]);

        for (let x = 0; x < 8; x++) {
            let local = 0.0;

            for (let u = 0; u < 8; u++) {
                for (let v = 0; v < 8; v++) {
                    local +=
                        C[u] *
                        C[v] *
                        mcu[v][u] *
                        Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                        Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }

            out[y].push(Math.round((1 / 4) * local));
        }
    }

    return out;
};

const readFile = (uri, canvas) => {
    let img = new Image(),
        _canvas = canvas || document.createElement('canvas'),
        ctx = _canvas.getContext('2d');

    return new Promise((resolve) => {
        img.onload = () => {
            _canvas.width = img.width;
            _canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            let imgData = ctx.getImageData(0, 0, img.width, img.height);

            resolve(imgData.data);
        };

        img.crossOrigin = 'anonymous';
        img.src = uri;
    });
};

const range = (a, b, c) =>
    new Array(~~((!b ? a : b - a) / (c || 1) + 0.5))
        .fill()
        .map((_, i) => i * (c || 1) + (!b ? 0 : a));

const getChannel = (data, offset, N) =>
    range(data.length / N).map((i) => data[i + offset]);

const toBlocks = (mtx) => {
    let out = range(Math.floor(mtx.length / 8)).map(() =>
        range(Math.floor(mtx[0].length / 8)),
    );

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
};

const to2d = (arr, width) =>
    range(arr.length / width).map((_, i) =>
        range(width).map((_, j) => arr[i * width + j]),
    );

const getAllChannels = (data, n) =>
    range(n).map((i) => range(0, data.length, n).map((j) => data[j + i]));

const mcuMtxToPxMtx = (mcuMtx, w, h) => {
    let out = range(h).map(() => range(w));

    for (let i = 0; i < h / 8; i++) {
        for (let j = 0; j < w / 8; j++) {
            for (let x = 0; x < 8; x++) {
                for (let y = 0; y < 8; y++) {
                    out[i * 8 + x][j * 8 + y] = mcuMtx[i][j][x][y];
                }
            }
        }
    }

    return out;
};

/**
 * Supsample chrominance component.
 * @param {number[][][]} comps Color component matrix.
 *
 * Is up of arrays of matrices, existing
 * `[ [[Y]], [[Cb]], [[CR]] ]`
 * @param {number[]} rate e.g. [4,4,4] or [4,2,2].
 */
const sample = (comps, rate) => {
    console.log('COMPS');
    console.log(comps);
    console.log('-------------');
    let V = [1, rate[1], 1];

    /* hack */
    rate = rate.map((v) => (v === 0 ? 0.1 : v));

    let YMat = comps[0];
    let CbMat = comps[1];
    let CrMat = comps[2];

    /* Setup subsampling spaces */
    let luma_sz = Math.floor(4 / rate[0]);
    let chr1_sz = Math.floor(4 / rate[1]);
    let chr2_sz = Math.floor(4 / rate[2]);

    /* Keep all luminance data of Y matrix */
    let OutYMat = YMat;

    /* Calculate and append rows to OutCbMat and OutCrMat, depending on chr1_sz */
    let OutCbMat = [];
    let OutCrMat = [];
    for (let i = 0; i < CbMat.length; i++) {
        /* All even rows */
        if (i % 2 === 0) {
            let CbRow = CbMat[i].filter(
                (_, i) => i % chr1_sz === 0 && chr1_sz < 5,
            );
            let CrRow = CrMat[i].filter(
                (_, i) => i % chr1_sz === 0 && chr1_sz < 5,
            );

            if (CbRow.length) OutCbMat.push(CbRow);
            if (CrRow.length) OutCrMat.push(CrRow);
        } else {
            /* All odd rows */
            let CbRow = CbMat[i].filter(
                (_, i) => i % chr2_sz === 0 && chr2_sz < 5,
            );
            let CrRow = CrMat[i].filter(
                (_, i) => i % chr2_sz === 0 && chr2_sz < 5,
            );
            if (CbRow.length) OutCbMat.push(CbRow);
            if (CrRow.length) OutCrMat.push(CrRow);
        }
    }

    /* Return the same type as input */
    return [OutYMat, OutCbMat, OutCrMat];
};

const upscaleComps = (comps, [J, a, b]) => {
    a = Math.floor(4 / a);
    if (b != 0) b = Math.floor(4 / b);

    function upscaleMatByFactor(mat, hor, ver) {
        let out = [];
        let rows = [];
        for (let i of range(mat.length)) {
            let row = [];
            for (let j of range(mat[i].length)) {
                for (let _ of range(hor)) row.push(mat[i][j]);
            }

            rows.push(row);
        }
        for (let i of range(rows.length)) {
            for (let _ of range(ver)) {
                out.push(rows[i]);
            }
        }
        return out;
    }

    let OutYMat = comps[0];
    let OutCbMat = [];
    let OutCrMat = [];

    if (b === 0) {
        OutCbMat = upscaleMatByFactor(comps[1], a, 2);
        OutCrMat = upscaleMatByFactor(comps[2], a, 2);
    } else {
        for (let i of range(comps[1].length)) {
            OutCbMat.push(
                upscaleMatByFactor([comps[1][i]], i % 2 ? b : a, 1).flat(),
            );
            OutCrMat.push(
                upscaleMatByFactor([comps[2][i]], i % 2 ? b : a, 1).flat(),
            );
        }
    }

    return [OutYMat, OutCbMat, OutCrMat];
};

const upscale2 = ([Y, Cb, Cr], [J, a, b]) => {
    let out = [Y, [], []];

    for (let i = 0; i < Y.length; i += 2) {
        let tmp = [];

        for (let j = 0; j < Y[0].length; j += 2) {
            tmp.push(Cb[i]);
        }
    }

    out[1] = range(b).map((row) =>
        row.flatMap((v) => new Array((Y.length / 4) * b).fill(v)),
    );
    out[2] = Cr.map((row) =>
        row.flatMap((v) => new Array((Y.length / 4) * b).fill(v)),
    );

    return out;
};

const sampleUp = ([Y, Cb, Cr], [J, a, b]) => [
    Y,
    Cb.map((x, i) => x.flatMap((v) => new Array(4 / a).fill(v))),
    Cr.map((x, i) => x.flatMap((v) => new Array(4 / a).fill(v))),
];

const quantise = (mcu, table, factor, gpu) =>
    (gpu || new GPU({ mode: 'cpu' })).createKernel(
        function (mcu, table, quality) {
            let { x, y } = this.thread,
                scaleFactor = 0;

            if (quality < 50) {
                scaleFactor = 5000 / quality;
            } else {
                scaleFactor = 200 - quality * 2;
            }

            return Math.round(
                mcu[x][y] / ((scaleFactor * table[x][y] + 50) / 100),
            );
        },
        {
            output: [8, 8],
            precision: 'single',
            returnType: 'Integer',
        },
    )(mcu, table, factor);

const quantiseMap = (mcuArr, table, quality, gpu) =>
    (gpu || new GPU({ mode: 'cpu' })).createKernel(
        function (mcu, table, quality) {
            let { x, y, z } = this.thread,
                scaleFactor = 0;

            if (quality < 50) {
                scaleFactor = 5000 / quality;
            } else {
                scaleFactor = 200 - quality * 2;
            }

            return Math.round(
                mcu[z][x][y] / ((scaleFactor * table[x][y] + 50) / 100),
            );
        },
        {
            output: [8, 8, mcuArr.length],
            precision: 'single',
            returnType: 'Integer',
        },
    )(mcuArr, table, quality);

const deQuantiseMap = (mcuArr, table, quality, gpu) =>
    (gpu || new GPU({ mode: 'cpu' })).createKernel(
        function (mcu, table, quality) {
            let { x, y, z } = this.thread,
                scaleFactor = 0;

            if (quality < 50) {
                scaleFactor = 5000 / quality;
            } else {
                scaleFactor = 200 - quality * 2;
            }

            return Math.round(
                mcu[z][x][y] * ((scaleFactor * table[x][y] + 50) / 100),
            );
        },
        {
            output: [8, 8, mcuArr.length],
            precision: 'single',
            returnType: 'Integer',
        },
    )(mcuArr, table, quality);

const levelShift = (mcuArr) =>
    mcuArr.map((mcu) => mcu.map((row) => row.map((val) => val - 128)));

const drawComponents = ([C0, C1, C2], gpu) => {
    let render = (gpu || new GPU()).createKernel(
        function (c0, c1, c2) {
            let { x, y } = this.thread;

            this.color(c0[x][y], c1[x][y], c2[x][y]);
        },
        {
            output: [C0.length, C0[0].length],
            graphical: true,
        },
    );

    render(C0, C1, C2);

    return render.getPixels();
};

let splice = ([a, b, c], w, h, gpu) =>
    (gpu || new GPU()).createKernel(
        function (a, b, c) {
            let x = this.thread.x;

            return [a[x], b[x], c[x]];
        },
        {
            output: [w * h],
        },
    )(a, b, c);

let crop = (mtx, w, h) => mtx.slice(0, h).map((r) => r.slice(0, w));

const fromYuv = (data, n) => {
    let out = [];

    for (let i = 0; i < data.length; i += n) {
        let y = data[i],
            cb = data[i + 1],
            cr = data[i + 2];

        out.push(
            Math.min(Math.max(0, Math.round(y + 1.402 * (cr - 128))), 255),
        );
        out.push(
            Math.min(
                Math.max(
                    0,
                    Math.round(y - 0.3441 * (cb - 128) - 0.7141 * (cr - 128)),
                ),
                255,
            ),
        );
        out.push(
            Math.min(Math.max(0, Math.round(y + 1.772 * (cb - 128))), 255),
        );
        if (n === 4) out.push(255);
    }

    return out;
};

const fromRgb = (data, n) => {
    let out = [];

    for (let i = 0; i < data.length; i += n) {
        let r = data[i],
            g = data[i + 1],
            b = data[i + 2];

        out.push(
            Math.min(
                Math.max(0, Math.round(0.299 * r + 0.587 * g + 0.114 * b)),
                255,
            ),
        );
        out.push(
            Math.min(
                Math.max(
                    0,
                    Math.round(-0.1687 * r - 0.3313 * g + 0.5 * b + 128),
                ),
                255,
            ),
        );
        out.push(
            Math.min(
                Math.max(
                    0,
                    Math.round(0.5 * r - 0.4187 * g - 0.0813 * b + 128),
                ),
                255,
            ),
        );
        if (n === 4) out.push(255);
    }

    return out;
};

const encodeJpeg = (srcUri, qualityLuma, qualityChroma, sampleRate, _worker) =>
    new Promise((resolve) => {
        const worker = _worker || new Worker('plugin/jpeg/src/jpeg.worker.js'),
            gpu = new GPU();

        let img = new Image(),
            chromaTable = [
                [17, 18, 24, 47, 99, 99, 99, 99],
                [18, 21, 26, 66, 99, 99, 99, 99],
                [24, 26, 56, 99, 99, 99, 99, 99],
                [47, 66, 99, 99, 99, 99, 99, 99],
                [99, 99, 99, 99, 99, 99, 99, 99],
                [99, 99, 99, 99, 99, 99, 99, 99],
                [99, 99, 99, 99, 99, 99, 99, 99],
                [99, 99, 99, 99, 99, 99, 99, 99],
            ],
            lumaTable = [
                [16, 11, 10, 16, 24, 40, 51, 61],
                [12, 12, 14, 19, 26, 58, 60, 55],
                [14, 13, 16, 24, 40, 57, 69, 56],
                [14, 17, 22, 29, 51, 87, 80, 62],
                [18, 22, 37, 56, 68, 109, 103, 77],
                [24, 35, 55, 64, 81, 104, 113, 92],
                [49, 64, 78, 87, 103, 121, 120, 101],
                [72, 92, 95, 98, 112, 100, 103, 99],
            ];

        img.onload = () => {
            let initWidth = img.width,
                initHeight = img.height,
                imgWidth = initWidth - (initWidth % 8),
                imgHeight = initHeight - (initHeight % 8),
                render = gpu.createKernel(
                    function (image) {
                        let px = image[this.thread.y][this.thread.x];

                        this.color(px[0], px[1], px[2]);
                    },
                    {
                        output: [imgWidth, imgHeight],
                        graphical: true,
                    },
                );

            worker.onmessage = (ev) => {
                resolve({
                    components: {
                        Y: ev.data.encodedComps[0],
                        Cb: ev.data.encodedComps[1],
                        Cr: ev.data.encodedComps[2],
                    },
                    width: imgWidth,
                    height: imgHeight,
                    lumaTable,
                    chromaTable,
                    qualityChroma,
                    qualityLuma,
                    sampleRate,
                });
            };

            render(img);

            worker.postMessage({
                imgWidth,
                imgHeight,
                lumaTable,
                chromaTable,
                qualityChroma,
                qualityLuma,
                sampleRate,
                pxs: render.getPixels(),
            });
        };

        img.src = srcUri;
    });

const decodeJpeg = (encoded, canvas) => {
    const gpu = new GPU({ canvas }),
        cpu = new GPU({ mode: 'cpu' });

    let render = gpu.createKernel(
        function (pxMtx) {
            let { x, y } = this.thread,
                N = this.constants.N;

            this.color(
                pxMtx[N - y][x][0] / 255,
                pxMtx[N - y][x][1] / 255,
                pxMtx[N - y][x][2] / 255,
            );
        },
        {
            output: [encoded.width, encoded.height],
            constants: {
                N: encoded.height - 1,
            },
            graphical: true,
        },
    );

    let [Y, Cb, Cr] = [
            to2d(
                fromDctMap(
                    deQuantiseMap(
                        encoded.components.Y,
                        encoded.lumaTable,
                        encoded.qualityLuma,
                        cpu,
                    ),
                ),
                encoded.width / 8,
            ),
            to2d(
                fromDctMap(
                    deQuantiseMap(
                        encoded.components.Cb,
                        encoded.chromaTable,
                        encoded.qualityChroma,
                        cpu,
                    ),
                ),
                encoded.width / 8,
            ),
            to2d(
                fromDctMap(
                    deQuantiseMap(
                        encoded.components.Cr,
                        encoded.chromaTable,
                        encoded.qualityChroma,
                        cpu,
                    ),
                ),
                encoded.width / 8,
            ),
        ],
        composed = [
            mcuMtxToPxMtx(Y, encoded.width, encoded.height).flat(),
            mcuMtxToPxMtx(Cb, encoded.width, encoded.height).flat(),
            mcuMtxToPxMtx(Cr, encoded.width, encoded.height).flat(),
        ],
        spliced = splice(composed, encoded.width, encoded.height, cpu);

    let drawable = to2d(
        to2d(fromYuv(spliced.map((x) => Array.from(x)).flat(), 3), 3),
        encoded.width,
    );

    console.log(encoded.sampleRate);

    render(drawable);
};

let jpeg = () => {
    const worker = new Worker('plugin/jpeg/src/jpeg.worker.js');

    return {
        encode: (src, qualityLuma, qualityChroma, sampleRate) =>
            encodeJpeg(src, qualityLuma, qualityChroma, sampleRate, worker),
        decode: decodeJpeg,
        close: () => worker.terminate(),
    };
};

/**
 * JPEG method object constructor.
 * @param {object} config
 * @param {string} [config.srcUri] Optional image src.
 * @param {object} [config.gpu] Optional inherited GPU.JS gpu instance.
 * @param {HTMLCanvasElement} [config.canvas]
 * @returns {object} JPEG method object.
 */
const JPEG = async ({ srcUri, gpu, cpu, canvas }) => {
    let img = new Image(),
        _canvas = canvas || document.createElement('canvas');

    const _gpu = gpu || new GPU({ mode: 'gpu', canvas: _canvas }),
        _cpu = cpu || new GPU({ mode: 'cpu' }),
        chromaTable = [
            [17, 18, 24, 47, 99, 99, 99, 99],
            [18, 21, 26, 66, 99, 99, 99, 99],
            [24, 26, 56, 99, 99, 99, 99, 99],
            [47, 66, 99, 99, 99, 99, 99, 99],
            [99, 99, 99, 99, 99, 99, 99, 99],
            [99, 99, 99, 99, 99, 99, 99, 99],
            [99, 99, 99, 99, 99, 99, 99, 99],
            [99, 99, 99, 99, 99, 99, 99, 99],
        ],
        lumaTable = [
            [16, 11, 10, 16, 24, 40, 51, 61],
            [12, 12, 14, 19, 26, 58, 60, 55],
            [14, 13, 16, 24, 40, 57, 69, 56],
            [14, 17, 22, 29, 51, 87, 80, 62],
            [18, 22, 37, 56, 68, 109, 103, 77],
            [24, 35, 55, 64, 81, 104, 113, 92],
            [49, 64, 78, 87, 103, 121, 120, 101],
            [72, 92, 95, 98, 112, 100, 103, 99],
        ];

    let encode = () => {
        encodeJpeg(srcUri, 100, 20).then((encoded) => {
            decodeJpeg(encoded, canvas);
        });
    };

    encode();

    return {
        toDct: (mcu) => toDct(mcu, _cpu),
        fromDct: (mcu) => fromDct(mcu, _gpu),
        toBlocks,
        fromBlocks: mcuMtxToPxMtx,
        toDctMap: (mcuArr) => toDctMap(mcuArr, _cpu),
        fromDctMap: (mcuArr) => fromDctMap(mcuArr, _gpu),
        sample,
        upscaleComps,
        imgWidth: img.width,
        imgHeight: img.height,
        chromaQuantise: (mcu, factor) =>
            quantise(mcu, chromaTable, factor, _gpu),
        lumaQuantise: (mcu, factor) => quantise(mcu, lumaTable, factor, _gpu),
    };
};

let expMcuAsBitmap = (src) => {};
