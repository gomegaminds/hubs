import * as pdfjs from "pdfjs-dist";
pdfjs.GlobalWorkerOptions.workerSrc =
    require("!!file-loader?outputPath=assets/js&name=[name]-[hash].js!pdfjs-dist/build/pdf.worker.min.js").default;

export async function loadPDFTexture(src) {
    console.log("pdftexture src", src);

    const canvas = document.createElement("canvas");
    const canvasContext = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);

    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearFilter;

    return new Promise(async (resolve, reject) => {
        const pdf = await pdfjs.getDocument(src).promise;
        console.log("Getting PDF", pdf);
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 3 });
        const pw = viewport.width;
        const ph = viewport.height;
        const ratio = ph / pw;

        canvas.width = pw;
        canvas.height = ph;

        const promise = await page.render({ canvasContext: canvasContext, viewport }).promise;

        console.log("pdf texture image", texture.image);
        resolve({ texture, ratio, index: 1, page: pdf });
    });
}
