/**
 * Encode JPEG.
 * Todo: Almost everything but DCT2.
 * @param srcUri
 * @returns
 */
const jpegEncode = (srcURI) => {
    const
        gpu = new GPU(),
        img = new Image(),
        toRgbArr = (data2D, size) => gpu
            .createKernel(function (data) {
                let i = this.thread.x * 4;

                return [data[i], data[i + 1], data[i + 2]];
            }, {
                argumentTypes: {
                    data: 'Array'
                },
                returnType: 'Array(3)',
                output: [size],
            })(data2D),
        toYCbCr = (data2D, size) => gpu
            .createKernel(function (rgbArr) {
                let i = this.thread.x,
                    r = rgbArr[i][0],
                    g = rgbArr[i][1],
                    b = rgbArr[i][2]

                return [
                    Math.round(0.299 * r + 0.587 * g + 0.114 * b),
                    Math.round((-0.1687 * r - 0.3313 * g + 0.5 * b) + 128),
                    Math.round((0.5 * r - 0.4187 * g - 0.0813 * b) + 128),
                ];
            }, {
                output: [size],
            })(data2D),
        toRgb = (data2D, size) => gpu
            .createKernel(function (arr) {
                let i = this.thread.x,
                    y = rr[i][0],
                    cb = arr[i][1],
                    cr = arr[i][2]

                return [
                    Math.round(y + 1.402 * (cr - 128)),
                    Math.round(y - 0.3441 * (cb - 128) - 0.7141 * (cr - 128)),
                    Math.round(y + 1.772 * (cb - 128))
                ];
            }, {
                output: [size],
            })(data2D),
        toColorComps = (data2D) => {
            let a = [],
                b = [],
                c = [];

            data2D.forEach(v => {
                a.push(v[0]);
                b.push(v[1]);
                c.push(v[2]);
            });

            return [a, b, c];
        };

    return new Promise((resolve, reject) => {
        img.onload = () => {
            const render = gpu.createKernel(function (image) {
                let pixel = image[this.thread.y][this.thread.x];
                this.color(pixel[0], pixel[1], pixel[2]);
            }, {
                output: [img.width, img.height],
                graphical: true,
            });

            render(img);

            let data = render.getPixels(),
                comps = toColorComps(toYCbCr(toRgbArr(data, data.length / 4), data.length / 4));

            Promise.all(comps.map((x, i) =>
                new Promise((resolve, reject) => {
                    const
                        compMtx = toBlocks(to2d(x, img.width)).flat(),
                        worker = new Worker('./src/main.worker.js');

                    //if (i === 0) console.log("[" + compMtx[0].map(x => "[" + x.toString() + "]").toString() + "]")

                    worker.onmessage = (e) => {
                        resolve(e.data);
                    };

                    worker.postMessage(compMtx);
                }))
            ).then(x => resolve(x));
        };

        img.crossOrigin = 'anonymous';
        img.src = srcURI;
    });
};