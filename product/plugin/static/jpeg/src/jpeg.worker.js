importScripts('../index.js', './gpu-browser.min.js');

onmessage = (ev) => {
    const gpu = new GPU(),
        cpu = new GPU({ mode: 'cpu' });

    let {
        lumaTable,
        chromaTable,
        imgWidth,
        pxs,
        qualityChroma,
        qualityLuma,
        sampleRate,
    } = ev.data;

    let lumaTableNew = newQuantTable(lumaTable, gpu),
        chromaTableNew = newQuantTable(chromaTable, gpu);

    let yuv = fromRgb(pxs, 4),
        allChannels = getAllChannels(yuv, 4).map((c) => to2d(c, imgWidth)),
        [cY, cCb, cCr] = upscaleComps(
            sample(allChannels, sampleRate),
            sampleRate,
        ),
        encodedComps = [
            quantiseMap(
                toDctMap2(toMcuBlocks(cY).flat()),
                lumaTable,
                qualityLuma,
                gpu,
            ),
            quantiseMap(
                toDctMap2(toMcuBlocks(cCb).flat()),
                chromaTable,
                qualityChroma,
                gpu,
            ),
            quantiseMap(
                toDctMap2(toMcuBlocks(cCr).flat()),
                chromaTable,
                qualityChroma,
                gpu,
            ),
        ];

    const zigzag = [
        [0, 0, 1, 0, 0, 1, 0, 2, 1, 1, 2, 0, 3, 0, 2, 1],
        [1, 2, 0, 3, 0, 4, 1, 3, 2, 2, 3, 1, 4, 0, 5, 0],
        [4, 1, 3, 2, 2, 3, 1, 4, 0, 5, 0, 6, 1, 5, 2, 4],
        [3, 3, 4, 2, 5, 1, 6, 0, 7, 0, 6, 1, 5, 2, 4, 3],
        [3, 4, 2, 5, 1, 6, 0, 7, 1, 7, 2, 6, 3, 5, 4, 4],
        [5, 3, 6, 2, 7, 1, 7, 2, 6, 3, 5, 4, 4, 5, 3, 6],
        [2, 7, 3, 7, 4, 6, 5, 5, 6, 4, 7, 3, 7, 4, 6, 5],
        [5, 6, 4, 7, 5, 7, 6, 6, 7, 5, 7, 6, 6, 7, 7, 7],
    ].flat();

    const serialise = (mtx, path) =>
        range(64).map((i) => mtx[path[i * 2]][path[i * 2 + 1]]);

    let zigzagComps = encodedComps.map(comps =>
        comps.map(mcu => serialise(mcu, zigzag))
    );

    let dcCoeffs = zigzagComps.map(comp => comp.map(mcu => mcu[0])),
        acCoeffs = zigzagComps.map(comp => comp.map(mcu => mcu.slice(1)));

    let dcCoeffsDpcm = dcCoeffs.map(comp => Int8Array.from(dpcm(comp))),
        acCoeffsRle = acCoeffs.map(comp => comp.map(coeffs => Int8Array.from(zeroRle(coeffs))));

    let compressed = {
        components: {
            Y: {
                dcData: dcCoeffsDpcm[0],
                acData: acCoeffsRle[0],

                // Component lengths for size comparison.
                dcLength: dcCoeffsDpcm[0].length,
                acLength: acCoeffsRle[0].reduce((acc, curr) => acc + curr.length, 0),
            },
            Cb: {
                dcData: dcCoeffsDpcm[1],
                acData: acCoeffsRle[1],

                // Component lengths for size comparison.
                dcLength: dcCoeffsDpcm[1].length,
                acLength: acCoeffsRle[1].reduce((acc, curr) => acc + curr.length, 0),
            },
            Cr: {
                dcData: dcCoeffsDpcm[2],
                acData: acCoeffsRle[2],

                // Component lengths for size comparison.
                dcLength: dcCoeffsDpcm[2].length,
                acLength: acCoeffsRle[2].reduce((acc, curr) => acc + curr.length, 0),
            },
        }
    };

    postMessage({ encodedComps, compressed });
};
