'use strict';

const gpu = new GPU({ mode: 'cpu' }); // Global instance of GPU.JS.

/**
 * DC coefficient.
 * @param {number} i Index, either u or v.
 * @returns {number} 1 / sqrt(2) when i == 0 else 1.
 */

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

const getChannel = (data, offset) =>
    range(data.length / 4).map((i) => data[i + offset]);

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

const mcuMtxToPxMtx = (mcuMtx) => {
    let out = range(mcuMtx.length * 8).map(() => range(mcuMtx[0].length * 8));

    for (let i = 0; i < mcuMtx.length; i++)
        for (let j = 0; j < mcuMtx[0].length; j++)
            for (let x = 0; x < 8; x++)
                for (let y = 0; y < 8; y++)
                    out[i * 8 + x][j * 8 + y] = mcuMtx[i][j][x][y];

    return out;
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
        _cpu = cpu || new GPU({ mode: 'cpu' });

    let pixels = new Promise((resolve, reject) => {
        if (srcUri === undefined) reject(new Error('Missing image source.'));

        img.onload = () => {
            let render = _gpu.createKernel(
                function (image) {
                    let px = image[this.thread.y][this.thread.x];

                    this.color(px[0], px[1], px[2]);
                },
                {
                    output: [img.height, img.width],
                    graphical: true,
                },
            );

            render(img);

            resolve(render.getPixels());
        };

        img.src = srcUri;
    }).catch((err) => {
        console.warn(err);
    });

    await pixels;

    return {
        toDct: (mcu) => toDct(mcu, _cpu),
        fromDct: (mcu) => fromDct(mcu, _gpu),
        toBlocks,
        fromBlocks: mcuMtxToPxMtx,
        pixels,
    };
};
