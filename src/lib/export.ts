import { planBounds, roomM2, toJo } from "./geometry";
import type { Item, View } from "./types";

type Plan = { items: Item[]; name: string; view: View };

// The plan at the current zoom, cropped to its bounds, without editor-only elements, with a title line.
function exportSvg(svg: SVGSVGElement, { items, name, view }: Plan) {
	const svgNs = "http://www.w3.org/2000/svg",
		{ ox, oy, z } = view;
	const clone = svg.cloneNode(true) as SVGSVGElement;
	for (const node of clone.querySelectorAll("[data-noexport]")) node.remove();
	const bounds = planBounds(items, 30),
		head = 44;
	const vx = bounds.x * z + ox,
		vy = bounds.y * z + oy - head,
		vw = bounds.w * z,
		vh = bounds.h * z + head;
	clone.setAttribute("xmlns", svgNs);
	clone.setAttribute("viewBox", `${vx} ${vy} ${vw} ${vh}`);
	clone.setAttribute("width", String(vw));
	clone.setAttribute("height", String(vh));
	clone.removeAttribute("style");
	// The standalone image has no page CSS to inherit the font from.
	clone.setAttribute("font-family", getComputedStyle(svg).fontFamily);
	const background = document.createElementNS(svgNs, "rect");
	for (const [name, value] of [
		["x", vx],
		["y", vy],
		["width", vw],
		["height", vh],
		["fill", "#ffffff"],
	])
		background.setAttribute(String(name), String(value));
	clone.insertBefore(background, clone.firstChild);
	const m2 = items
		.filter((item) => item.type === "room")
		.reduce((sum, room) => sum + roomM2(room), 0);
	const title = document.createElementNS(svgNs, "text");
	for (const [name, value] of [
		["x", vx + 16],
		["y", vy + 28],
		["font-size", 16],
		["font-weight", 600],
		["fill", "#18181b"],
	])
		title.setAttribute(String(name), String(value));
	title.textContent = `${name}　延床 ${m2.toFixed(2)}㎡（${toJo(m2).toFixed(1)}畳）`;
	clone.appendChild(title);
	return { str: new XMLSerializer().serializeToString(clone), w: vw, h: vh };
}

export function exportPng(svg: SVGSVGElement, plan: Plan) {
	const exported = exportSvg(svg, plan);
	const scale = Math.min(4, Math.max(1.5, 2400 / exported.w));
	const url = URL.createObjectURL(
		new Blob([exported.str], { type: "image/svg+xml;charset=utf-8" }),
	);
	const img = new Image();
	img.onload = () => {
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(exported.w * scale);
		canvas.height = Math.round(exported.h * scale);
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		URL.revokeObjectURL(url);
		canvas.toBlob((blob) => {
			if (!blob) return;
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = `${plan.name || "madori"}.png`;
			document.body.appendChild(link);
			link.click();
			link.remove();
		});
	};
	img.src = url;
}

// shortcut: PDF goes through the browser print dialog; use a PDF library if direct download is needed.
export function exportPdf(svg: SVGSVGElement, plan: Plan) {
	const exported = exportSvg(svg, plan);
	const esc = (text: string) =>
		text.replace(
			/[&<>]/g,
			(char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] as string,
		);
	const frame = document.createElement("iframe");
	frame.style.cssText =
		"position:fixed;right:0;bottom:0;width:0;height:0;border:0";
	frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(plan.name)}</title><style>@page{size:A4 ${exported.w > exported.h ? "landscape" : "portrait"};margin:12mm}html,body{margin:0}svg{display:block;width:100%;height:auto;max-height:180mm}</style></head><body>${exported.str}</body></html>`;
	frame.onload = () => {
		const win = frame.contentWindow;
		if (!win) return;
		win.addEventListener("afterprint", () => frame.remove());
		win.focus();
		win.print();
	};
	document.body.appendChild(frame);
}
