/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import megamindsLoader from "../assets/megaminds/images/MegaMindsLoader.svg";

export function LoadingObject() {
    return <entity name="Loading Object" image={{ src: megamindsLoader }} />;
}
