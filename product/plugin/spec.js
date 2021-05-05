
const assertEqual = (v1, v2) => {
	if (v1 != v2) throw new Error(`Value is ${v1}, expected ${v2}`);
}
function insertPixel(imageData, pixelData, start) {
	pixelData.forEach((pixel, index) => {
		imageData[start + index] = pixel;
	});
}

const canvas = document.createElement("canvas");
canvas.width = 2;
canvas.height = 2;

describe("Grayscale compression", () => {
	it("should convert a non grayscale image to grayscale", () => {
		const ctx = canvas.getContext('2d');
		const imageData = ctx.getImageData(
			0,
			0,
			canvas.width,
			canvas.height,
		);

		for (let i = 0; i < imageData.data.length; i += 4) {
			let avg =
				Math.floor(Math.random() * 255);

			imageData.data[i] = avg;
			imageData.data[i + 1] = avg;
			imageData.data[i + 2] = avg;
		}

		console.log(imageData);
		ctx.putImageData(imageData, 0, 0);
		setTimeout(() => {
			console.log(ctx.getImageData(0, 0, canvas.width, canvas.height));
		}, 1000)

	})
	it("should say ur mum my dog", () => {
		console.log("ur mum my dog");
	})
})