/** @jsx createElementEntity */
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { CanvasTexture } from "three";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadPDFTexture } from "../utils/load-pdf-texture";
import { HubsWorld } from "../app";
import { Button3D, BUTTON_TYPES } from "../prefabs/button3D";

export function* loadPDF(world: HubsWorld, url: string, index: number) {
    const { texture, ratio, page }: { texture: CanvasTexture; ratio: number; page: any } = yield loadPDFTexture(
        url,
        index
    );

    const nextRef = createRef();
    const prevRef = createRef();

    return renderAsEntity(
        world,
        <entity
            name="PDF"
            networked
            pdf={{
                texture,
                ratio,
                index: 1,
                page
            }}
        >
            <Button3D
                ref={nextRef}
                type={0}
                scale={[0.4, 0.4, 0.4]}
                position={[0.4, 0.1, 0.1]}
                width={0.6}
                height={0.4}
                userData={{ way: "next" }}
                text={">"}
            />
            <Button3D
                ref={prevRef}
                type={0}
                scale={[0.4, 0.4, 0.4]}
                position={[-0.4, 0.1, 0.1]}
                width={0.6}
                height={0.4}
                userData={{ way: "prev" }}
                text={"<"}
            />
        </entity>
    );
}
