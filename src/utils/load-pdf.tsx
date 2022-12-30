/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { CanvasTexture } from "three";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadPDFTexture } from "../utils/load-pdf-texture";
import { HubsWorld } from "../app";

export function* loadPDF(world: HubsWorld, url: string) {
    const { texture, ratio, index, page }: { texture: CanvasTexture; ratio: number, index: number, page: any } = yield loadPDFTexture(url);

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
