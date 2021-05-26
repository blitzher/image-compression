/**
 * Non-GPU.JS JPEG methods for reference.
 */

const fdctControlImpl = (mcu) => {
    let out = [];

    let C = [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1];

    for (let u = 0; u < 8; u++) {
        out.push([]);

        for (let v = 0; v < 8; v++) {
            let local = 0.0;

            for (let x = 0; x < 8; x++) {
                for (let y = 0; y < 8; y++) {
                    local +=
                        mcu[x][y] *
                        Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                        Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }

            out[u].push(Math.round((1 / 4) * C[u] * C[v] * local));
        }
    }

    return out;
};

const idctControlImpl = (mcu) => {
    let out = [];

    let C = [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1];

    for (let y = 0; y < 8; y++) {
        out.push([]);

        for (let x = 0; x < 8; x++) {
            let local = 0.0;

            for (let u = 0; u < 8; u++) {
                for (let v = 0; v < 8; v++) {
                    local +=
                        C[u] *
                        C[v] *
                        mcu[v][u] *
                        Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                        Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }

            out[y].push(Math.round((1 / 4) * local));
        }
    }

    return out;
};