/**
 * Encode JPEG.
 * Todo: Almost everything but DCT2.
 * @param srcUri
 * @param Gpu
 * @returns
 */
const jpegEncode = (srcURI) => {
    let gpu = new GPU(),
        img = new Image();

    const toRgb = (data2D, size) => gpu.createKernel(function (data) {
        let i = this.thread.x * 4;

        return [data[i], data[i + 1], data[i + 2]];
    }, {
        argumentTypes: {
            data: 'Array'
        },
        returnType: 'Array(3)',
        output: [size],
    })(data2D);

    const toYCbCr = (data2D, size) => gpu.createKernel(function (rgbArr) {
        let i = this.thread.x,
            r = rgbArr[i][0],
            g = rgbArr[i][1],
            b = rgbArr[i][2]

        return [
            Math.round(16 + (65.738 * r) / 256 + (129.057 * g) / 256 + (25.064 * b) / 256),
            Math.round(128 - (37.945 * r) / 256 - (74.494 * g) / 256 + (112.439 * b) / 256),
            Math.round(128 + (112.439 * r) / 256 - (94.154 * g) / 256 - (18.285 * b) / 256),
        ];
    }, {
        output: [size],
    })(data2D);

    const toColorComps = (data2D) => {
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
                comps = toColorComps(toYCbCr(toRgb(data, data.length / 4), data.length / 4));

            Promise.all(comps.map(x =>
                new Promise((resolve, reject) => {
                    const compMtx = toComps(to2d(x, img.width)).flat(),
                        worker = new Worker('./src/main-worker.js');

                    worker.onmessage = (e) => {
                        resolve(e.data);
                    };

                    worker.postMessage(compMtx);
                }))
            ).then(x => resolve(x));
        };

        img.crossOrigin = 'anonymous';
        img.src = srcURI;
    })
};