// Generates build/icon.ico from public/icon.svg
// Usage: node tools/make-icon.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import toIco from 'to-ico'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const svgPath = path.resolve(__dirname, '../public/icon.svg')
const outDir = path.resolve(__dirname, '../build')
const outIco = path.join(outDir, 'icon.ico')

async function main() {
	if (!fs.existsSync(svgPath)) {
		console.error('SVG not found:', svgPath)
		process.exit(1)
	}
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
	const sizes = [16, 24, 32, 48, 64, 128, 256]
	const pngBuffers = []
	for (const s of sizes) {
		const buf = await sharp(svgPath).resize(s, s).png().toBuffer()
		pngBuffers.push(buf)
	}
	const ico = await toIco(pngBuffers)
	fs.writeFileSync(outIco, ico)
	console.log('Wrote', outIco)
}

main().catch(err => { console.error(err); process.exit(1) })
