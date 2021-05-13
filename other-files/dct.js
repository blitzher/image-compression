const { sqrt, SQRT2, round, cos, PI } = Math;

let Pixel = [
        [140, 144, 147, 140, 140, 155, 179, 175],
        [144, 152, 140, 147, 140, 148, 167, 179],
        [152, 155, 136, 167, 163, 162, 152, 172],
        [168, 145, 156, 160, 152, 155, 136, 160],
        [162, 148, 156, 148, 140, 136, 147, 162],
        [147, 167, 140, 155, 155, 140, 136, 162],
        [136, 156, 123, 167, 162, 144, 140, 147],
        [148, 155, 136, 155, 152, 147, 147, 136],
    ],
    DCT = [[], [], [], [], [], [], [], []];

let N = 8;

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


console.table(
    DCT
    .map(xs => xs
        .map(x => x
            .toString()
            .padStart(3)))
);