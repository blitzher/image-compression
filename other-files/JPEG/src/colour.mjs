
export const getChannel = (srcArr, index, GPU) => {
    const gpu = GPU || new GPU();
    const channel = gpu.createKernel(function (arr, i) {
        return arr[this.thread.x * 4 + i];
    }).setOutput([srcArr.length / 4]);

    return channel(srcArr, index);
};

// Equation taken from https://sistenix.com/rgb2ycbcr.html
export const rgb2yCbCr = ([r, g, b]) => [
    Math.round(16 + (65.738 * r) / 256 + (129.057 * g) / 256 + (25.064 * b) / 256),
    Math.round(128 - (37.945 * r) / 256 - (74.494 * g) / 256 + (112.439 * b) / 256),
    Math.round(128 + (112.439 * r) / 256 - (94.154 * g) / 256 - (18.285 * b) / 256),
];
