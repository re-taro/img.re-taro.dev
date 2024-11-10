import { Hono } from "hono";
import { accepts } from "hono/accepts";
import { optimizeImage } from "@re-taro/image-optimizer";

const app = new Hono();

const FOREVER_CACHE_CONTROL = "public, max-age=31536000, immutable";

app.get("*", async (c) => {
	const type = accepts(c, {
		default: "identity",
		header: "Accept",
		supports: ["image/webp", "*/*", "image/*"],
	});

	const isWebp = type === "image/webp";

	const url = new URL(c.req.url);

	const imageUrl = c.req.query("url");
	if (!imageUrl || !URL.canParse(imageUrl)) {
		return c.text("valid url is required", { status: 400 });
	}

	const cache = caches.default;
	url.searchParams.append("webp", isWebp.toString());
	const cacheKey = new Request(url.toString());
	const cachedResponse = await cache.match(cacheKey);
	if (cachedResponse) {
		return cachedResponse;
	}

	const width = c.req.query("w");
	const widthInt = width ? Number.parseInt(width) : undefined;
	const quality = c.req.query("q");
	const qualityInt = quality ? Number.parseInt(quality) : undefined;

	const imgRes = await fetch(imageUrl, {
		cf: { cacheKey: imageUrl },
	});
	if (!imgRes.ok) {
		return c.text("image not found", { status: 404 });
	}

	const srcImage = await imgRes.arrayBuffer();
	const contentType = imgRes.headers.get("content-type") || undefined;

	if (contentType && ["image/gif", "image/svg+xml"].includes(contentType)) {
		const response = new Response(srcImage, {
			headers: {
				"Cache-Control": FOREVER_CACHE_CONTROL,
				"Content-Type": contentType,
			},
		});
		c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
		return response;
	}

	const format = isWebp
		? "webp"
		: contentType === "image/jpeg"
			? "jpeg"
			: "png";

	const image = await optimizeImage({
		format,
		image: srcImage,
		quality: qualityInt,
		width: widthInt,
	});

	const response = new Response(image, {
		headers: {
			"Cache-Control": FOREVER_CACHE_CONTROL,
			"Content-Type": `image/${format}`,
			"date": new Date().toUTCString(),
		},
	});
	c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
	return response;
});

export default app;
