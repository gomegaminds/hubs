export function canMove(entity) {
    if (entity.components.locked !== undefined) {
        const shouldMove = entity.components["locked"].data.enabled === true;
        if (shouldMove) {
            return false;
        }
    }

    if (window.APP.objectHelper.can("can_change")) {
        // TODO: Cache permission here to avoid render loop 
        return true;
    }

    if (entity.components.owner !== undefined) {
        if (
            entity.components.owner.data &&
            entity.components.owner.data.name === window.APP.store.state.profile.displayName
        ) {
            return true;
        }
    }

    if (entity.components["students-can-move"] !== undefined) {
        const shouldMove = entity.components["students-can-move"].data.enabled === true;
        return shouldMove;
    } else {
        return false;
    }
}
