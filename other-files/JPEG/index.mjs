import { range, to2d } from './src/utility.mjs';
import { getChannel } from './src/colour.mjs';
import { mdDct2 } from './src/dct.mjs';
import { drawFrame, drawImage } from './src/view.mjs';
import { drawGrayscale, toComponents } from './src/view.mjs';
import { mdDct3 } from './src/dct.mjs';
import { quantise, revertQuantise } from './src/dct.mjs';
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

const encode = (srcURI) => {
    const img = new Image();
    const gpu = new GPU();
    img.onload = () => {
        let Pixels = [
            [140, 144, 147, 140, 140, 155, 179, 175],
            [144, 152, 140, 147, 140, 148, 167, 179],
            [152, 155, 136, 167, 163, 162, 152, 172],
            [168, 145, 156, 160, 152, 155, 136, 160],
            [162, 148, 156, 148, 140, 136, 147, 162],
            [147, 167, 140, 155, 155, 140, 136, 162],
            [136, 156, 123, 167, 162, 144, 140, 147],
            [148, 155, 136, 155, 152, 147, 147, 136],
        ];

        const canvas = drawGrayscale({ img, gpu }).canvas;

        document.getElementsByTagName('body')[0].appendChild(canvas);

        let ctx = document
                .getElementsByTagName('canvas')[0]
                .getContext('webgl2'),
            imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        //console.log(toComponents(drawGrayscale.getPixels()));

        console.table(Pixels);
        console.table(mdDct2(Pixels));
        //console.table(quantise(mdDct2(Pixels)));
        console.table(mdDct3(revertQuantise(quantise(mdDct2(Pixels)))));
    };

    img.crossOrigin = 'anonymous';
    img.src = srcURI;
};

encode('index.png');
