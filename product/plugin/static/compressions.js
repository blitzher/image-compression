function grayscale(canvas) {
	const ctx = canvas.getContext('2d');
	const imageData = ctx.getImageData(
		0,
		0,
		canvas.width,
		canvas.height,
	);

	for (let i = 0; i < imageData.data.length; i += 4) {
		let avg =
			(imageData.data[i] +
				imageData.data[i + 1] +
				imageData.data[i + 2]) /
			3;

		imageData.data[i] = avg;
		imageData.data[i + 1] = avg;
		imageData.data[i + 2] = avg;
	}

	ctx.putImageData(imageData, 0, 0);
	console.log("grey")
}

export default {
	grayscale
}