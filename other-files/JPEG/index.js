/**
 * index.mjs
 * Trying to get jpeg compression working with the help of gpu.js.
 *
 * Steps towards encoding:
 *  1.) Get image pixel values.
 *      1.1) Convert RGB to Y'CbCr. (optional)
 *  2.) Split into separate colour channels.
 *  3.) Divide each channel into 8x8 components.
 *      3.1) Down-sample.
 *  4.) Apply md-DCT2 to each component.
 *  5.) Apply quantisation to each component.
 *  6.) Convert components to one dimension through zigzag pattern.
 *  7.) Use RLE on each component.
 *  8.) Then some form of Huffman encoding...
 */

//

const run = (srcURI) => {
    return new Promise((resolve, reject) => {
        const gpu = new GPU();



        let img = new Image();

        img.onload = () => {
            //let canvas = document.createElement('canvas'),
            //    ctx = canvas.getContext('2d');

            //canvas.width = img.width;
            //canvas.height = img.height;

            //ctx.drawImage(img, 0, 0)


            //let data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            const render = gpu.createKernel(function (image) {
                let pixel = image[this.thread.y][this.thread.x];
                this.color(pixel[0], pixel[1], pixel[2]);
            }).setOutput([img.width, img.height])
                .setGraphical(true);

            render(img);

            let data = render.getPixels();

            jpegEncode(data, img.width, gpu).then((x) => resolve(x));
        };

        img.crossOrigin = 'anonymous';
        img.src = srcURI;
    });
};


