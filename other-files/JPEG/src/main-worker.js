importScripts('./lib.js', '../node_modules/gpu.js/dist/gpu-browser.min.js');
onmessage = function (e) {
    const gpu = new GPU();

    const calcCosines = gpu
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

    const cosines = calcCosines();


    let dctRow = async (row) => {
        let task = async (x) => {
            let worker = new Worker('./jpeg-worker.js');

            let res = new Promise((resolve, reject) => {
                worker.onmessage = (ev) => {
                    worker.terminate()
                    resolve(ev.data)
                };

                worker.postMessage({ chunk: x, cosines });
            });

            return res;
        };

        return Promise.all(row.map(x => task(x)));
    };

    dctRow(e.data).then(y => {
        postMessage(y);

        gpu.destroy();
        close();
    });
}