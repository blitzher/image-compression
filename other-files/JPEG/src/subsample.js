/**
 * Compute the chroma subsampling on an image, and
 * @param {ycbcr[][]} pxMtx The image to perform the chroma subsampling on
 * @param {number[]} meth The chroma subsampling method, eg. [4,4,4], [4,2,0]
 * @returns {ycbcr[][]} A new image, on which the chroma subsampling has been performed */
function chromaSubsample(pxMtx, meth) {
    const range = (a, b, c) =>
        new Array(~~((!b ? a : b - a) / (c || 1) + 0.5))
            .fill()
            .map((_, i) => i * (c || 1) + (!b ? 0 : a));

	const table = [
		NaN,
		4,
		2,
		NaN,
		1
	]

    /* Using 4:2:0 as default */
    const
        lumaSz = table[meth[0]] || table[4],
        chr1Sz = table[meth[1]] || table[2],
        chr2Sz = table[meth[2]] || table[0];

	/* setup output array */
    let out = range(4).map((_, __, a) =>
        a.map(() => [0, 0, 0]));


	function sampleAt(x, y, index, sampSz) {
		if (x % sampSz === 0) {
			/* append appropritate amount of samples
			* to output */
            range(sampSz).forEach((_, i, a) =>
                a.forEach((_, j) => {
                    out[Math.min(y + j, 3)][Math.min(x + i, 3)][index] = (pxMtx[y][x][index]);
                }));
		}
    }


	function chromaSample(x, y, sampSz) {
		if (x % sampSz === 0) {
			const chroma = [pxMtx[y][x][1], pxMtx[y][x][2]]

            range(sampSz).forEach((_, i, a) =>
                a.forEach((_, j) => {
                    out[Math.min(y + j, 3)][Math.min(x + i, 3)][1] = chroma[0];
                    out[Math.min(y + j, 3)][Math.min(x + i, 3)][2] = chroma[1];
                }));
		}
	}

    range(4).forEach((_, i, a) =>
        a.forEach((_, j) => {
            sampleAt(j, i, 0, lumaSz);

            if (i % 2 == 0)
                chromaSample(j, i, chr1Sz);

            if (i % 2 == 1 && chr2Sz)
                chromaSample(j, i, chr2Sz);
        }));

	return out;
}