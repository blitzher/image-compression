'use strict';

const cosines = (gpu) =>
	(gpu || new GPU({ mode: 'cpu' })).createKernel(
		function () {
			let { x, y } = this.thread;

			Math.cos(((2 * x + 1) * y * Math.PI) / 16);
		},
		{
			output: [8, 8],
			precision: 'single',
		},
	);

/**
 * FDCT function based on JPEG spec of 1992 from CCITT Recommendation T.81.
 * @param {number[][]} mcu
 * @param {object} [gpu]
 * @returns {number[][]} MCU with FDCT applied.
 */
const toDct = (mcu, gpu) =>
	(gpu || new GPU({ mode: 'cpu' })).createKernel(
		function (mcu, C) {
			let u = this.thread.x,
				v = this.thread.y,
				sum = 0.0;

			for (let x = 0; x < 8; x++) {
				for (let y = 0; y < 8; y++) {
					sum +=
						mcu[y][x] *
						Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
						Math.cos(((2 * y + 1) * v * Math.PI) / 16);
				}
			}

			return Math.round((1 / 4) * C[u] * C[v] * sum);
		},
		{
			output: [8, 8],
			precision: 'single',
		},
	)(mcu, [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1]);

const toDctMap = (mcuArr, gpu) =>
	(gpu || new GPU({ mode: 'cpu' })).createKernel(
		function (arr, C) {
			let u = this.thread.x,
				v = this.thread.y,
				sum = 0.0;

			for (let x = 0; x < 8; x++) {
				for (let y = 0; y < 8; y++) {
					sum +=
						arr[this.thread.z][y][x] *
						// cosines[x][u] *
						// cosines[y][v];
						Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
						Math.cos(((2 * y + 1) * v * Math.PI) / 16);
				}
			}

			return Math.round((1 / 4) * C[u] * C[v] * sum);
		},
		{
			output: [8, 8, mcuArr.length],
			precision: 'single',
		},
	)(mcuArr, [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1]);


const toDctMap2 = (mcuArr, gpu) => {
    let _gpu = gpu || new GPU({ mode: 'cpu' });

    let fdct = _gpu.createKernel(
        function (arr, C, cosines) {
            let u = this.thread.x,
                v = this.thread.y,
                sum = 0.0;

            for (let x = 0; x < 8; x++)
                for (let y = 0; y < 8; y++)
                    sum +=
                        (arr[this.thread.z][y][x] - 128) *
                        cosines[u][x] *
                        cosines[v][y];

            return Math.round((1 / 4) * C[u] * C[v] * sum);
        },
        {
            output: [8, 8, mcuArr.length],
            precision: 'single',
        },
    );

    let cosines = _gpu.createKernel(
        function () {
            let { x, y } = this.thread;

            return Math.cos(((2 * x + 1) * y * Math.PI) / 16);
        },
        {
            output: [8, 8],
            precision: 'single',
        },
    );

    let out = _gpu.combineKernels(fdct, cosines, function (arr, C) {
        return fdct(arr, C, cosines());
    });

    return out(mcuArr, [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1]);
};

/**
 * IDCT function based on JPEG spec of 1992 from CCITT Recommendation T.81.
 * @param {number[][]} mcu MCU with FDCT applied.
 * @returns {number[][]} MCU with FDCT reversed.
 */
const fromDct = (mcu, gpu) =>
	(gpu || new GPU({ mode: 'cpu' })).createKernel(
		function (mcu, C) {
			let x = this.thread.x,
				y = this.thread.y,
				sum = 0.0;

			for (let u = 0; u < 8; u++) {
				for (let v = 0; v < 8; v++) {
					sum +=
						mcu[v][u] *
						C[u] *
						C[v] *
						Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
						Math.cos(((2 * y + 1) * v * Math.PI) / 16);
				}
			}

			return Math.round(sum / 4);
		},
		{
			output: [8, 8],
			precision: 'single',
		},
	)(mcu, [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1]);

const fromDctMap = (mcuArr, gpu) =>
	(gpu || new GPU({ mode: 'cpu' })).createKernel(
		function (arr, C) {
			let { x, y, z } = this.thread,
				sum = 0.0;

			for (let u = 0; u < 8; u++) {
				for (let v = 0; v < 8; v++) {
					sum +=
						arr[z][v][u] *
						C[u] *
						C[v] *
						Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
						Math.cos(((2 * y + 1) * v * Math.PI) / 16);
				}
			}

			return Math.round(sum / 4);
		},
		{
			output: [8, 8, mcuArr.length],
			precision: 'single',
		},
	)(mcuArr, [1 / Math.SQRT2, 1, 1, 1, 1, 1, 1, 1]);

/**
 * Python style range function.
 * @param {number} a Length
 * @returns
 *//**
* Python style range function.
* @param {number} a Start
* @param {number} b End
* @param {number} c Step
* @returns
*/
const range = (a, b, c) =>
	new Array(~~((!b ? a : b - a) / (c || 1) + 0.5))
		.fill()
		.map((_, i) => i * (c || 1) + (!b ? 0 : a));

/**
 * Get colour component of image data.
 * @param {Array} data
 * @param {number} offset
 * @param {number} N
 * @returns
 */
const getChannel = (data, offset, N) =>
	range(data.length / N).map((i) => data[i + offset]);

/**
 * Get all colour components of image data.
 * @param {Array} data Input data.
 * @param {number} n Number of channels/components.
 * @returns {Array[]} [number[], ..., number[]]
 */
const getAllChannels = (data, n) =>
	range(n).map((i) => range(0, data.length, n).map((j) => data[j + i]));

/**
 * Convert matrix to matrix of 8x8 MCU blocks.
 * @param {number[][]} mtx
 * @returns
 */
const toMcuBlocks = (mtx) => {
	let out = range(Math.floor(mtx.length / 8)).map(() =>
		range(Math.floor(mtx[0].length / 8)),
	);

	for (let i = 0; i < out.length; i++) {
		for (let j = 0; j < out[0].length; j++) {
			let tmp = range(8).map(() => range(8));

			for (let x = 0; x < 8; x++) {
				for (let y = 0; y < 8; y++) {
					tmp[x][y] = mtx[x + i * 8][y + j * 8];
				}
			}

			out[i][j] = tmp;
		}
	}

	return out;
};

/**
 * Convert array to 2D by row width.
 * @param {Array} arr Array to transform.
 * @param {number} width Row width.
 * @returns
 */
const to2d = (arr, width) =>
	range(arr.length / width).map((_, i) =>
		range(width).map((_, j) => arr[i * width + j]),
	);


/**
 * Flatten matrix of MCU blocks to image 2D component.
 * @param {Array} mcuMtx
 * @param {number} w
 * @param {number} h
 * @returns
 */
const flatMcuMtx = (mcuMtx, w, h) => {
	let out = range(h).map(() => range(w));

	for (let i = 0; i < h / 8; i++)
		for (let j = 0; j < w / 8; j++)
			for (let x = 0; x < 8; x++)
				for (let y = 0; y < 8; y++)
					out[i * 8 + x][j * 8 + y] = mcuMtx[i][j][x][y];

	return out;
};

/**
 * Zero biased RLE implementation.
 * @param {number[]} data Array of values.
 * @returns Array with zero runs encoded as a zero followed by the run length.
 */
const zeroRle = (data) => {
	let out = [];

	let i = 0,
		c = 0;

	while (i < data.length) {
		if (data[i] === 0) {
			c++;
			i++;
			if (data[i + 1] !== 0) {
				out.push(0);
				out.push(c);
				c = 0;
				i++;
			}
		} else {
			out.push(data[i]);
			i++;
		}
	}

	return out;
};

const dpcm = (comp) => comp.map((dc, i, arr) => i === 0 ? dc : dc - arr[i - 1]);

/**
 * Supsample chrominance component.
 * @param {number[][][]} comps Color component matrix.
 *
 * Is up of arrays of matrices, existing
 * `[ [[Y]], [[Cb]], [[CR]] ]`
 * @param {number[]} rate e.g. [4,4,4] or [4,2,2].
 */
const sample = (comps, rate) => {
	/* hack */
	rate = rate.map((v) => (v <= 0.1 ? 0.1 : v));

	let [YMat, CbMat, CrMat] = comps;

	/* Setup subsampling spaces */
	let // luma_sz = Math.floor(4 / rate[0]),
		chr1Sz = Math.floor(4 / rate[1]),
		chr2Sz = Math.floor(4 / rate[2]);

	/* Calculate and append rows to OutCbMat and OutCrMat, depending on chr1_sz */
	let outCbMat = [],
		outCrMat = [];

	for (let i = 0; i < CbMat.length; i++) {
		/* All even rows */
		if (i % 2 === 0) {
			let CbRow = CbMat[i].filter(
				(_, i) => i % chr1Sz === 0 && chr1Sz < 5,
			);
			let CrRow = CrMat[i].filter(
				(_, i) => i % chr1Sz === 0 && chr1Sz < 5,
			);

			if (CbRow.length) outCbMat.push(CbRow);
			if (CrRow.length) outCrMat.push(CrRow);
		} else {
			/* All odd rows */
			let CbRow = CbMat[i].filter(
				(_, i) => i % chr2Sz === 0 && chr2Sz < 5,
			);
			let CrRow = CrMat[i].filter(
				(_, i) => i % chr2Sz === 0 && chr2Sz < 5,
			);
			if (CbRow.length) outCbMat.push(CbRow);
			if (CrRow.length) outCrMat.push(CrRow);
		}
	}

	/* Return the same type as input */
	return [YMat, outCbMat, outCrMat];
};

const upscaleComps = (comps, [_, a, b]) => {
	a = Math.floor(4 / a);
	if (b != 0) b = Math.floor(4 / b);

	function upscaleMatByFactor(mat, hor, ver) {
		let out = [],
			rows = [];

		for (let i of range(mat.length)) {
			let row = [];
			for (let j of range(mat[i].length)) {
				for (let _ of range(hor)) row.push(mat[i][j]);
			}

			rows.push(row);
		}
		for (let i of range(rows.length)) {
			for (let _ of range(ver)) {
				out.push(rows[i]);
			}
		}
		return out;
	}

	let OutYMat = comps[0],
		OutCbMat = [],
		OutCrMat = [];

	if (b === 0) {
		OutCbMat = upscaleMatByFactor(comps[1], a, 2);
		OutCrMat = upscaleMatByFactor(comps[2], a, 2);
	} else {
		for (let i of range(comps[1].length)) {
			OutCbMat.push(
				upscaleMatByFactor([comps[1][i]], i % 2 ? b : a, 1).flat(),
			);
			OutCrMat.push(
				upscaleMatByFactor([comps[2][i]], i % 2 ? b : a, 1).flat(),
			);
		}
	}

	return [OutYMat, OutCbMat, OutCrMat];
};

const upscale2 = ([Y, Cb, Cr], [J, a, b]) => {
	let out = [Y, [], []];

	for (let i = 0; i < Y.length; i += 2) {
		let tmp = [];

		for (let j = 0; j < Y[0].length; j += 2) {
			tmp.push(Cb[i]);
		}
	}

	out[1] = range(b).map((row) =>
		row.flatMap((v) => new Array((Y.length / 4) * b).fill(v)),
	);
	out[2] = Cr.map((row) =>
		row.flatMap((v) => new Array((Y.length / 4) * b).fill(v)),
	);

	return out;
};

const sampleUp = ([Y, Cb, Cr], [J, a, b]) => [
	Y,
	Cb.map((x, i) => x.flatMap((v) => new Array(4 / a).fill(v))),
	Cr.map((x, i) => x.flatMap((v) => new Array(4 / a).fill(v))),
];

const quantise = (mcu, table, factor, gpu) =>
	(gpu || new GPU({ mode: 'cpu' })).createKernel(
		function (mcu, table, quality) {
			let { x, y } = this.thread,
				scaleFactor = 0;

			if (quality < 50) {
				scaleFactor = 5000 / quality;
			} else {
				scaleFactor = 200 - quality * 2;
			}

			return Math.round(
				mcu[x][y] / ((scaleFactor * table[x][y] + 50) / 100),
			);
		},
		{
			output: [8, 8],
			precision: 'single',
			returnType: 'Integer',
		},
	)(mcu, table, factor);

/**
 * Quantise MCU array.
 * @param {Array(8)[][]} mcuArr
 * @param {Array(8)[]} table
 * @param {number} quality
 * @param {object} gpu
 * @returns
 */
const quantiseMap = (mcuArr, table, quality, gpu) =>
	(gpu || new GPU({ mode: 'cpu' })).createKernel(
		function (mcu, table, quality) {
			let { x, y, z } = this.thread,
				scaleFactor = 0;

			if (quality < 50) {
				scaleFactor = 5000 / quality;
			} else {
				scaleFactor = 200 - quality * 2;
			}

			return Math.round(
				mcu[z][x][y] / ((scaleFactor * table[x][y] + 50) / 100),
			);
		},
		{
			output: [8, 8, mcuArr.length],
			precision: 'single',
			returnType: 'Integer',
		},
	)(mcuArr, table, quality);

const deQuantiseMap = (mcuArr, table, quality, gpu) =>
	(gpu || new GPU({ mode: 'cpu' })).createKernel(
		function (mcu, table, quality) {
			let { x, y, z } = this.thread,
				scaleFactor = 0;

			if (quality < 50) {
				scaleFactor = 5000 / quality;
			} else {
				scaleFactor = 200 - quality * 2;
			}

			return Math.round(
				mcu[z][x][y] * ((scaleFactor * table[x][y] + 50) / 100),
			);
		},
		{
			output: [8, 8, mcuArr.length],
			precision: 'single',
			returnType: 'Integer',
		},
	)(mcuArr, table, quality);

const levelShift = (mcuArr) =>
	mcuArr.map((mcu) => mcu.map((row) => row.map((val) => val - 128)));

const levelShiftUp = (mcuArr) =>
	mcuArr.map((mcu) => mcu.map((row) => row.map((val) => val + 128)));

const drawComponents = ([C0, C1, C2], gpu) => {
	let render = (gpu || new GPU()).createKernel(
		function (c0, c1, c2) {
			let { x, y } = this.thread;

			this.color(c0[x][y], c1[x][y], c2[x][y]);
		},
		{
			output: [C0.length, C0[0].length],
			graphical: true,
		},
	);

	render(C0, C1, C2);

	return render.getPixels();
};

const splice = ([a, b, c], w, h, gpu) =>
	(gpu || new GPU()).createKernel(
		function (a, b, c) {
			let x = this.thread.x;

			return [a[x], b[x], c[x]];
		},
		{
			output: [w * h],
		},
	)(a, b, c);

const crop = (mtx, w, h) => mtx.slice(0, h).map((r) => r.slice(0, w));

const fromYCbCr = (data, n) => {
	let out = [];

	for (let i = 0; i < data.length; i += n) {
		let y = data[i],
			cb = data[i + 1],
			cr = data[i + 2];

		out.push(
			Math.min(Math.max(0, Math.round(y + 1.402 * (cr - 128))), 255),
		);
		out.push(
			Math.min(
				Math.max(
					0,
					Math.round(y - 0.3441 * (cb - 128) - 0.7141 * (cr - 128)),
				),
				255,
			),
		);
		out.push(
			Math.min(Math.max(0, Math.round(y + 1.772 * (cb - 128))), 255),
		);
		if (n === 4) out.push(255);
	}

	return out;
};

const fromRgb = (data, n) => {
	let out = [];

	for (let i = 0; i < data.length; i += n) {
		let r = data[i],
			g = data[i + 1],
			b = data[i + 2];

		out.push(
			Math.min(
				Math.max(0, Math.round(0.299 * r + 0.587 * g + 0.114 * b)),
				255,
			),
		);
		out.push(
			Math.min(
				Math.max(
					0,
					Math.round(-0.1687 * r - 0.3313 * g + 0.5 * b + 128),
				),
				255,
			),
		);
		out.push(
			Math.min(
				Math.max(
					0,
					Math.round(0.5 * r - 0.4187 * g - 0.0813 * b + 128),
				),
				255,
			),
		);
		if (n === 4) out.push(255);
	}

	return out;
};

const newQuantTable = (table, quality, gpu) =>
    (gpu || new GPU({ mode: 'cpu' })).createKernel(
        function (table, quality) {
            let { x, y } = this.thread,
                scaleFactor = 0;

            if (quality < 50) {
                scaleFactor = 5000 / quality;
            } else {
                scaleFactor = 200 - quality * 2;
            }

            return Math.round((scaleFactor * table[x][y] + 50) / 100);
        },
        {
            output: [8, 8],
            precision: 'single',
            returnType: 'Integer',
        },
    )(table, quality);

const encodeJpeg = (srcUri, qualityLuma, qualityChroma, sampleRate, worker) =>
	new Promise((resolve) => {
		const
			gpu = new GPU(),
			img = new Image();

		// Quantisation tables as provided by the JPEG specification.
		let chromaTable = [
			[17, 18, 24, 47, 99, 99, 99, 99],
			[18, 21, 26, 66, 99, 99, 99, 99],
			[24, 26, 56, 99, 99, 99, 99, 99],
			[47, 66, 99, 99, 99, 99, 99, 99],
			[99, 99, 99, 99, 99, 99, 99, 99],
			[99, 99, 99, 99, 99, 99, 99, 99],
			[99, 99, 99, 99, 99, 99, 99, 99],
			[99, 99, 99, 99, 99, 99, 99, 99],
		],
			lumaTable = [
				[16, 11, 10, 16, 24, 40, 51, 61],
				[12, 12, 14, 19, 26, 58, 60, 55],
				[14, 13, 16, 24, 40, 57, 69, 56],
				[14, 17, 22, 29, 51, 87, 80, 62],
				[18, 22, 37, 56, 68, 109, 103, 77],
				[24, 35, 55, 64, 81, 104, 113, 92],
				[49, 64, 78, 87, 103, 121, 120, 101],
				[72, 92, 95, 98, 112, 100, 103, 99],
			];

		img.onload = () => {
			let initWidth = img.width,
				initHeight = img.height,
				imgWidth = initWidth - (initWidth % 8),
				imgHeight = initHeight - (initHeight % 8);

			// Render function to get pixel values from HTML Image object.
			const render = gpu.createKernel(
				function (image) {
					let px = image[this.thread.y][this.thread.x];

					this.color(px[0], px[1], px[2]);
				},
				{
					output: [imgWidth, imgHeight],
					graphical: true,
				},
			);

			worker.onmessage = (ev) => {
				resolve({
					components: {
						Y: ev.data.encodedComps[0],
						Cb: ev.data.encodedComps[1],
						Cr: ev.data.encodedComps[2],
					},
					compressed: ev.data.compressed,
					width: imgWidth,
					height: imgHeight,
					lumaTable,
					chromaTable,
					qualityChroma,
					qualityLuma,
					sampleRate,
				});
			};

			render(img); // Render image before exstracting pixels.

			worker.postMessage({
				imgWidth,
				imgHeight,
				lumaTable,
				chromaTable,
				qualityChroma,
				qualityLuma,
				sampleRate,
				pxs: render.getPixels(), // Extracted pixels.
			});
		};

		img.src = srcUri;
	});

const decodeJpeg = (encoded, context) => {
	const
		gpu = new GPU({ mode: 'gpu', context }),
		cpu = new GPU({ mode: 'cpu' });

	const render = gpu.createKernel(
		function (pxMtx) {
			let { x, y } = this.thread,
				N = this.constants.N;

			this.color(
				pxMtx[N - y][x][0] / 255,
				pxMtx[N - y][x][1] / 255,
				pxMtx[N - y][x][2] / 255,
			);
		},
		{
			output: [encoded.width, encoded.height],
			constants: {
				N: encoded.height - 1,
			},
			graphical: true,
		},
	);

	let [Y, Cb, Cr] = [
		to2d(
			levelShiftUp(fromDctMap(
				deQuantiseMap(
					encoded.components.Y,
					encoded.lumaTable,
					encoded.qualityLuma,
					cpu,
				),
			)),
			encoded.width / 8,
		),
		to2d(
			levelShiftUp(fromDctMap(
				deQuantiseMap(
					encoded.components.Cb,
					encoded.chromaTable,
					encoded.qualityChroma,
					cpu,
				),
			)),
			encoded.width / 8,
		),
		to2d(
			levelShiftUp(fromDctMap(
				deQuantiseMap(
					encoded.components.Cr,
					encoded.chromaTable,
					encoded.qualityChroma,
					cpu,
				),
			)),
			encoded.width / 8,
		),
	],
		composed = [
			flatMcuMtx(Y, encoded.width, encoded.height).flat(),
			flatMcuMtx(Cb, encoded.width, encoded.height).flat(),
			flatMcuMtx(Cr, encoded.width, encoded.height).flat(),
		],
		spliced = splice(composed, encoded.width, encoded.height, cpu);

	let drawable = to2d(
		to2d(fromYCbCr(spliced.map((x) => Array.from(x)).flat(), 3), 3),
		encoded.width,
	);

	render(drawable);
};

const jpeg = () => {
	// Shared worker thread to avoid spawning new threads.
	const worker = new Worker('plugin/jpeg/src/jpeg.worker.js');

	return {
		encode: (src, qualityLuma, qualityChroma, sampleRate) =>
			encodeJpeg(src, qualityLuma, qualityChroma, sampleRate, worker),
		decode: (encoded, context) => decodeJpeg(encoded, context),
		close: () => worker.terminate(),
	};
};

/**
 * JPEG method object constructor.
 * @param {object} config
 * @param {string} [config.srcUri] Optional image src.
 * @param {object} [config.gpu] Optional inherited GPU.JS gpu instance.
 * @param {HTMLCanvasElement} [config.canvas]
 * @returns {object} JPEG method object.
 */
const JPEG = async ({ srcUri, gpu, cpu, canvas }) => {
	let img = new Image(),
		_canvas = canvas || document.createElement('canvas');

	const _gpu = gpu || new GPU({ mode: 'gpu', canvas: _canvas }),
		_cpu = cpu || new GPU({ mode: 'cpu' }),
		chromaTable = [
			[17, 18, 24, 47, 99, 99, 99, 99],
			[18, 21, 26, 66, 99, 99, 99, 99],
			[24, 26, 56, 99, 99, 99, 99, 99],
			[47, 66, 99, 99, 99, 99, 99, 99],
			[99, 99, 99, 99, 99, 99, 99, 99],
			[99, 99, 99, 99, 99, 99, 99, 99],
			[99, 99, 99, 99, 99, 99, 99, 99],
			[99, 99, 99, 99, 99, 99, 99, 99],
		],
		lumaTable = [
			[16, 11, 10, 16, 24, 40, 51, 61],
			[12, 12, 14, 19, 26, 58, 60, 55],
			[14, 13, 16, 24, 40, 57, 69, 56],
			[14, 17, 22, 29, 51, 87, 80, 62],
			[18, 22, 37, 56, 68, 109, 103, 77],
			[24, 35, 55, 64, 81, 104, 113, 92],
			[49, 64, 78, 87, 103, 121, 120, 101],
			[72, 92, 95, 98, 112, 100, 103, 99],
		];

	let encode = () => {
		encodeJpeg(srcUri, 100, 20).then((encoded) => {
			decodeJpeg(encoded, canvas);
		});
	};

	encode();

	return {
		toDct: (mcu) => toDct(mcu, _cpu),
		fromDct: (mcu) => fromDct(mcu, _gpu),
		toBlocks: toMcuBlocks,
		fromBlocks: flatMcuMtx,
		toDctMap: (mcuArr) => toDctMap(mcuArr, _cpu),
		fromDctMap: (mcuArr) => fromDctMap(mcuArr, _gpu),
		sample,
		upscaleComps,
		imgWidth: img.width,
		imgHeight: img.height,
		chromaQuantise: (mcu, factor) =>
			quantise(mcu, chromaTable, factor, _gpu),
		lumaQuantise: (mcu, factor) => quantise(mcu, lumaTable, factor, _gpu),
	};
};
