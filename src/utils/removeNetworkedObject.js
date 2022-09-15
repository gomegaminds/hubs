export function removeNetworkedObject(scene, targetEl) {
    if (!NAF.utils.isMine(targetEl) && !NAF.utils.takeOwnership(targetEl)) return;
    if (targetEl.getAttribute("pinnable")?.pinned) {
        window.APP.pinningHelper.unpinElement(targetEl);
    }
    scene.systems["hubs-systems"].cameraSystem.uninspect();
    NAF.utils.takeOwnership(targetEl);
    targetEl.parentNode.removeChild(targetEl);
}
