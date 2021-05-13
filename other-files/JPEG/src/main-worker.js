importScripts(
    'https://unpkg.com/gpu.js@latest/dist/gpu-browser.min.js'
);

onmessage = (e) => {
    const gpu = new GPU(),
        cosines = gpu
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
            }, {
                output: [8, 8],
                pipeline: true,
            })(),
        mapDct2 = gpu
            .createKernel(function (arr, cosines) {
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
            }, {
                output: [8, 8, e.data.length],
                pipeline: true,
            });

    postMessage(mapDct2(e.data, cosines));

    gpu.destroy();
    close();
}