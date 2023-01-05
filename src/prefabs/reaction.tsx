/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";

export function ReactionPrefab(src: any) {
    return <entity name="Reaction" networked networkedTransform particleEmitter={{ src: src }} />;
}
