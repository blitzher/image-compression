importScripts('../index.js', './gpu-browser.min.js');

onmessage = (ev) => {
    const gpu = new GPU(),
        cpu = new GPU({ mode: 'cpu' });

    let { lumaTable, chromaTable, imgWidth, pxs, qualityChroma, qualityLuma } = ev.data;

    let yuv = fromRgb(pxs, 4),
        allChannels = getAllChannels(yuv, 4).map((c) => to2d(c, imgWidth)),
        encodedComps = [
            quantiseMap(toDctMap(toBlocks(allChannels[0]).flat()), lumaTable, qualityLuma, cpu),
            quantiseMap(toDctMap(toBlocks(allChannels[1]).flat()), chromaTable, qualityChroma, cpu),
            quantiseMap(toDctMap(toBlocks(allChannels[2]).flat()), chromaTable, qualityChroma, cpu),
        ];

    postMessage({encodedComps});
}