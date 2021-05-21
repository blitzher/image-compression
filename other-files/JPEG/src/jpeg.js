const drawJpeg = (blocks, w, h, canvas) => {
    const worker = new Worker('./src/draw.worker.js'),
        gpu = new GPU({ mode: 'cpu' });

    worker.onmessage = (e) => {
        const drawRgb = gpu.createKernel(
            function (pxMtx) {
                let x = this.thread.x,
                    y = this.thread.y,
                    r = pxMtx[y][x][0] / 255,
                    g = pxMtx[y][x][1] / 255,
                    b = pxMtx[y][x][2] / 255;

                this.color(r, g, b);
            },
            {
                output: [w - (w % 8), h - (h % 8)],
                graphical: true,
            },
        );

        drawRgb(e.data.rgbArr);

        let canvas = drawRgb.canvas;

        canvas.className = 'testcanvas';

        document.body.append(canvas);
    };

    worker.postMessage({ blocks, w, h });
};

/**
 * Encode JPEG.
 * Todo: Almost everything but DCT2.
 * @param srcUri
 * @returns
 */
const jpegEncode = (srcURI) => {
    const gpu = new GPU({ mode: 'cpu' }),
        img = new Image(),
        toRgbArr = (data2D, size) =>
            gpu.createKernel(
                function (data) {
                    let i = this.thread.x * 4;

                    return [data[i], data[i + 1], data[i + 2]];
                },
                {
                    argumentTypes: {
                        data: 'Array',
                    },
                    returnType: 'Array(3)',
                    output: [size],
                },
            )(data2D),
        toYCbCr = (data2D, size) =>
            gpu.createKernel(
                function (rgbArr) {
                    let i = this.thread.x,
                        r = rgbArr[i][0],
                        g = rgbArr[i][1],
                        b = rgbArr[i][2];

                    return [
                        Math.min(
                            Math.max(
                                0,
                                Math.round(0.299 * r + 0.587 * g + 0.114 * b),
                            ),
                            255,
                        ),
                        Math.min(
                            Math.max(
                                0,
                                Math.round(
                                    -0.1687 * r - 0.3313 * g + 0.5 * b + 128,
                                ),
                            ),
                            255,
                        ),
                        Math.min(
                            Math.max(
                                0,
                                Math.round(
                                    0.5 * r - 0.4187 * g - 0.0813 * b + 128,
                                ),
                            ),
                            255,
                        ),
                    ];
                },
                {
                    output: [size],
                    precision: 'single',
                },
            )(data2D),
        toRgb = (data2D, size) =>
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
                                    y -
                                        0.3441 * (cb - 128) -
                                        0.7141 * (cr - 128),
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
            )(data2D),
        toColorComps = (data2D) => {
            let a = [],
                b = [],
                c = [];

            data2D.forEach((v) => {
                a.push(v[0]);
                b.push(v[1]);
                c.push(v[2]);
            });

            return [a, b, c];
        };

    return new Promise((resolve, reject) => {
        img.onload = () => {
            const render = gpu.createKernel(
                function (image) {
                    let pixel = image[this.thread.y][this.thread.x];

                    this.color(pixel[0], pixel[1], pixel[2]);
                },
                {
                    output: [img.width, img.height],
                    graphical: true,
                },
            );

            render(img);

            let data = render.getPixels(),
                cutToSize = to2d(to2d(data, 4), img.width)
                    .slice(0, img.height - (img.height % 8))
                    .map((row) => row.slice(0, img.width - (img.width % 8))),
                compMtx = [0, 1, 2].map((i) =>
                    toBlocks(
                        to2d(
                            toColorComps(
                                toYCbCr(
                                    cutToSize.flat(),
                                    cutToSize.flat().length,
                                ),
                            )[i],
                            cutToSize[0].length,
                        ),
                    ).flat(),
                );

            Promise.all(
                [0, 1, 2].map(
                    (i) =>
                        new Promise((resolve, reject) => {
                            const worker = new Worker('./src/main.worker.js');

                            worker.onmessage = (e) => {
                                resolve(e.data);
                            };

                            worker.postMessage(compMtx[i]);
                        }),
                ),
            ).then((x) =>
                resolve({
                    out: x,
                    draw: () => drawJpeg(x, img.width, img.height),
                }),
            );
        };

        img.crossOrigin = 'anonymous';
        img.src = srcURI;
    });
};
