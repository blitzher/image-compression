
const assertEqual = (v1, v2) => {
	if (v1 != v2) throw new Error(`Value is ${v1}, expected ${v2}`);
}
function insertPixel(imageData, pixelData, start) {
	pixelData.forEach((pixel, index) => {
		imageData[start + index] = pixel;
	});
}

const canvas = document.getElementById("thisCanvas");
//document.createElement("canvas");
//canvas.width = 200;
//canvas.height = 200;

describe("Grayscale compression", () => {
	it("should convert a non grayscale image to grayscale", () => {
		const ctx = canvas.getContext('2d');
		const imageData = ctx.getImageData(
			0,
			0,
			canvas.width,
			canvas.height,
		);

		let data = imageData.data

		for (let i = 0; i < data.length; i += 4) {
			let avg =
				Math.floor(Math.random() * 255);

			data[i] = avg * 2;
			data[i + 1] = avg / 2;
			data[i + 2] = avg / 3;
			data[i + 3] = 255;
		}

		let input = data.slice();

		ctx.putImageData(imageData, 0, 0);

		for (let i = 0; i < data.length; i += 4) {
			let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

			data[i] = avg;
			data[i + 1] = avg;
			data[i + 2] = avg;
			data[i + 3] = 255;
		}

		ctx.putImageData(imageData, 0, 0)

		let output = data.slice();

		console.log(input);
		console.log(output);
	})
	it("should say ur mum my dog", () => {
		console.log("ur mum my dog");

		const square = (x) => x ** 2 + 1;
		assertEqual(square(2), 4);
	})
})