describe('JPEG', () => {
    let pxMtx;

    before((done) => {
        let img = new Image(),
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);
            pxMtx = to2d(to2d(ctx.getImageData(0, 0, img.width, img.height).data, 4), img.width);

            done();
        };

        img.crossOrigin = 'anonymous';
        img.src = './static/index.png';
    });

    describe('Chroma subsampling', () => {
        it('Subsamples.', () => {
            console.log(chromaSubsample(pxMtx, [4, 2, 2]))

            console.log(pxMtx[0])
        });
    });

    describe('Encoder', () => {
        it('Applies DCT-II to all blocks.', (done) => {
            jpegEncode('./static/index.png').then((x) => {
                // console.table(x[0].dctBlocks[0]);
                // console.table(x[0].qBlocks[0]);
                // console.log(x[0].zzBlocks[0])
                // console.log(x[0].rleBlocks[0]);

                console.table({
                    "Source size": x[0].srcBlocks.flat(2).length,
                    "Output size": x[0].rleBlocks.flat().length,
                    "Ratio": (x[0].rleBlocks.flat().length / x[0].srcBlocks.flat(2).length * 100).toPrecision(5) + "%",
                });

                done();
            });
        });
    })
});
