const PaneUI = ({ canvas, container, width, height, layers }) => {
	const ctx = canvas.getContext("2d");
	const layerMap = {};
	const elementsMap = {};
	const elements = [];

	ctx.imageSmoothingEnabled = false;

	const renderCanvas = document.createElement("canvas");
	const rctx = renderCanvas.getContext("2d");
	rctx.imageSmoothingEnabled = false;

	let displayScaleX = canvas.width / width;
	let displayScaleY = canvas.height / height;
	let scaleX = Math.ceil(displayScaleX);
	let scaleY = Math.ceil(displayScaleY);

	const resizeCanvas = () => {
		const actualWidth = container.clientWidth;
		const actualHeight = container.clientHeight;

		canvas.width = actualWidth;
		canvas.height = actualHeight;

		displayScaleX = canvas.width / width;
		displayScaleY = canvas.height / height;
		scaleX = Math.ceil(displayScaleX);
		scaleY = Math.ceil(displayScaleY);

		renderCanvas.width = width * scaleX;
		renderCanvas.height = height * scaleY;

		// clear render caches
		layers.filter(l => l.type === "static")
			.forEach(l => { if (l.cached) l.cached = null });

		updateAreas();

		render(); // Re-render on resize
	};

	const render = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		rctx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);

		layers.forEach((layer) => {
			if (layer.type === "static" && !layer.cached) {
				const offscreen = document.createElement("canvas");
				offscreen.width = renderCanvas.width;
				offscreen.height = renderCanvas.height;
				const offCtx = offscreen.getContext("2d");
				offCtx.imageSmoothingEnabled = false;
				drawLayer(offCtx, layer);
				layer.cached = offscreen;
			}

			if (layer.type === "static" && layer.cached) {
				rctx.drawImage(layer.cached, layer.x || 0, layer.y || 0, renderCanvas.width, renderCanvas.height);
			} else if (layer.type !== "static") {
				rctx.imageSmoothingEnabled = false;
				drawLayer(rctx, layer);
			}
		});

		ctx.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);
	};

	const drawLayer = (context, layer) => {
		(layer.elements || []).forEach((element) => {
			if (element.enabled === false) return;

			const { texture, x = 0, y = 0, width: w, height: h } = element;
			const twidth = (texture.sWidth || texture.width);
			const theight = (texture.sHeight || texture.height);

			const drawWidth = w
				? w * scaleX
				: h
					? twidth / theight * h * scaleY
					: twidth * scaleX;
			const drawHeight = h
				? h * scaleY
				: w
					? theight / twidth * drawWidth
					: theight * scaleY;

			if (typeof texture.sx === "undefined") {
				// normal texture
				context.drawImage(
					texture.image,
					(layer.x || 0) * scaleX + x * scaleX, (layer.y || 0) * scaleY + y * scaleY,
					drawWidth, drawHeight
				);
			} else {
				// texture as region on sheet
				context.drawImage(
					texture.image,
					texture.sx, texture.sy, texture.sWidth, texture.sHeight,
					(layer.x || 0) * scaleX + x * scaleX, (layer.y || 0) * scaleY + y * scaleY,
					drawWidth, drawHeight
				);
			}
		});
	};

	const layer = (identifier) => {
		if (typeof identifier === "string") return layerMap[identifier];
		return layers[identifier];
	};

	const element = (name) => elementsMap[name];

	const hideElement = (elementName) => {
		const el = elementsMap[elementName];
		if (el) el.hidden = true;
		render();
	};

	const setupLayers = () => {
		elements.length = 0;
		layers.forEach((layer, index) => {
			layer.index = index;
			if (layer.name) layerMap[layer.name] = layer;
			(layer.elements || []).forEach((el) => {
				el.layer = layer;
				if (el.name) elementsMap[el.name] = el;
				if (el.area) {
					const areaElement = document.createElement("div");
					areaElement.style.position = "absolute";
					areaElement.style.cursor = "pointer";
					container.appendChild(areaElement);
					el.areaElement = areaElement;
				}
				elements.push(el);
			});
		});
	};

	const updateAreas = () => {
		elements.forEach((el) => {
			if (el.areaElement && !el.hidden) {
				const { texture, x: ex = 0, y: ey = 0, width: w, height: h } = el;

				const area = el.area;
				const globalX = ((el.layer.x || 0) + ex + (area.x || 0)) * displayScaleX;
				const globalY = ((el.layer.y || 0) + ey + (area.y || 0)) * displayScaleY;

				const twidth = (texture.sWidth || texture.width);
				const theight = (texture.sHeight || texture.height);

				const areaWidth = w
					? w * displayScaleX
					: h
						? twidth / theight * h * displayScaleY
						: twidth * displayScaleX;
				const areaHeight = h
					? h * displayScaleY
					: w
						? theight / twidth * areaWidth
						: theight * displayScaleY;

				Object.assign(el.areaElement.style, {
					left: `${globalX}px`,
					top: `${globalY}px`,
					width: `${areaWidth}px`,
					height: `${areaHeight}px`,
				});
			} else if (el.areaElement) {
				el.areaElement.style.display = "none";
			}
		});
	};

	window.addEventListener("resize", resizeCanvas);
	resizeCanvas(); // Initial setup
	setupLayers();
	updateAreas();

	return { layer, element, hideElement, render };
};

export { PaneUI };