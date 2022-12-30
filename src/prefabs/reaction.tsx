/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";

export function ReactionPrefab(src: any) {
    console.log("Got src for reaction", src);
    return <entity name="Reaction" networked networkedTransform particleEmitter={{ src: src }} />;
}
