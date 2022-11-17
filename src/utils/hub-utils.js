import configs from "./configs";
export function getCurrentHubId() {
    const qs = new URLSearchParams(location.search);
    return qs.get("hub_id") || document.location.pathname.substring(1).split("/")[0];
}

export function updateSceneCopresentState(presence, scene) {
    const occupantCount = Object.getOwnPropertyNames(presence.state).length;
    if (occupantCount > 1) {
        scene.addState("copresent");
    } else {
        scene.removeState("copresent");
    }
}

export function createHubChannelParams({
    permsToken,
    profile,
    pushSubscriptionEndpoint,
    isMobile,
    isMobileVR,
    isEmbed,
    hubInviteId,
    authToken
}) {
    return {
        profile,
        push_subscription_endpoint: pushSubscriptionEndpoint,
        auth_token: authToken || null,
        perms_token: permsToken || null,
        context: {
            mobile: isMobile || isMobileVR,
            embed: isEmbed,
            hmd: isMobileVR
        },
        hub_invite_id: hubInviteId
    };
}
