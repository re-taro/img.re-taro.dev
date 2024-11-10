import WASM from "./optimizer.wasm";
import Optimizer from "./optimizer.js";

const optimizer = Optimizer({
	instantiateWasm: async (imports, receiver) => {
		receiver(await WebAssembly.instantiate(WASM, imports));
	},
});

export async function optimizeImage({
	format = "webp",
	height = 0,
	image,
	quality = 100,
	width = 0,
}: {
	image: BufferSource;
	format?: "jpeg" | "png" | "webp";
	height?: number;
	quality?: number;
	width?: number;
}) {
	return optimizer.then(({ optimize }) =>
		optimize(image, width, height, quality, format),
	);
}
