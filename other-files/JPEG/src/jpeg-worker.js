importScripts('../node_modules/gpu.js/dist/gpu-browser.min.js', './lib.js');
onmessage = function(e) {
    //const gpu = new GPU();

    //let rowOut = mdDct2(e.data, gpu)
    const gpu = new GPU();

    const dct2 = gpu
        .createKernel(function (mtx, cosines) {
            let localSum = 0.0;

            for (let u = 0; u < 8; u++) {
                for (let v = 0; v < 8; v++) {
                    localSum +=
                        mtx[v][u] *
                        cosines[u][this.thread.x] *
                        cosines[v][this.thread.y];
                }
            }

            return Math.round((1 / Math.sqrt(2 * 8)) * localSum) % 256;
        })
        .setOutput([8, 8]).setPipeline(true);


    //let rowOut = e.data.chunk.map( x => dct2(x, e.data.cosines))


    const dct2x = gpu
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
        })
        .setOutput([8, 8, e.data.chunk.length]).setPipeline(true);

    let rowOut = dct2x(e.data.chunk, e.data.cosines)

    postMessage(rowOut);
    //gpu.destroy();
    close();
};