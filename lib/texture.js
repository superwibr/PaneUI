// Texture and Sheet Handling
const Texture = async (src) => {
	const image = new Image();
	image.src = src;
	await new Promise((resolve) => (image.onload = resolve));

	return {
		image,
		width: image.naturalWidth,
		height: image.naturalHeight,
	};
};

const Sheet = async (src) => {
	const image = new Image();
	image.src = src;
	await new Promise((resolve) => (image.onload = resolve));

	const texture = (x, y, width, height) => ({
		image,
		sx: x,
		sy: y,
		sWidth: width,
		sHeight: height,
	});

	return { image, texture };
};

export { Texture, Sheet };