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

    let yuv = fromRgb(pxs, 4),
        allChannels = getAllChannels(yuv, 4).map((c) => to2d(c, imgWidth)),
        [cY, cCb, cCr] = upscaleComps(
            sample(allChannels, sampleRate),
            sampleRate,
        ),
        encodedComps = [
            quantiseMap(
                toDctMap(toMcuBlocks(cY).flat(), cpu),
                lumaTable,
                qualityLuma,
                gpu,
            ),
            quantiseMap(
                toDctMap(toMcuBlocks(cCb).flat(), cpu),
                chromaTable,
                qualityChroma,
                gpu,
            ),
            quantiseMap(
                toDctMap(toMcuBlocks(cCr).flat(), cpu),
                chromaTable,
                qualityChroma,
                gpu,
            ),
        ];

    let zigzag = [
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        2,
        1,
        1,
        2,
        0,
        3,
        0,
        2,
        1, //
        1,
        2,
        0,
        3,
        0,
        4,
        1,
        3,
        2,
        2,
        3,
        1,
        4,
        0,
        5,
        0, //
        4,
        1,
        3,
        2,
        2,
        3,
        1,
        4,
        0,
        5,
        0,
        6,
        1,
        5,
        2,
        4, //
        3,
        3,
        4,
        2,
        5,
        1,
        6,
        0,
        7,
        0,
        6,
        1,
        5,
        2,
        4,
        3, //
        3,
        4,
        2,
        5,
        1,
        6,
        0,
        7,
        1,
        7,
        2,
        6,
        3,
        5,
        4,
        4, //
        5,
        3,
        6,
        2,
        7,
        1,
        7,
        2,
        6,
        3,
        5,
        4,
        4,
        5,
        3,
        6, //
        2,
        7,
        3,
        7,
        4,
        6,
        5,
        5,
        6,
        4,
        7,
        3,
        7,
        4,
        6,
        5, //
        5,
        6,
        4,
        7,
        5,
        7,
        6,
        6,
        7,
        5,
        7,
        6,
        6,
        7,
        7,
        7, //
    ]

    /*let serialise = (mtx, path) =>
            range(64).map((i) => mtx[path[i * 2]][path[i * 2 + 1]]);

    let zigzagComps = encodedComps.map(comps =>
            comps.map(mcu => serialise(mcu))
    );

    let dcCoeffs = zigzagComps.map(comp => comp.map(mcu => mcu[0]));
    let acCoeffs = zigzagComps.map(comp => comp.map(mcu => mcu.slice(1)));*/

    let compressed = {
        rleComponents: {
            Y: {
                dcData: [],
                acData: [],
            },
            Cb: {
                dcData: [],
                acData: [],
            },
            Cr: {
                dcData: [],
                acData: [],
            },
        }
    }

    postMessage({ encodedComps });
};
