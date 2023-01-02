import * as pdfjs from "pdfjs-dist";
pdfjs.GlobalWorkerOptions.workerSrc =
    require("!!file-loader?outputPath=assets/js&name=[name]-[hash].js!pdfjs-dist/build/pdf.worker.min.js").default;

export async function loadPDFTexture(src, index) {
    console.log("pdftexture src", src, index);

    const canvas = document.createElement("canvas");
    const canvasContext = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);

    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearFilter;

    return new Promise(async (resolve, reject) => {
        const pdf = await pdfjs.getDocument(src).promise;
        const page = await pdf.getPage(index);

        const viewport = page.getViewport({ scale: 3 });
        const pw = viewport.width;
        const ph = viewport.height;
        const ratio = ph / pw;

        canvas.width = pw;
        canvas.height = ph;

        const promise = await page.render({ canvasContext: canvasContext, viewport }).promise;

        const setPage = async (ind) => {
            let page = await pdf.getPage(ind);
            let promise = await page.render({ canvasContext: canvasContext, viewport }).promise;
        }


        // To change a page, first getpage, then render.

        console.log("pdf texture image", texture.image);
        resolve({ texture, ratio, page, index });
    });
}
