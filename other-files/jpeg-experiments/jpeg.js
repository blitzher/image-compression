// Functions for use in JPEG encoding and decoding
const { min, max, round, cos, PI, SQRT2, sqrt } = Math;

const dct = (Pixel, N) => {
    let DCT = [[], [], [], [], [], [], [], []];

    const C = (x) => (x == 0 ? 1 / SQRT2 : 1);
    const cosine = (a, b) => cos(((2 * a + 1) * b * PI) / (2 * N));

    for (i = 0; i < N; i++) {
        for (j = 0; j < N; j++) {
            let temp = 0.0;

            for (x = 0; x < N; x++) {
                for (y = 0; y < N; y++) {
                    temp += cosine(x, i) * cosine(y, j) * Pixel[x][y];
                }
            }

            temp *= (1 / sqrt(2 * N)) * C(i) * C(j);

            DCT[i][j] = round(temp) % 256;
        }
    }
    return DCT;
};

const YCbCr2rgb = ([y, cb, cr]) => [
    min(max(0, round(y + 1.402 * (cr - 128))), 255),
    min(
        max(
            0,
            round(
                y -
                    0.114 * 1.772 * (cb - 128) +
                    (0.299 * 1.402 * (cr - 128)) / 0.587,
            ),
        ),
        255,
    ),
    min(max(0, round(y + 1.772 * (cb - 128))), 255),
];

const rgb2YCbCr = ([r, g, b]) => [
    min(max(0, round(0.299 * r + 0.587 * g + 0.144 * b)), 255),
    min(max(0, round(-0.299 * r - 0.587 * g + 0.886 * b)), 255),
    min(max(0, round(0.701 * r - 0.587 * g - 0.114 * b)), 255),
];
