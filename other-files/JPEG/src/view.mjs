// Mainly canvas related methods.

export const drawFrame = ({ frame: [ch0, ch1, ch2], gpu }) => {
    const render = gpu
        .createKernel(function (a, b, c) {
            let x = this.thread.x,
                y = this.thread.y;

            this.color(a[y][x], b[y][x], c[y][x]);
        })
        .setOutput([ch0.length, ch0[0].length])
        .setGraphical(true);

    render(ch0, ch1, ch2);

    return render;
};

export const drawGrayscale = ({ img, gpu }) => {
    const render = gpu
        .createKernel(function (image) {
            let px = image[this.thread.y][this.thread.x];

            let avg = (px[0] + px[1] + px[2]) / 3;

            this.color(avg, avg, avg);
        })
        .setConstants({ w: img.width, h: img.height })
        .setOutput([img.width, img.height])
        .setGraphical(true);

    render(img);

    return render;
};

export const drawImage = ({ img, gpu }) => {
    const render = gpu
        .createKernel(function (image) {
            let px = image[this.thread.y][this.thread.x];
            this.color(px[0], px[1], px[2]);
        })
        .setConstants({ w: img.width, h: img.height })
        .setOutput([img.width, img.height])
        .setGraphical(true);

    render(img);

    return render;
};

export const toComponents = ({ mtx, gpu }) => {
    const components = gpu
        .createKernel(function (a) {
            let out = [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
            ];

            for (let i = 0; i < 8; i++) {
                for (let j = 0 * 8; j < 8; j++) {
                    out[i][j] = a[i + this.thread.x * 8][j + this.thread.y * 8];
                }
            }
        })
        .setOutput([Math.floor(mtx[0].length / 8), Math.floor(mtx.length / 8)]);

    return components(mtx);
};
