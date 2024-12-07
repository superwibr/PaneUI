const PaneUI = ({ canvas, container, width, height, layers }) => {
	const ctx = canvas.getContext("2d");
	const layerMap = {};
	const elementsMap = {};

	const resizeCanvas = () => {
		const { width: actualWidth, height: actualHeight } = container.getBoundingClientRect();
		canvas.width = actualWidth;
		canvas.height = actualHeight;

		// clear render caches
		layers.filter(l => l.type === "static")
			.forEach(l => { if (l.cached) l.cached = null });

		updateAreas();

		render(); // Re-render on resize
	};

	const render = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		layers.forEach((layer) => {
			if (layer.type === "static" && !layer.cached) {
				const offscreen = document.createElement("canvas");
				offscreen.width = width;
				offscreen.height = height;
				const offCtx = offscreen.getContext("2d");
				drawLayer(offCtx, layer);
				layer.cached = offscreen;
			}

			if (layer.type === "static" && layer.cached) {
				ctx.drawImage(layer.cached, layer.x || 0, layer.y || 0, canvas.width, canvas.height);
			} else if (layer.type !== "static") {
				drawLayer(ctx, layer);
			}
		});
	};

	const drawLayer = (context, layer) => {
		(layer.elements || []).forEach((element) => {
			const { texture, x = 0, y = 0, width: w, height: h } = element;
			const scaleX = canvas.width / width;
			const scaleY = canvas.height / height;
			const drawWidth = w ? w * scaleX : texture.sWidth * scaleX;
			const drawHeight = h ? h * scaleY : texture.sHeight * scaleY;
			context.drawImage(
				texture.image,
				texture.sx, texture.sy, texture.sWidth, texture.sHeight,
				(layer.x || 0) * scaleX + x * scaleX, (layer.y || 0) * scaleY + y * scaleY,
				drawWidth, drawHeight
			);
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
		layers.forEach((layer, index) => {
			layer.index = index;
			if (layer.name) layerMap[layer.name] = layer;
			(layer.elements || []).forEach((el) => {
				if (el.name) elementsMap[el.name] = el;
				if (el.area) {
					const areaElement = document.createElement("div");
					areaElement.style.position = "absolute";
					areaElement.style.cursor = "pointer";
					container.appendChild(areaElement);
					el.areaElement = areaElement;
				}
			});
		});
	};

	const updateAreas = () => {
		Object.values(elementsMap).forEach((el) => {
			if (el.areaElement && !el.hidden) {
				const scaleX = container.offsetWidth / width;
				const scaleY = container.offsetHeight / height;
				const area = el.area;
				const globalX = ((layer(el.layer).x || 0) + el.x + area.x) * scaleX;
				const globalY = ((layer(el.layer).y || 0) + el.y + area.y) * scaleY;
				const areaWidth = area.width * scaleX;
				const areaHeight = area.height * scaleY;

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

	return { layer, element, hideElement, render };
};

export { PaneUI };