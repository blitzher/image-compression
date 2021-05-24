importScripts('../index.js', './gpu-browser.min.js');

onmessage = (ev) => {
    const gpu = new GPU(),
        cpu = new GPU({ mode: 'cpu' });

    let { lumaTable, chromaTable, imgWidth, pxs, qualityChroma, qualityLuma } = ev.data;

    let yuv = fromRgb(pxs, 4),
        allChannels = getAllChannels(yuv, 4).map((c) => to2d(c, imgWidth)),
        encodedComps = [
            quantiseMap(toDctMap(toBlocks(allChannels[0]).flat(), cpu), lumaTable, qualityLuma, gpu),
            quantiseMap(toDctMap(toBlocks(allChannels[1]).flat(), cpu), chromaTable, qualityChroma, gpu),
            quantiseMap(toDctMap(toBlocks(allChannels[2]).flat(), cpu), chromaTable, qualityChroma, gpu),
        ];

    postMessage({encodedComps});
}