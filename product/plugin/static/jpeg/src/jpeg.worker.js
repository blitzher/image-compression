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
                toDctMap(toBlocks(cY).flat(), cpu),
                lumaTable,
                qualityLuma,
                gpu,
            ),
            quantiseMap(
                toDctMap(toBlocks(cCb).flat(), cpu),
                chromaTable,
                qualityChroma,
                gpu,
            ),
            quantiseMap(
                toDctMap(toBlocks(cCr).flat(), cpu),
                chromaTable,
                qualityChroma,
                gpu,
            ),
        ];

    postMessage({ encodedComps });
};
