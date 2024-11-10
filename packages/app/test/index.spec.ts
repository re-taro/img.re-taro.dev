import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { UnstableDevWorker } from "wrangler";
import { unstable_dev } from "wrangler";

const images = ["test01.png", "test02.jpg"];
function imageUrl(image: string) {
	return `https://raw.githubusercontent.com/re-taro/img.re-taro.dev/main/assets/${image}`;
}

describe("img.re-taro.dev", () => {
	let worker: UnstableDevWorker;
	let time: number;

	beforeAll(async () => {
		worker = await unstable_dev("./src/index.ts", {
			experimental: { disableExperimentalWarning: true },
			ip: "127.0.0.1",
		});
		time = Date.now();
	});

	afterAll(async () => {
		if (worker)
			await worker.stop();
		time = 0;
	});

	it("get /", async () => {
		const res = await worker.fetch("/");

		expect(res.status).toBe(400);
		expect(await res.text()).toBe("valid url is required");
	});

	it("not found", async () => {
		for (let i = 0; i < images.length; i++) {
			const url = imageUrl(`_${images[i]}`);
			const res = await worker.fetch(`/?url=${encodeURI(url)}&t=${time}`, {
				headers: { accept: "image/webp,image/jpeg,image/png" },
			});
			expect(res.status).toBe(404);
		}
	});

	it("webp", async () => {
		const types = ["webp", "webp"];
		for (let i = 0; i < images.length; i++) {
			const url = imageUrl(images[i]);
			const res = await worker.fetch(`/?url=${encodeURI(url)}&t=${time}`, {
				headers: { accept: "image/webp,image/jpeg,image/png" },
			});
			expect(res.status).toBe(200);
			expect(Object.fromEntries(res.headers.entries())).toMatchObject({
				"content-type": `image/${types[i]}`,
			});
			expect(res.headers.get("cf-cache-status")).toBeNull();
		}
	});

	it("webp(cache)", async () => {
		const types = ["webp", "webp"];
		for (let i = 0; i < images.length; i++) {
			const url = imageUrl(images[i]);
			const res = await worker.fetch(`/?url=${encodeURI(url)}&t=${time}`, {
				headers: { accept: "image/webp,image/jpeg,image/png" },
			});
			expect(res.status).toBe(200);
			expect(Object.fromEntries(res.headers.entries())).toMatchObject({
				"cf-cache-status": "HIT",
				"content-type": `image/${types[i]}`,
			});
		}
	});

	it("not webp", async () => {
		const types = ["png", "jpeg"];
		for (let i = 0; i < images.length; i++) {
			const url = imageUrl(images[i]);
			const res = await worker.fetch(`/?url=${encodeURI(url)}&t=${time}`, {
				headers: { accept: "image/jpeg,image/png" },
			});
			expect(res.status).toBe(200);
			expect(Object.fromEntries(res.headers.entries())).toMatchObject({
				"content-type": `image/${types[i]}`,
			});
			expect(res.headers.get("cf-cache-status")).toBeNull();
		}
	});

	it("not webp(cache)", async () => {
		const types = ["png", "jpeg"];
		for (let i = 0; i < images.length; i++) {
			const url = imageUrl(images[i]);
			const res = await worker.fetch(`/?url=${encodeURI(url)}&t=${time}`, {
				headers: { accept: "image/jpeg,image/png" },
			});
			expect(res.status).toBe(200);
			expect(Object.fromEntries(res.headers.entries())).toMatchObject({
				"cf-cache-status": "HIT",
				"content-type": `image/${types[i]}`,
			});
		}
	});
});
