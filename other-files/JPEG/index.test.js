describe('JPEG', () => {
    it('Applies DCT-II to all blocks.', (done) => {
        jpegEncode('./static/index.png').then((x) => {
            console.log(x);
            done();
        });
    });
});
