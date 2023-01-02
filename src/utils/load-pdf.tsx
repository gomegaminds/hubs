/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { CanvasTexture } from "three";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadPDFTexture } from "../utils/load-pdf-texture";
import { HubsWorld } from "../app";

export function* loadPDF(world: HubsWorld, url: string, index: number) {
    const { texture, ratio, page }: { texture: CanvasTexture; ratio: number, page: any } = yield loadPDFTexture(url, index);

    console.log("LoadPDF", url, index, texture);

    return renderAsEntity(
        world,
        <entity
            name="PDF"
            networked
            grabbable={{ cursor: true, hand: false }}
            pdf={{
                texture,
                ratio,
                index: 1,
                page
            }}
        ></entity>
    );
}
