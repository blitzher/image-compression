
export const getChannel = (srcArr, index) => {
    const gpu = new GPU();
    const channel = gpu.createKernel(function (arr, i) {
        return arr[this.thread.x * 4 + i];
    }).setOutput([srcArr.length / 4]);

    return channel(srcArr, index);
};
