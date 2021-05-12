

const ycbcr = ([r, g, b]) => [
	Math.round(0.299 * r + 0.587 * g + 0.114 * b),
	Math.round((-0.1687 * r - 0.3313 * g + 0.5 * b) + 128),
	Math.round((0.5 * r - 0.4187 * g - 0.0813 * b) + 128),
];

const rgb = ([y, cb, cr]) => [
	Math.round(y + 1.402 * (cr - 128)),
	Math.round(y - 0.3441 * (cb - 128) - 0.7141 * (cr - 128)),
	Math.round(y + 1.772 * (cb - 128))
];


const rand_px = () => Math.round(Math.random() * 0xFF)
const img = [];
for (let i = 0; i < 4; i++) {
	const row = [];
	for (let j = 0; j < 4; j++) {
		row.push([rand_px(), rand_px(), rand_px()])
	}
	img.push(row);
}

/**
 * Compute the chroma subsampling on an image, and
 * @param {ycbcr[][]} im The image to perform the chroma subsampling on
 * @param {number[]} meth The chroma subsampling method, eg. [4,4,4], [4,2,0] 
 * @returns {ycbcr[][]} A new image, on which the chroma subsampling has been performed */
function chroma_subsampling(im, meth) {

	const table = [
		NaN,
		4,
		2,
		NaN,
		1
	]
	/* Using 4:2:0 as default */
	const luma_sz = table[meth[0]] || table[4];
	const chr1_sz = table[meth[1]] || table[2];
	const chr2_sz = table[meth[2]] || table[0];

	/* setup output array */
	let out = [];
	for (let i = 0; i < 4; i++) {
		const row = [];
		for (let j = 0; j < 4; j++) {
			row.push([0, 0, 0])

		}
		out.push(row)
	}

	function sample_at(x, y, indx, samp_sz) {
		if (x % samp_sz === 0) {
			/* append appropritate amount of samples
			* to output */
			for (let j = 0; j < samp_sz; j++)
				for (let i = 0; i < samp_sz; i++) {
					//console.log(y, x);
					out[Math.min(y + j, 3)][Math.min(x + i, 3)][indx] = (im[y][x][indx]);
				}
		}
	}
	function chroma_sample(x, y, samp_sz) {

		if (x % samp_sz === 0) {
			const chroma = [im[y][x][1], im[y][x][2]]
			for (let j = 0; j < samp_sz; j++)
				for (let i = 0; i < samp_sz; i++) {
					//console.log(y, x);
					out[Math.min(y + j, 3)][Math.min(x + i, 3)][1] = chroma[0];
					out[Math.min(y + j, 3)][Math.min(x + i, 3)][2] = chroma[1];
				}
		}
	}


	for (let row_i = 0; row_i < 4; row_i++) {
		const row = [];
		for (let col_i = 0; col_i < 4; col_i++) {
			sample_at(col_i, row_i, 0, luma_sz);

			if (row_i % 2 == 0)
				chroma_sample(col_i, row_i, chr1_sz);
			if (row_i % 2 == 1 && chr2_sz)
				chroma_sample(col_i, row_i, chr2_sz);
		}
	}

	return out;
}

console.log("PRE SUBSAMPLING")
const ycbcr_img = img.map(row => row.map(px => ycbcr(px)));
console.table(ycbcr_img);
const output = chroma_subsampling(ycbcr_img, [4, 4, 4]);
console.table(output)

