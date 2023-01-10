/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { loadModel as loadGLTFModel } from "../components/gltf-model-plus";
import { renderAsEntity } from "../utils/jsx-entity";

export function* loadModel(world: HubsWorld, src: string, useCache: boolean, contentType: any) {
  // TODO: Write loadGLTFModelCancelable
  
  // TODO: Pass contenttype in here

  const { scene, animations } = yield loadGLTFModel(src, contentType, useCache, null);

  scene.animations = animations;
  scene.mixer = new THREE.AnimationMixer(scene);

  return renderAsEntity(world, <entity model={{ model: scene }} />);
}
