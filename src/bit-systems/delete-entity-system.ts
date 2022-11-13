import { defineQuery, exitQuery, hasComponent, removeEntity } from "bitecs";
import { Vector3 } from "three";
import { HubsWorld } from "../app";
import { Deletable, HoveredRemoteLeft, HoveredRemoteRight } from "../bit-components";
import { paths } from "../systems/userinput/paths";
import { animate } from "../utils/animate";
import { findAncestorEntity } from "../utils/bit-utils";
import { coroutine } from "../utils/coroutine";
import { easeOutQuadratic } from "../utils/easing";

// TODO Move to coroutine.ts when it exists
// TODO Figure out the appropriate type and use it everywhere
export type Coroutine = Generator<Promise<void>, void, unknown>;

const END_SCALE = new Vector3().setScalar(0.001);
function* RemoveEntity(world: HubsWorld, eid: number): Coroutine {
  const obj = world.eid2obj.get(eid)!;
  removeEntity(world, eid);
}

const deletableQuery = defineQuery([Deletable]);
const deletableExitQuery = exitQuery(deletableQuery);
const hoveredRightQuery = defineQuery([HoveredRemoteRight]);
const hoveredLeftQuery = defineQuery([HoveredRemoteLeft]);
const coroutines = new Map();

function deleteTheDeletableAncestor(world: HubsWorld, eid: number) {
  const ancestor = findAncestorEntity(world, eid, (e: number) => hasComponent(world, Deletable, e));
  if (ancestor && !coroutines.has(ancestor)) {
    coroutines.set(ancestor, coroutine(RemoveEntity(world, ancestor)));
  }
}

export function deleteEntitySystem(world: HubsWorld, userinput: any) {
  deletableExitQuery(world).forEach(function (eid) {
    coroutines.delete(eid);
  });
  if (userinput.get(paths.actions.cursor.right.deleteEntity)) {
    hoveredRightQuery(world).forEach(eid => deleteTheDeletableAncestor(world, eid));
  }
  if (userinput.get(paths.actions.cursor.left.deleteEntity)) {
    hoveredLeftQuery(world).forEach(eid => deleteTheDeletableAncestor(world, eid));
  }
  coroutines.forEach(c => c());
}
