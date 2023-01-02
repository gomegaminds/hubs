import * as pdfjs from "pdfjs-dist";
import { MediaPDF } from "../bit-components";
pdfjs.GlobalWorkerOptions.workerSrc =
    require("!!file-loader?outputPath=assets/js&name=[name]-[hash].js!pdfjs-dist/build/pdf.worker.min.js").default;

export async function loadPDFTexture(src, index) {
    const canvas = document.createElement("canvas");
    const canvasContext = canvas.getContext("2d");
    const ctx = document.createElement('canvas').getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);

    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearFilter;

    return new Promise(async (resolve, reject) => {
        const pdf = await pdfjs.getDocument(src).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 3 });
        const pw = viewport.width;
        const ph = viewport.height;
        const ratio = ph / pw;

        canvas.width = pw;
        canvas.height = ph;

        const promise = await page.render({ canvasContext: canvasContext, viewport }).promise;

        const setPage = () => {
            console.log("Setting canvas to something horrible");
            var ctx = canvas.getContext("2d");
            ctx.fillStyle = "blue";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        console.log("pdf texture image", texture.image);
        resolve({ texture, ratio, page: { pdf, texture, pageCount: pdf._pdfInfo.numPages }, index });
    });
}
