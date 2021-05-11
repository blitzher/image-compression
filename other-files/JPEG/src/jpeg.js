/**
 *
 * @param pixels
 * @param width
 * @param Gpu
 * @returns
 */
const jpegEncode = (pixels, width, Gpu) => {
    return new Promise((resolve, reject) => {
        const gpu = Gpu || new GPU();
        console.log(pixels)

        let channels = range(3).map((_, i) => getChannel(pixels, i, gpu));

        let pxMtx = to2d(channels[0], width);
        console.log('Converted imagedata to matrix!');

        let compMtx = toComps(pxMtx);
        console.log('Split matrix into components!');


        let worker = new Worker('./src/main-worker.js');
        worker.onmessage = (e) => {
            resolve(e.data);
        }
        worker.postMessage(compMtx);

        //console.log(compMtx[0].map(x => mdDct2(x, gpu)));
        //console.log(compMtx)

        /**let dctMtx = mtxApply(compMtx, (comp) => mdDct2(comp, gpu));
        console.log('Applied DCT-II to components!');

        let qMtx = mtxApply(dctMtx, (comp) => quantise(comp, gpu));
        console.log('Quantised components!');

        let zzMtx = mtxApply(qMtx, (comp) => zigzag(comp));
        console.log('Transformed components with zigzag!');

        let rleMtx = mtxApply(zzMtx, (comp) => rle(comp));
        console.log('Reduced each component with RLE!')*/
    });
};