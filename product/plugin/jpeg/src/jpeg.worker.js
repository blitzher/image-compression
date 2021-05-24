importScripts('../index.js', './gpu-browser.min.js');

onmessage = (ev) => {
    ev.preventDefault()
    let { imgWidth, imgHeight, initWidth, initHeight, pxsArr } = ev.data;


        let pxs = crop(
            to2d(to2d(pxsArr, 4), initWidth),
            imgWidth,
            imgHeight,
        ).flat(2);

        console.log(pxs);

        let allChannels = getAllChannels(pxs, 4).map((c) => to2d(c, imgWidth));

        console.log(allChannels[0].length);

        console.log(imgWidth)

        let allComps = allChannels.map((c) => crop(toBlocks(c), imgWidth / 8, imgHeight / 8));

        console.log(mcuMtxToPxMtx(allComps[0], imgWidth, imgHeight));


        let composed = allComps.map((c) => mcuMtxToPxMtx(c, imgWidth, imgHeight).flat());

        //let spliced = splice(composed, imgWidth, imgHeight, _gpu);

        //let drawable = to2d(spliced, imgWidth);

        //console.table(drawable);
}