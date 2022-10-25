import React, { Component, useEffect, useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import copy from "copy-to-clipboard";
import { FormattedMessage } from "react-intl";
import screenfull from "screenfull";
import { Toaster } from "react-hot-toast";

import "bootstrap/dist/css/bootstrap.min.css";

import configs from "../utils/configs";
import { VR_DEVICE_AVAILABILITY } from "../utils/vr-caps-detect";
import { canShare } from "../utils/share";
import styles from "../assets/stylesheets/ui-root.scss";
import styleUtils from "./styles/style-utils.scss";
import { ReactAudioContext } from "./wrap-with-audio";
import {
    pushHistoryState,
    clearHistoryState,
    popToBeginningOfHubHistory,
    navigateToPriorPage,
    sluglessPath,
} from "../utils/history";
import StateRoute from "./state-route.js";
import { getPresenceProfileForSession, hubUrl } from "../utils/phoenix-utils";
import { getMicrophonePresences } from "../utils/microphone-presence";
import { getCurrentStreamer } from "../utils/component-utils";
import { isIOS } from "../utils/is-mobile";

import MediaBrowserContainer from "./media-browser";

import EntryStartPanel from "./entry-start-panel.js";
import AvatarEditor from "./avatar-editor";
import PreferencesScreen from "./preferences-screen.js";
import PresenceLog from "./presence-log.js";
import PreloadOverlay from "./preload-overlay.js";
import RTCDebugPanel from "./debug-panel/RtcDebugPanel.js";
import { showFullScreenIfAvailable, showFullScreenIfWasFullScreen } from "../utils/fullscreen";
import { handleExitTo2DInterstitial, exit2DInterstitialAndEnterVR, isIn2DInterstitial } from "../utils/vr-interstitial";
import maskEmail from "../utils/mask-email";

import qsTruthy from "../utils/qs_truthy";
import { LoadingScreenContainer } from "./room/LoadingScreenContainer";

import { RoomLayoutContainer } from "./room/RoomLayoutContainer";
import roomLayoutStyles from "./layout/RoomLayout.scss";
import { useAccessibleOutlineStyle } from "./input/useAccessibleOutlineStyle";
import { ToolbarButton } from "./input/ToolbarButton";
import { RoomEntryModal } from "./room/RoomEntryModal";
import { EnterOnDeviceModal } from "./room/EnterOnDeviceModal";
import { MicSetupModalContainer } from "./room/MicSetupModalContainer";
import { InvitePopoverContainer } from "./room/InvitePopoverContainer";
import { MoreMenuPopoverButton, CompactMoreMenuButton, MoreMenuContextProvider } from "./room/MoreMenuPopover";
import { ChatSidebarContainer, ChatContextProvider, ChatToolbarButtonContainer } from "./room/ChatSidebarContainer";
import { ContentMenu, ChatMenuButton, PeopleMenuButton, ObjectsMenuButton } from "./room/ContentMenu";
import { ReactComponent as CameraIcon } from "./icons/Camera.svg";
import { ReactComponent as PenIcon } from "./icons/MegaMinds/DrawPen.svg";
import { ReactComponent as PreferenceIcon } from "./icons/MegaMinds/PreferenceIcon.svg";
import { ReactComponent as ChatIcon } from "./icons/MegaMinds/ChatIcon.svg";
import { ReactComponent as EditAvatarIcon } from "./icons/MegaMinds/AvatarIcon.svg";
import { ReactComponent as EditWorldIcon } from "./icons/MegaMinds/EditWorld.svg";
import { ReactComponent as BackIcon } from "./icons/MegaMinds/Back.svg";
import { ReactComponent as AvatarIcon } from "./icons/Avatar.svg";
import { ReactComponent as AddIcon } from "./icons/Add.svg";
import { ReactComponent as DeleteIcon } from "./icons/Delete.svg";
import { ReactComponent as FavoritesIcon } from "./icons/Favorites.svg";
import { ReactComponent as StarOutlineIcon } from "./icons/StarOutline.svg";
import { ReactComponent as StarIcon } from "./icons/Star.svg";
import { ReactComponent as SettingsIcon } from "./icons/Settings.svg";
import { ReactComponent as WarningCircleIcon } from "./icons/WarningCircle.svg";
import { ReactComponent as HomeIcon } from "./icons/Home.svg";
import { ReactComponent as TextDocumentIcon } from "./icons/TextDocument.svg";
import { ReactComponent as SupportIcon } from "./icons/Support.svg";
import { ReactComponent as ShieldIcon } from "./icons/Shield.svg";
import { ReactComponent as DiscordIcon } from "./icons/Discord.svg";
import { ReactComponent as VRIcon } from "./icons/VR.svg";
import { ReactComponent as LeaveIcon } from "./icons/Leave.svg";
import { ReactComponent as EnterIcon } from "./icons/Enter.svg";
import { ReactComponent as InviteIcon } from "./icons/Invite.svg";
import { userFromPresence } from "./room/PeopleSidebarContainer";
import { ObjectListProvider } from "./room/useObjectList";
import { ObjectsSidebarContainer } from "./room/ObjectsSidebarContainer";
import { ObjectMenuContainer } from "./room/ObjectMenuContainer";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { PlacePopoverContainer } from "./room/PlacePopoverContainer";
import { TeacherPopoverContainer } from "../mega-src/react-components/room/popovers/TeacherPopoverContainer";
import { ObjectMenu } from "../mega-src/react-components/room/ObjectMenu";
import { HelpPopover } from "../mega-src/react-components/room/popovers/HelpPopover";
import { SettingsPopover } from "../mega-src/react-components/room/popovers/SettingsPopover";
import { ChangeAvatarPopover } from "../mega-src/react-components/room/popovers/ChangeAvatarPopover";
import { EntryDialog } from "../mega-src/react-components/room/entry/EntryDialog";
import { StickyNotePopover } from "../mega-src/react-components/room/popovers/StickyNotePopover";
import { StudentPopoverContainer } from "../mega-src/react-components/room/popovers/StudentPopoverContainer";
import { syncRoom } from "../mega-src/utils/cloning-utils";
import { WorldEditUI } from "../mega-src/react-components/room/WorldEditUI";
import { SharePopoverContainer } from "./room/SharePopoverContainer";
import { AudioPopoverContainer } from "./room/AudioPopoverContainer";
import { RaiseHandButton } from "./room/RaiseHandButton";
import { ReactionPopoverContainer } from "./room/ReactionPopoverContainer";
import { SafariMicModal } from "./room/SafariMicModal";
import { RoomSignInModalContainer } from "./auth/RoomSignInModalContainer";
import { SignInStep } from "./auth/SignInModal";
import { LeaveReason, LeaveRoomModal } from "./room/LeaveRoomModal";
import { TeleportSidebar } from "../mega-src/react-components/room/TeleportSidebar";
import { RoomSettingsSidebarContainer } from "./room/RoomSettingsSidebarContainer";
import { AutoExitWarningModal, AutoExitReason } from "./room/AutoExitWarningModal";
import { ExitReason } from "./room/ExitedRoomScreen";
import { UserProfileSidebarContainer } from "./room/UserProfileSidebarContainer";
import { CloseRoomModal } from "./room/CloseRoomModal";
import { WebVRUnsupportedModal } from "./room/WebVRUnsupportedModal";
import { TweetModalContainer } from "./room/TweetModalContainer";
import { TipContainer, FullscreenTip } from "./room/TipContainer";
import { SpectatingLabel } from "./room/SpectatingLabel";
import { SignInMessages } from "./auth/SignInModal";
import { MediaDevicesEvents } from "../utils/media-devices-utils";
import { TERMS, PRIVACY } from "../constants";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

import handImg from "../assets/myAssets/hand.png";
import handDarkenImg from "../assets/myAssets/hand_darken.png";
import handRaisedImg from "../assets/myAssets/hand_raised.png";

const avatarEditorDebug = qsTruthy("avatarEditorDebug");

const IN_ROOM_MODAL_ROUTER_PATHS = ["/media"];
const IN_ROOM_MODAL_QUERY_VARS = ["media_source"];

const LOBBY_MODAL_ROUTER_PATHS = ["/media/scenes", "/media/avatars", "/media/favorites"];
const LOBBY_MODAL_QUERY_VARS = ["media_source"];
const LOBBY_MODAL_QUERY_VALUES = ["scenes", "avatars", "favorites"];

async function grantedMicLabels() {
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    return mediaDevices.filter((d) => d.label && d.kind === "audioinput").map((d) => d.label);
}

const isMobile = AFRAME.utils.device.isMobile();
const isMobileVR = AFRAME.utils.device.isMobileVR();
const AUTO_EXIT_TIMER_SECONDS = 10;

class UIRoot extends Component {
    willCompileAndUploadMaterials = false;

    static propTypes = {
        enterScene: PropTypes.func,
        exitScene: PropTypes.func,
        onSendMessage: PropTypes.func,
        disableAutoExitOnIdle: PropTypes.bool,
        forcedVREntryType: PropTypes.string,
        isBotMode: PropTypes.bool,
        store: PropTypes.object,
        mediaSearchStore: PropTypes.object,
        scene: PropTypes.object,
        authChannel: PropTypes.object,
        hubChannel: PropTypes.object,
        linkChannel: PropTypes.object,
        hub: PropTypes.object,
        availableVREntryTypes: PropTypes.object,
        checkingForDeviceAvailability: PropTypes.bool,
        environmentSceneLoaded: PropTypes.bool,
        entryDisallowed: PropTypes.bool,
        roomUnavailableReason: PropTypes.string,
        hubIsBound: PropTypes.bool,
        isSupportAvailable: PropTypes.bool,
        presenceLogEntries: PropTypes.array,
        presences: PropTypes.object,
        sessionId: PropTypes.string,
        subscriptions: PropTypes.object,
        initialIsFavorited: PropTypes.bool,
        showSignInDialog: PropTypes.bool,
        signInMessage: PropTypes.object,
        onContinueAfterSignIn: PropTypes.func,
        showSafariMicDialog: PropTypes.bool,
        onMediaSearchResultEntrySelected: PropTypes.func,
        onAvatarSaved: PropTypes.func,
        location: PropTypes.object,
        history: PropTypes.object,
        showInterstitialPrompt: PropTypes.bool,
        onInterstitialPromptClicked: PropTypes.func,
        performConditionalSignIn: PropTypes.func,
        hide: PropTypes.bool,
        showPreload: PropTypes.bool,
        onPreloadLoadClicked: PropTypes.func,
        embed: PropTypes.bool,
        embedToken: PropTypes.string,
        onLoaded: PropTypes.func,
        activeObject: PropTypes.object,
        selectedObject: PropTypes.object,
        breakpoint: PropTypes.string,
    };

    state = {
        isHandUp: false,
        elt: null,
        enterInVR: false,
        entered: false,
        entering: false,
        dialog: null,
        showShareDialog: false,
        linkCode: null,
        linkCodeCancel: null,
        miniInviteActivated: false,
        isWorldbuilding: false,
        didConnectToNetworkedScene: false,
        noMoreLoadingUpdates: false,
        hideLoader: false,
        showPrefs: false,
        watching: false,
        isStreaming: false,

        waitingOnAudio: false,
        audioTrackClone: null,

        autoExitTimerStartedAt: null,
        autoExitTimerInterval: null,
        autoExitReason: null,
        secondsRemainingBeforeAutoExit: Infinity,

        signedIn: false,
        videoShareMediaSource: null,
        showVideoShareFailed: false,

        objectInfo: null,
        objectSrc: "",
        sidebarId: null,
        presenceCount: 0,
        chatInputEffect: () => {},
    };

    constructor(props) {
        super(props);

        props.mediaSearchStore.setHistory(props.history);

        // An exit handler that discards event arguments and can be cleaned up.
        this.exitEventHandler = () => this.props.exitScene();
        this.mediaDevicesManager = APP.mediaDevicesManager;
    }

    componentDidUpdate(prevProps) {
        const { hubChannel, showSignInDialog } = this.props;
        if (hubChannel) {
            const { signedIn } = hubChannel;
            if (signedIn !== this.state.signedIn) {
                this.setState({ signedIn });
            }
        }
        if (prevProps.showSignInDialog !== showSignInDialog) {
            if (showSignInDialog) {
                this.showContextualSignInDialog();
            } else {
                this.closeDialog();
            }
        }
        if (!this.willCompileAndUploadMaterials && this.state.noMoreLoadingUpdates) {
            this.willCompileAndUploadMaterials = true;
            // We want to ensure that react and the browser have had the chance to render / update.
            // See https://stackoverflow.com/a/34999925 , although our solution flipped setTimeout and requestAnimationFrame
            window.requestAnimationFrame(() => {
                window.setTimeout(() => {
                    if (!this.props.isBotMode) {
                        try {
                            this.props.scene.renderer.compile(this.props.scene.object3D, this.props.scene.camera);
                            this.props.scene.object3D.traverse((obj) => {
                                if (!obj.material) {
                                    return;
                                }
                                const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                                for (const material of materials) {
                                    for (const prop in material) {
                                        if (material[prop] && material[prop].isTexture) {
                                            this.props.scene.renderer.initTexture(material[prop]);
                                        }
                                    }
                                }
                            });
                        } catch (e) {
                            console.error(e);
                            this.props.exitScene(ExitReason.sceneError); // https://github.com/mozilla/hubs/issues/1950
                        }
                    }

                    if (!this.state.hideLoader) {
                        this.setState({ hideLoader: true });
                    }
                }, 0);
            });
        }

        if (!this.props.selectedObject || !prevProps.selectedObject) {
            const sceneEl = this.props.scene;

            if (this.props.selectedObject) {
                sceneEl.classList.add(roomLayoutStyles.sceneSmFullScreen);
            } else {
                sceneEl.classList.remove(roomLayoutStyles.sceneSmFullScreen);
            }
        }

        if (this.state.presenceCount != this.occupantCount()) {
            this.setState({ presenceCount: this.occupantCount() });
        }
    }

    onConcurrentLoad = () => {
        if (qsTruthy("allow_multi") || this.props.store.state.preferences.allowMultipleHubsInstances) return;
        // this.startAutoExitTimer(AutoExitReason.concurrentSession);
        return;
    };

    onIdleDetected = () => {
        return;
        if (
            this.props.disableAutoExitOnIdle ||
            this.state.isStreaming ||
            this.props.store.state.preferences.disableIdleDetection
        )
            return;
        this.startAutoExitTimer(AutoExitReason.idle);
    };

    onActivityDetected = () => {
        if (this.state.autoExitTimerInterval) {
            this.endAutoExitTimer();
        }
    };

    componentDidMount() {
        window.addEventListener("concurrentload", this.onConcurrentLoad);
        window.addEventListener("idle_detected", this.onIdleDetected);
        window.addEventListener("activity_detected", this.onActivityDetected);
        window.addEventListener("focus_chat", this.onFocusChat);
        document.querySelector(".a-canvas").addEventListener("mouseup", () => {
            if (this.state.showShareDialog) {
                this.setState({ showShareDialog: false });
            }
        });

        this.props.scene.addEventListener("loaded", this.onSceneLoaded);
        this.props.scene.addEventListener("share_video_enabled", this.onShareVideoEnabled);
        this.props.scene.addEventListener("share_video_disabled", this.onShareVideoDisabled);
        this.props.scene.addEventListener("share_video_failed", this.onShareVideoFailed);
        this.props.scene.addEventListener("exit", this.exitEventHandler);
        this.props.scene.addEventListener("action_exit_watch", () => {
            if (this.state.hide) {
                this.setState({ hide: false, hideUITip: false });
            } else {
                this.setState({ watching: false });
            }
        });
        this.props.scene.addEventListener("action_toggle_ui", () =>
            this.setState({ hide: !this.state.hide, hideUITip: false })
        );
        this.props.scene.addEventListener("devicechange", () => {
            this.forceUpdate();
        });

        const scene = this.props.scene;

        const unsubscribe = this.props.history.listen((location, action) => {
            const state = location.state;

            // If we just hit back into the entry flow, just go back to the page before the room landing page.
            if (action === "POP" && state && state.entry_step && this.state.entered) {
                unsubscribe();
                navigateToPriorPage(this.props.history);
                return;
            }
        });

        // If we refreshed the page with any state history (eg if we were in the entry flow
        // or had a modal/overlay open) just reset everything to the beginning of the flow by
        // erasing all history that was accumulated for this room (including across refreshes.)
        //
        // We don't do this for the media browser case, since we want to be able to share
        // links to the browser pages
        if (this.props.history.location.state && !sluglessPath(this.props.history.location).startsWith("/media")) {
            popToBeginningOfHubHistory(this.props.history);
        }

        this.setState({
            audioContext: {
                playSound: (sound) => {
                    scene.emit(sound);
                },
                onMouseLeave: () => {
                    //          scene.emit("play_sound-hud_mouse_leave");
                },
            },
        });

        if (this.props.forcedVREntryType && this.props.forcedVREntryType.endsWith("_now")) {
            this.props.scene.addEventListener(
                "loading_finished",
                () => {
                    console.log("Loading has finished. Checking for forced room entry");
                    setTimeout(() => this.handleForceEntry(), 1000);
                },
                { once: true }
            );
        }

        this.playerRig = scene.querySelector("#avatar-rig");

        scene.addEventListener("action_media_tweet", this.onTweet);
    }

    UNSAFE_componentWillMount() {
        this.props.store.addEventListener("statechanged", this.storeUpdated);
    }

    componentWillUnmount() {
        this.props.scene.removeEventListener("loaded", this.onSceneLoaded);
        this.props.scene.removeEventListener("exit", this.exitEventHandler);
        this.props.scene.removeEventListener("share_video_enabled", this.onShareVideoEnabled);
        this.props.scene.removeEventListener("share_video_disabled", this.onShareVideoDisabled);
        this.props.scene.removeEventListener("share_video_failed", this.onShareVideoFailed);
        this.props.scene.removeEventListener("action_media_tweet", this.onTweet);
        this.props.store.removeEventListener("statechanged", this.storeUpdated);
        window.removeEventListener("concurrentload", this.onConcurrentLoad);
        window.removeEventListener("idle_detected", this.onIdleDetected);
        window.removeEventListener("activity_detected", this.onActivityDetected);
        window.removeEventListener("focus_chat", this.onFocusChat);
    }

    storeUpdated = () => {
        this.forceUpdate();
    };

    showContextualSignInDialog = () => {
        const { signInMessage, authChannel, onContinueAfterSignIn } = this.props;
        this.showNonHistoriedDialog(RoomSignInModalContainer, {
            step: SignInStep.submit,
            message: signInMessage,
            onSubmitEmail: async (email) => {
                const { authComplete } = await authChannel.startAuthentication(email, this.props.hubChannel);

                this.showNonHistoriedDialog(RoomSignInModalContainer, {
                    step: SignInStep.waitForVerification,
                    onClose: onContinueAfterSignIn || this.closeDialog,
                });

                await authComplete;

                this.setState({ signedIn: true });
                this.showNonHistoriedDialog(RoomSignInModalContainer, {
                    step: SignInStep.complete,
                    onClose: onContinueAfterSignIn || this.closeDialog,
                    onContinue: onContinueAfterSignIn || this.closeDialog,
                });
            },
            onClose: onContinueAfterSignIn || this.closeDialog,
        });
    };

    updateSubscribedState = () => {
        const isSubscribed = this.props.subscriptions && this.props.subscriptions.isSubscribed();
        this.setState({ isSubscribed });
    };

    toggleFavorited = () => {
        this.props.performConditionalSignIn(
            () => this.props.hubChannel.signedIn,
            () => {
                const isFavorited = this.isFavorited();

                this.props.hubChannel[isFavorited ? "unfavorite" : "favorite"]();
                this.setState({ isFavorited: !isFavorited });
            },
            SignInMessages.favoriteRoom
        );
    };

    isFavorited = () => {
        return this.state.isFavorited !== undefined ? this.state.isFavorited : this.props.initialIsFavorited;
    };

    onLoadingFinished = () => {
        console.log("UI root loading has finished");
        this.setState({ noMoreLoadingUpdates: true });
        this.props.scene.emit("loading_finished");

        if (this.props.onLoaded) {
            this.props.onLoaded();
        }
    };

    onSceneLoaded = () => {
        console.log("UI root scene has loaded");
        this.setState({ sceneLoaded: true });
    };

    onShareVideoEnabled = (e) => {
        this.setState({ videoShareMediaSource: e.detail.source });
    };

    onShareVideoDisabled = () => {
        this.setState({ videoShareMediaSource: null });
    };

    onShareVideoFailed = () => {
        this.setState({ showVideoShareFailed: true });
    };

    shareVideo = (mediaSource) => {
        this.props.scene.emit(`action_share_${mediaSource}`);
    };

    endShareVideo = () => {
        this.props.scene.emit(MediaDevicesEvents.VIDEO_SHARE_ENDED);
    };

    spawnPen = () => {
        this.props.scene.emit("penButtonPressed");
    };

    onSubscribeChanged = async () => {
        if (!this.props.subscriptions) return;

        await this.props.subscriptions.toggle();
        this.updateSubscribedState();
    };

    handleForceEntry = (skip_audio) => {
        console.log("Forced entry type: " + this.props.forcedVREntryType);

        if (!this.props.forcedVREntryType) return;

        if (this.props.forcedVREntryType.startsWith("daydream")) {
            this.enterDaydream();
        } else if (this.props.forcedVREntryType.startsWith("vr")) {
            this.enterVR();
        } else if (this.props.forcedVREntryType.startsWith("2d")) {
            this.enter2D();
        }
    };

    startAutoExitTimer = (autoExitReason) => {
        if (this.state.autoExitTimerInterval) return;

        const autoExitTimerInterval = setInterval(() => {
            let secondsRemainingBeforeAutoExit = Infinity;

            if (this.state.autoExitTimerStartedAt) {
                const secondsSinceStart = (new Date() - this.state.autoExitTimerStartedAt) / 1000;
                secondsRemainingBeforeAutoExit = Math.max(0, Math.floor(AUTO_EXIT_TIMER_SECONDS - secondsSinceStart));
            }

            this.setState({ secondsRemainingBeforeAutoExit });
            this.checkForAutoExit();
        }, 500);

        this.setState({ autoExitTimerStartedAt: new Date(), autoExitTimerInterval, autoExitReason });
    };

    checkForAutoExit = () => {
        if (this.state.secondsRemainingBeforeAutoExit !== 0) return;
        this.endAutoExitTimer();
        this.props.exitScene();
    };

    isWaitingForAutoExit = () => {
        return this.state.secondsRemainingBeforeAutoExit <= AUTO_EXIT_TIMER_SECONDS;
    };

    endAutoExitTimer = () => {
        clearInterval(this.state.autoExitTimerInterval);
        this.setState({
            autoExitTimerStartedAt: null,
            autoExitTimerInterval: null,
            autoExitReason: null,
            secondsRemainingBeforeAutoExit: Infinity,
        });
    };

    performDirectEntryFlow = async (enterInVR) => {
        this.setState({ enterInVR, waitingOnAudio: true });

        const hasGrantedMic = (await grantedMicLabels()).length > 0;

        if (hasGrantedMic) {
            if (!this.mediaDevicesManager.isMicShared) {
                await this.mediaDevicesManager.startMicShare({});
            }
            this.beginOrSkipAudioSetup();
        } else {
            this.onRequestMicPermission();
            this.pushHistoryState("entry_step", "audio");
        }

        this.setState({ waitingOnAudio: false });
    };

    enter2D = async () => {
        console.log("Entering in 2D mode");
        await this.performDirectEntryFlow(false);
    };

    enterVR = async () => {
        console.log("Entering in VR mode");
        if (this.props.forcedVREntryType || this.props.availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.maybe) {
            await this.performDirectEntryFlow(true);
        } else {
            this.showNonHistoriedDialog(WebVRUnsupportedModal);
        }
    };

    combineAuth = () => {
        console.log("Trying to combine auth");
    };

    enterDaydream = async () => {
        console.log("Entering in Daydream mode");
        await this.performDirectEntryFlow(true);
    };

    onRequestMicPermission = async () => {
        await this.mediaDevicesManager.startMicShare({});
    };

    beginOrSkipAudioSetup = () => {
        const skipAudioSetup = this.props.forcedVREntryType && this.props.forcedVREntryType.endsWith("_now");
        if (skipAudioSetup) {
            console.log(`Skipping audio setup (forcedVREntryType = ${this.props.forcedVREntryType})`);
            this.onAudioReadyButton();
        } else {
            console.log(`Starting audio setup`);
            this.pushHistoryState("entry_step", "audio");
        }
    };

    shouldShowFullScreen = () => {
        // Disable full screen on iOS, since Safari's fullscreen mode does not let you prevent native pinch-to-zoom gestures.
        return (
            (isMobile || AFRAME.utils.device.isMobileVR()) && !isIOS() && !this.state.enterInVR && screenfull.enabled
        );
    };

    handleVoiceToggle = async () => {
        const voiceEnabled = this.props.hub.user_data && this.props.hub.user_data.toggle_voice;

        if (!voiceEnabled) {
            if (this.mediaDevicesManager.isMicShared) {
                await this.mediaDevicesManager.stopMicShare();
            }
        } else {
            if (!this.mediaDevicesManager.isMicShared) {
                await this.mediaDevicesManager.startMicShare({});
            }
        }
    };

    onAudioReadyButton = async () => {
        if (!this.state.enterInVR) {
            await showFullScreenIfAvailable();
        }

        // Push the new history state before going into VR, otherwise menu button will take us back
        clearHistoryState(this.props.history);

        const muteOnEntry =
            this.props.store.state.preferences.muteMicOnEntry ||
            (this.props.hub.user_data && !this.props.hub.user_data.toggle_voice);
        await this.props.enterScene(this.state.enterInVR, muteOnEntry);

        if (this.props.hub.user_data && !this.props.hub.user_data.toggle_voice) {
            await this.mediaDevicesManager.stopMicShare();
        }

        this.setState({ entered: true, entering: false, showShareDialog: false });

        if (this.mediaDevicesManager.isMicShared) {
            console.log(`Using microphone: ${this.mediaDevicesManager.selectedMicLabel}`);
        }

        if (this.mediaDevicesManager.isVideoShared) {
            console.log("Screen sharing enabled.");
        }
    };

    attemptLink = async () => {
        this.pushHistoryState("entry_step", "device");
        const { code, cancel, onFinished } = await this.props.linkChannel.generateCode();
        this.setState({ linkCode: code, linkCodeCancel: cancel });
        onFinished.then(() => {
            this.setState({ log: false, linkCode: null, linkCodeCancel: null });
            this.props.exitScene();
        });
    };

    toggleShareDialog = async () => {
        this.props.store.update({ activity: { hasOpenedShare: true } });
        this.setState({ showShareDialog: !this.state.showShareDialog });
    };

    closeDialog = () => {
        if (this.state.dialog) {
            this.setState({ dialog: null });
        }

        if (isIn2DInterstitial()) {
            exit2DInterstitialAndEnterVR();
        } else {
            showFullScreenIfWasFullScreen();
        }
    };

    showNonHistoriedDialog = (DialogClass, props = {}) => {
        this.setState({
            dialog: <DialogClass {...{ onClose: this.closeDialog, ...props }} />,
        });
    };

    toggleStreamerMode = () => {
        const isStreaming = !this.state.isStreaming;
        this.props.scene.systems["hubs-systems"].characterController.fly = isStreaming;

        if (isStreaming) {
            this.props.hubChannel.beginStreaming();
        } else {
            this.props.hubChannel.endStreaming();
        }

        this.setState({ isStreaming });
    };

    renderDialog = (DialogClass, props = {}) => <DialogClass {...{ onClose: this.closeDialog, ...props }} />;

    signOut = async () => {
        await this.props.authChannel.signOut(this.props.hubChannel);
        this.setState({ signedIn: false });
    };

    onMiniInviteClicked = () => {
        const link = `https://${configs.SHORTLINK_DOMAIN}/${this.props.hub.hub_id}`;

        this.setState({ miniInviteActivated: true });
        setTimeout(() => {
            this.setState({ miniInviteActivated: false });
        }, 5000);

        if (canShare()) {
            navigator.share({ title: document.title, url: link });
        } else {
            copy(link);
        }
    };

    sendMessage = (msg) => {
        this.props.onSendMessage(msg);
    };

    occupantCount = () => {
        let ret = this.props.presences ? Object.entries(this.props.presences) : [];

        let filteredRet = ret.filter((user) => user[1].metas[0].profile.displayName !== "teacher_bot_2df");

        return filteredRet.length;
    };

    hasEmbedPresence = () => {
        if (!this.props.presences) {
            return false;
        } else {
            for (const p of Object.values(this.props.presences)) {
                for (const m of p.metas) {
                    if (m.context && m.context.embed) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    onTweet = ({ detail }) => {
        handleExitTo2DInterstitial(true, () => {}).then(() => {
            this.props.performConditionalSignIn(
                () => this.props.hubChannel.signedIn,
                () => {
                    this.showNonHistoriedDialog(TweetModalContainer, {
                        hubChannel: this.props.hubChannel,
                        isAdmin: configs.isAdmin(),
                        ...detail,
                    });
                },
                SignInMessages.tweet
            );
        });
    };

    onChangeScene = () => {
        this.props.performConditionalSignIn(
            () => this.props.hubChannel.canOrWillIfCreator("update_hub"),
            () => {
                showFullScreenIfAvailable();
                this.props.mediaSearchStore.sourceNavigateWithNoNav("scenes", "use");
            },
            SignInMessages.changeScene
        );
    };

    pushHistoryState = (k, v) => pushHistoryState(this.props.history, k, v);

    setSidebar(sidebarId, otherState) {
        this.setState({ sidebarId, chatInputEffect: () => {}, selectedUserId: null, ...otherState });
    }

    toggleSidebar(sidebarId, otherState) {
        this.setState(({ sidebarId: curSidebarId }) => {
            const nextSidebarId = curSidebarId === sidebarId ? null : sidebarId;

            return {
                sidebarId: nextSidebarId,
                selectedUserId: null,
                ...otherState,
            };
        });
    }

    onFocusChat = (e) => {
        if (!this.props.hub.user_data || (this.props.hub.user_data && this.props.hub.user_data.toggle_chat)) {
            // User data has not been set yet, default is enabled so we toggle chat
            this.setSidebar("chat", {
                chatInputEffect: (input) => {
                    input.focus();
                    input.value = e.detail.prefix;
                },
            });
        }
    };

    renderInterstitialPrompt = () => {
        return (
            <div className={styles.interstitial} onClick={() => this.props.onInterstitialPromptClicked()}>
                <div>
                    <FormattedMessage id="ui-root.interstitial-prompt" defaultMessage="Continue" />
                </div>
            </div>
        );
    };

    renderBotMode = () => {
        return (
            <div className="loading-panel">
                <img className="loading-panel__logo" src={configs.image("logo")} />
                <input type="file" id="bot-audio-input" accept="audio/*" />
                <input type="file" id="bot-data-input" accept="application/json" />
            </div>
        );
    };

    onEnteringCanceled = () => {
        this.props.hubChannel.sendEnteringCancelledEvent();
        this.setState({ entering: false });
    };

    renderEntryStartPanel = () => {
        const { hasAcceptedProfile, hasChangedName } = this.props.store.state.activity;
        const promptForNameAndAvatarBeforeEntry = this.props.hubIsBound ? !hasAcceptedProfile : !hasChangedName;

        // TODO: What does onEnteringCanceled do?
        return (
            <>
                <RoomEntryModal
                    roomName={this.props.hub.name}
                    showJoinRoom={!this.state.waitingOnAudio && !this.props.entryDisallowed}
                    onForceJoinRoom={() => {
                        this.onAudioReadyButton();
                    }}
                    onJoinRoom={() => {
                        if (promptForNameAndAvatarBeforeEntry || !this.props.forcedVREntryType) {
                            this.setState({ entering: true });
                            this.props.hubChannel.sendEnteringEvent();

                            if (promptForNameAndAvatarBeforeEntry) {
                                this.pushHistoryState("entry_step", "profile");
                            } else {
                                this.onRequestMicPermission();
                                this.pushHistoryState("entry_step", "audio");
                            }
                        } else {
                            this.handleForceEntry();
                        }
                    }}
                    showEnterOnDevice={false}
                    onEnterOnDevice={() => this.attemptLink()}
                    isSignedIn={this.props.hubChannel.signedIn}
                    showSpectate={!this.state.waitingOnAudio}
                    onSpectate={() => this.setState({ watching: true })}
                    showOptions={this.props.hubChannel.canOrWillIfCreator("update_hub")}
                    onSignInClick={() =>
                        this.props.performConditionalSignIn(
                            () => this.props.hubChannel.signedIn,
                            () => this.combineAuth(),
                            SignInMessages.verifyEmail
                        )
                    }
                    onOptions={() => {
                        this.props.performConditionalSignIn(
                            () => this.props.hubChannel.canOrWillIfCreator("update_hub"),
                            () => this.setSidebar("room-settings"),
                            SignInMessages.roomSettings
                        );
                    }}
                />
                {!this.state.waitingOnAudio && (
                    <EntryStartPanel
                        hubChannel={this.props.hubChannel}
                        entering={this.state.entering}
                        onEnteringCanceled={this.onEnteringCanceled}
                    />
                )}
            </>
        );
    };

    renderDevicePanel = () => {
        return (
            <EnterOnDeviceModal
                shortUrl={configs.SHORTLINK_DOMAIN}
                loadingCode={!this.state.linkCode}
                code={this.state.linkCode}
                headsetConnected={
                    this.props.availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.no ||
                    this.props.availableVREntryTypes.cardboard !== VR_DEVICE_AVAILABILITY.no
                }
                unsupportedBrowser={this.props.availableVREntryTypes.generic === VR_DEVICE_AVAILABILITY.maybe}
                onEnterOnConnectedHeadset={() => {
                    // TODO: This is bad. linkCodeCancel should be tied to component lifecycle not these callback methods.
                    this.state.linkCodeCancel();
                    this.setState({ linkCode: null, linkCodeCancel: null });
                    this.enterVR();
                }}
                onBack={() => {
                    if (this.state.linkCodeCancel) {
                        // If the back button is pressed rapidly
                        // (before link code generation finishes),
                        // linkCodeCancel will not be a function
                        // and attempting to call it will throw.
                        // TODO: If that happens it may be ideal to
                        // interrupt and cancel link code generation.
                        this.state.linkCodeCancel();
                    }
                    this.setState({ linkCode: null, linkCodeCancel: null });
                    this.props.history.goBack();
                }}
            />
        );
    };

    renderAudioSetupPanel = () => {
        // TODO: Show HMD mic not chosen warning
        return (
            <MicSetupModalContainer
                scene={this.props.scene}
                onEnterRoom={this.onAudioReadyButton}
                onBack={() => this.props.history.goBack()}
            />
        );
    };

    isInModalOrOverlay = () => {
        if (
            this.state.entered &&
            (IN_ROOM_MODAL_ROUTER_PATHS.find((x) => sluglessPath(this.props.history.location).startsWith(x)) ||
                IN_ROOM_MODAL_QUERY_VARS.find((x) => new URLSearchParams(this.props.history.location.search).get(x)))
        ) {
            return true;
        }

        if (
            !this.state.entered &&
            (LOBBY_MODAL_ROUTER_PATHS.find((x) => sluglessPath(this.props.history.location).startsWith(x)) ||
                LOBBY_MODAL_QUERY_VARS.find(
                    (x, i) =>
                        new URLSearchParams(this.props.history.location.search).get(x) === LOBBY_MODAL_QUERY_VALUES[i]
                ))
        ) {
            return true;
        }

        if (this.state.objectInfo && this.state.objectInfo.object3D) {
            return true; // TODO: Get object info dialog to use history
        }
        if (this.state.sidebarId !== null) {
            return true;
        }

        return !!(
            (this.props.history &&
                this.props.history.location.state &&
                (this.props.history.location.state.modal || this.props.history.location.state.overlay)) ||
            this.state.dialog
        );
    };

    enableWorldBuilding() {
        this.setState({ isWorldBuilding: true });
    }

    getSelectedUser() {
        const selectedUserId = this.state.selectedUserId;
        const presence = this.props.presences[selectedUserId];
        const micPresences = getMicrophonePresences();
        return userFromPresence(selectedUserId, presence, micPresences, this.props.sessionId);
    }

    handUp() {
        console.log(this.state.isHandUp);
        this.state.isHandUp = !this.state.isHandUp;
        console.log(this.state.isHandUp);

        if (this.state.isHandUp) {
            //let urlElt = "../assets/myAssets/hand.png" // or load as import?
            let urlElt = handRaisedImg; // or load as import?
            // Info about me
            var selfEl = AFRAME.scenes[0].querySelector("#avatar-rig");
            var povCam = selfEl.querySelector("#avatar-pov-node");

            // Loading asset
            this.state.elt = document.createElement("a-entity");
            AFRAME.scenes[0].appendChild(this.state.elt);
            this.state.elt.setAttribute("media-loader", { src: urlElt, fitToBox: true, resolve: true });
            this.state.elt.setAttribute("networked", { template: "#interactable-media" });

            // Positioning
            this.state.elt.object3D.position.copy(selfEl.object3D.position);
            this.state.elt.object3D.rotation.y = povCam.object3D.rotation.y;
            this.state.elt.object3D.position.y += 2.22;

            this.state.elt.object3D.position.x += 0.4 * Math.sin(povCam.object3D.rotation.y);
            this.state.elt.object3D.position.z += 0.4 * Math.cos(povCam.object3D.rotation.y);

            // Darken the icon in the UI
            document.getElementById("imgHand").src = handDarkenImg;
        } else {
            this.state.elt.object3D.position.y = -9999999;
            document.getElementById("imgHand").src = handImg;
        }
    }

    render() {
        const isGhost =
            configs.feature("enable_lobby_ghosts") && (this.state.watching || (this.state.hide || this.props.hide));
        const hide = this.state.hide || this.props.hide;

        const rootStyles = {
            [styles.ui]: true,
            "ui-root": true,
            "in-modal-or-overlay": this.isInModalOrOverlay(),
            isGhost,
            hide,
        };

        if (this.props.hide || this.state.hide) {
            return (
                <div className={classNames(rootStyles)}>
                    <RoomLayoutContainer
                        scene={this.props.scene}
                        store={this.props.store}
                        viewport={
                            !this.state.hideUITip && (
                                <FullscreenTip onDismiss={() => this.setState({ hideUITip: true })} />
                            )
                        }
                    />
                </div>
            );
        }

        if (this.props.showSafariMicDialog) {
            return (
                <div className={classNames(rootStyles)}>
                    <RoomLayoutContainer scene={this.props.scene} store={this.props.store} modal={<SafariMicModal />} />
                </div>
            );
        }

        const preload = this.props.showPreload;

        const isLoading = !preload && !this.state.hideLoader;

        if (isLoading && this.state.showPrefs) {
            return (
                <div>
                    <LoadingScreenContainer scene={this.props.scene} onLoaded={this.onLoadingFinished} />
                    <PreferencesScreen
                        onClose={() => {
                            this.setState({ showPrefs: false });
                        }}
                        store={this.props.store}
                        scene={this.props.scene}
                    />
                </div>
            );
        }
        if (this.props.isBotMode) return this.renderBotMode();
        if (isLoading) {
            return <LoadingScreenContainer scene={this.props.scene} onLoaded={this.onLoadingFinished} />;
        }
        if (this.state.showPrefs) {
            return (
                <PreferencesScreen
                    onClose={() => {
                        this.setState({ showPrefs: false });
                    }}
                    store={this.props.store}
                    scene={this.props.scene}
                />
            );
        }

        if (this.props.showInterstitialPrompt) return this.renderInterstitialPrompt();

        const entered = this.state.entered;
        const watching = this.state.watching;
        const enteredOrWatching = entered || watching;
        const showRtcDebugPanel = this.props.store.state.preferences.showRtcDebugPanel;
        const showAudioDebugPanel = this.props.store.state.preferences.showAudioDebugPanel;
        const displayNameOverride = this.props.hubIsBound
            ? getPresenceProfileForSession(this.props.presences, this.props.sessionId).displayName
            : null;

        const enableSpectateVRButton =
            configs.feature("enable_lobby_ghosts") &&
            isGhost &&
            !hide &&
            this.props.availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.no;

        const entryDialog = (
            <>
                <EntryDialog
                    onJoinRoom={() => {
                        this.setState({ entering: true });
                        this.props.hubChannel.sendEnteringEvent();
                        this.onRequestMicPermission();
                    }}
                    scene={this.props.scene}
                    onForceJoinRoom={() => this.onAudioReadyButton()}
                    onAudioReadyButton={this.onAudioReadyButton}
                />
            </>
        );

        const presenceLogEntries = this.props.presenceLogEntries || [];

        const mediaSource = this.props.mediaSearchStore.getUrlMediaSource(this.props.history.location);

        // Allow scene picker pre-entry, otherwise wait until entry
        const showMediaBrowser =
            mediaSource && (["scenes", "avatars", "favorites"].includes(mediaSource) || this.state.entered);

        const streaming = this.state.isStreaming;

        const showObjectList = enteredOrWatching;

        const streamer = getCurrentStreamer();
        const streamerName = streamer && streamer.displayName;

        const renderEntryFlow = (!enteredOrWatching && this.props.hub) || this.isWaitingForAutoExit();

        const canCreateRoom = !configs.feature("disable_room_creation") || configs.isAdmin();
        const canCloseRoom = this.props.hubChannel && !!this.props.hubChannel.canOrWillIfCreator("close_hub");
        const isModerator =
            this.props.hubChannel && this.props.hubChannel.canOrWillIfCreator("kick_users") && !isMobileVR;
        const isTeacher = this.props.hubChannel.canOrWillIfCreator("close_hub");

        const moreMenu = [
            {
                id: "room",
                label: <FormattedMessage id="more-menu.room" defaultMessage="Room" />,
                items: [
                    isTeacher && {
                        id: "room-info",
                        label: <FormattedMessage id="more-menu.room-info" defaultMessage="Room Permissions" />,
                        icon: HomeIcon,
                        onClick: () => this.setSidebar("room-info"),
                    },
                    (this.props.breakpoint === "sm" || this.props.breakpoint === "md") &&
                        (this.props.hub.entry_mode !== "invite" ||
                            this.props.hubChannel.canOrWillIfCreator("update_hub")) && {
                            id: "invite",
                            label: <FormattedMessage id="more-menu.invite" defaultMessage="Invite" />,
                            icon: InviteIcon,
                            onClick: () => this.props.scene.emit("action_invite"),
                        },
                    this.isFavorited()
                        ? false && {
                              id: "unfavorite-room",
                              label: (
                                  <FormattedMessage id="more-menu.unfavorite-room" defaultMessage="Unfavorite Room" />
                              ),
                              icon: StarIcon,
                              onClick: () => this.toggleFavorited(),
                          }
                        : false && {
                              id: "favorite-room",
                              label: <FormattedMessage id="more-menu.favorite-room" defaultMessage="Favorite Room" />,
                              icon: StarOutlineIcon,
                              onClick: () => this.toggleFavorited(),
                          },
                    false &&
                        isModerator &&
                        entered && {
                            id: "streamer-mode",
                            label: streaming ? (
                                <FormattedMessage
                                    id="more-menu.exit-streamer-mode"
                                    defaultMessage="Exit Streamer Mode"
                                />
                            ) : (
                                <FormattedMessage
                                    id="more-menu.enter-streamer-mode"
                                    defaultMessage="Enter Streamer Mode"
                                />
                            ),
                            icon: CameraIcon,
                            onClick: () => this.toggleStreamerMode(),
                        },
                    false &&
                        (this.props.breakpoint === "sm" || this.props.breakpoint === "md") &&
                        entered && {
                            id: "leave-room",
                            label: <FormattedMessage id="more-menu.enter-leave-room" defaultMessage="Leave Room" />,
                            icon: LeaveIcon,
                            onClick: () => {
                                this.showNonHistoriedDialog(LeaveRoomModal, {
                                    destinationUrl: "/",
                                    reason: LeaveReason.leaveRoom,
                                });
                            },
                        },
                    false &&
                        canCloseRoom && {
                            id: "close-room",
                            label: <FormattedMessage id="more-menu.close-room" defaultMessage="Close Room" />,
                            icon: DeleteIcon,
                            onClick: () =>
                                this.props.performConditionalSignIn(
                                    () => this.props.hubChannel.canOrWillIfCreator("update_hub"),
                                    () => {
                                        this.showNonHistoriedDialog(CloseRoomModal, {
                                            roomName: this.props.hub.name,
                                            onConfirm: () => {
                                                this.props.hubChannel.closeHub();
                                            },
                                        });
                                    },
                                    SignInMessages.closeRoom
                                ),
                        },
                ].filter((item) => item),
            },
            {
                id: "support",
                label: <FormattedMessage id="more-menu.support" defaultMessage="Support" />,
                items: [
                    entered && {
                        id: "start-tour",
                        label: <FormattedMessage id="more-menu.start-tour" defaultMessage="Tutorial" />,
                        icon: SupportIcon,
                        onClick: () => this.props.scene.systems.tips.resetTips(),
                    },
                    configs.feature("show_docs_link") && {
                        id: "help",
                        label: <FormattedMessage id="more-menu.help" defaultMessage="Help" />,
                        icon: SupportIcon,
                        href: configs.link("docs", "https://hubs.mozilla.com/docs"),
                    },
                    configs.feature("show_terms") && {
                        id: "tos",
                        label: <FormattedMessage id="more-menu.tos" defaultMessage="Terms of Service" />,
                        icon: TextDocumentIcon,
                        href: configs.link("terms_of_use", TERMS),
                    },
                    configs.feature("show_privacy") && {
                        id: "privacy",
                        label: <FormattedMessage id="more-menu.privacy" defaultMessage="Privacy Notice" />,
                        icon: ShieldIcon,
                        href: configs.link("privacy_notice", PRIVACY),
                    },
                ].filter((item) => item),
            },
        ];
        const hasActivePen = !!this.props.scene.systems["pen-tools"].getMyPen();
        const isWorldbuildingButtonVisible = false;

        let params = new URL(document.location).searchParams;
        let editInParam = params.get("edit") !== null;
        window.APP.editMode = editInParam;

        const isEditMode = editInParam;

        if (isEditMode) {
            return (
                <div className={classNames(rootStyles)}>
                    {!this.state.dialog &&
                        showMediaBrowser && (
                            <MediaBrowserContainer
                                history={this.props.history}
                                mediaSearchStore={this.props.mediaSearchStore}
                                hubChannel={this.props.hubChannel}
                                onMediaSearchResultEntrySelected={(entry, selectAction) => {
                                    if (entry.type === "room") {
                                        this.showNonHistoriedDialog(LeaveRoomModal, {
                                            destinationUrl: entry.url,
                                            reason: LeaveReason.joinRoom,
                                        });
                                    } else {
                                        this.props.onMediaSearchResultEntrySelected(entry, selectAction);
                                    }
                                }}
                                performConditionalSignIn={this.props.performConditionalSignIn}
                                showNonHistoriedDialog={this.showNonHistoriedDialog}
                                store={this.props.store}
                                scene={this.props.scene}
                            />
                        )}
                    <WorldEditUI
                        entered={entered}
                        store={this.props.store}
                        selectedObject={this.props.selectedObject}
                        dialog={this.state.dialog}
                        renderEntryFlow={renderEntryFlow}
                        entryDialog={entryDialog}
                        hub={this.props.hub}
                        hubChannel={this.props.hubChannel}
                        mediaSearchStore={this.props.mediaSearchStore}
                        showNonHistoriedDialog={this.showNonHistoriedDialog}
                        scene={this.props.scene}
                    />
                </div>
            );
        }

        return (
            <MoreMenuContextProvider>
                <ReactAudioContext.Provider value={this.state.audioContext}>
                    <div className={classNames(rootStyles)}>
                        {preload &&
                            this.props.hub && (
                                <PreloadOverlay
                                    hubName={this.props.hub.name}
                                    hubScene={this.props.hub.scene}
                                    baseUrl={hubUrl(this.props.hub.hub_id).href}
                                    onLoadClicked={this.props.onPreloadLoadClicked}
                                />
                            )}
                        {!this.state.dialog && (
                            <StateRoute
                                stateKey="overlay"
                                stateValue="avatar-editor"
                                history={this.props.history}
                                render={(props) => (
                                    <AvatarEditor
                                        className={styles.avatarEditor}
                                        signedIn={this.state.signedIn}
                                        onSignIn={this.showContextualSignInDialog}
                                        onSave={() => {
                                            if (
                                                props.location.state.detail &&
                                                props.location.state.detail.returnToProfile
                                            ) {
                                                this.props.history.goBack();
                                            } else {
                                                this.props.history.goBack();
                                                // We are returning to the media browser. Trigger an update so that the filter switches to
                                                // my-avatars, now that we've saved an avatar.
                                                this.props.mediaSearchStore.sourceNavigateWithNoNav("avatars", "use");
                                            }
                                            this.props.onAvatarSaved();
                                        }}
                                        onClose={() => this.props.history.goBack()}
                                        store={this.props.store}
                                        debug={avatarEditorDebug}
                                        avatarId={props.location.state.detail && props.location.state.detail.avatarId}
                                        hideDelete={
                                            props.location.state.detail && props.location.state.detail.hideDelete
                                        }
                                    />
                                )}
                            />
                        )}
                        {!this.state.dialog &&
                            showMediaBrowser && (
                                <MediaBrowserContainer
                                    history={this.props.history}
                                    mediaSearchStore={this.props.mediaSearchStore}
                                    hubChannel={this.props.hubChannel}
                                    onMediaSearchResultEntrySelected={(entry, selectAction) => {
                                        if (entry.type === "room") {
                                            this.showNonHistoriedDialog(LeaveRoomModal, {
                                                destinationUrl: entry.url,
                                                reason: LeaveReason.joinRoom,
                                            });
                                        } else {
                                            this.props.onMediaSearchResultEntrySelected(entry, selectAction);
                                        }
                                    }}
                                    performConditionalSignIn={this.props.performConditionalSignIn}
                                    showNonHistoriedDialog={this.showNonHistoriedDialog}
                                    store={this.props.store}
                                    scene={this.props.scene}
                                />
                            )}
                        {this.props.hub && (
                            <RoomLayoutContainer
                                scene={this.props.scene}
                                store={this.props.store}
                                entered={entered}
                                objectFocused={!!this.props.selectedObject}
                                streaming={streaming}
                                viewport={
                                    <>
                                        <ObjectMenu />
                                        {!this.state.dialog && renderEntryFlow ? entryDialog : undefined}
                                        {false && !this.props.selectedObject && <CompactMoreMenuButton />}
                                        {(!this.props.selectedObject ||
                                            (this.props.breakpoint !== "sm" && this.props.breakpoint !== "md")) &&
                                            !isMobile && (
                                                <ContentMenu>
                                                    {isTeacher &&
                                                        showObjectList && (
                                                            <ObjectsMenuButton
                                                                active={this.state.sidebarId === "objects"}
                                                                onClick={() => this.toggleSidebar("objects")}
                                                            />
                                                        )}
                                                    <PeopleMenuButton
                                                        active={this.state.sidebarId === "people"}
                                                        onClick={() => this.toggleSidebar("people")}
                                                        presencecount={this.state.presenceCount}
                                                    />
                                                    {this.props.hub &&
                                                        this.props.hub.user_data &&
                                                        this.props.hub.user_data.toggle_chat && (
                                                            <ChatMenuButton
                                                                active={this.state.sidebarId === "chat"}
                                                                onClick={() => this.toggleSidebar("chat")}
                                                            />
                                                        )}
                                                </ContentMenu>
                                            )}
                                        {!entered &&
                                            !streaming &&
                                            !isMobile &&
                                            streamerName && <SpectatingLabel name={streamerName} />}
                                        {this.state.sidebarId !== "chat" &&
                                            this.props.hub && (
                                                <PresenceLog
                                                    inRoom={true}
                                                    presences={this.props.presences}
                                                    entries={presenceLogEntries}
                                                    hubId={this.props.hub.hub_id}
                                                    history={this.props.history}
                                                    onViewProfile={(sessionId) =>
                                                        this.setSidebar("user", { selectedUserId: sessionId })
                                                    }
                                                />
                                            )}
                                        <TipContainer
                                            hide={this.props.activeObject}
                                            inLobby={watching}
                                            inRoom={entered}
                                            isEmbedded={this.props.embed}
                                            isStreaming={streaming}
                                            hubId={this.props.hub.hub_id}
                                            presences={this.props.presences}
                                            scene={this.props.scene}
                                            store={this.props.store}
                                        />
                                        {(showRtcDebugPanel || showAudioDebugPanel) && (
                                            <RTCDebugPanel
                                                history={this.props.history}
                                                store={window.APP.store}
                                                scene={this.props.scene}
                                                presences={this.props.presences}
                                                sessionId={this.props.sessionId}
                                                showRtcDebug={showRtcDebugPanel}
                                                showAudioDebug={showAudioDebugPanel}
                                            />
                                        )}
                                    </>
                                }
                                sidebar={
                                    this.state.sidebarId ? (
                                        <>
                                            {this.state.sidebarId === "chat" && (
                                                <ChatSidebarContainer
                                                    presences={this.props.presences}
                                                    occupantCount={this.occupantCount()}
                                                    canSpawnMessages={
                                                        entered &&
                                                        this.props.hubChannel.canOrWillIfCreator("spawn_and_move_media")
                                                    }
                                                    scene={this.props.scene}
                                                    onClose={() => this.setSidebar(null)}
                                                    inputEffect={this.state.chatInputEffect}
                                                />
                                            )}
                                            {this.state.sidebarId === "objects" && (
                                                <ObjectsSidebarContainer
                                                    hubChannel={this.props.hubChannel}
                                                    onClose={() => this.setSidebar(null)}
                                                />
                                            )}
                                            {this.state.sidebarId === "teleport-menu" && (
                                                <TeleportSidebar
                                                    room={this.props.hub}
                                                    onClose={() => this.setSidebar(null)}
                                                    hubChannel={this.props.hubChannel}
                                                />
                                            )}
                                            {this.state.sidebarId === "room-info" && (
                                                <RoomSettingsSidebarContainer
                                                    room={this.props.hub}
                                                    hubChannel={this.props.hubChannel}
                                                    showBackButton
                                                    onClose={() => this.setSidebar(null)}
                                                    onChangeScene={this.onChangeScene}
                                                />
                                            )}
                                            {this.state.sidebarId === "room-info-settings" && (
                                                <RoomSettingsSidebarContainer
                                                    room={this.props.hub}
                                                    hubChannel={this.props.hubChannel}
                                                    showBackButton
                                                    onClose={() => this.setSidebar(null)}
                                                />
                                            )}
                                            {this.state.sidebarId === "room-settings" && (
                                                <RoomSettingsSidebarContainer
                                                    room={this.props.hub}
                                                    accountId={this.props.sessionId}
                                                    hubChannel={this.props.hubChannel}
                                                    onClose={() => this.setSidebar(null)}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        undefined
                                    )
                                }
                                modal={this.state.dialog}
                                toolbarLeft={<></>}
                                toolbarCenter={
                                    <>
                                        {watching && (
                                            <>
                                                <ToolbarButton
                                                    icon={<EnterIcon />}
                                                    label={
                                                        <FormattedMessage
                                                            id="toolbar.join-room-button"
                                                            defaultMessage="Join Room"
                                                        />
                                                    }
                                                    preset="accent1"
                                                    onClick={() => this.setState({ watching: false })}
                                                />
                                                {enableSpectateVRButton && (
                                                    <ToolbarButton
                                                        icon={<VRIcon />}
                                                        preset="accent1"
                                                        label={
                                                            <FormattedMessage
                                                                id="toolbar.spectate-in-vr-button"
                                                                defaultMessage="Spectate in VR"
                                                            />
                                                        }
                                                        onClick={() => this.props.scene.enterVR()}
                                                    />
                                                )}
                                            </>
                                        )}
                                        {entered &&
                                            this.state.isWorldBuilding && (
                                                // TODO: Worldbuilding toolbar
                                                <>
                                                    <div className="toolbarGroup">
                                                        <ToolbarButton
                                                            key={"back"}
                                                            icon={<BackIcon />}
                                                            tipTitle={"Exit worldbuilding"}
                                                            tipBody={
                                                                "Finish editing and go back to the room as an avatar"
                                                            }
                                                            onClick={() => this.setState({ isWorldBuilding: false })}
                                                            label={
                                                                <FormattedMessage
                                                                    id="place-popover.item-type.pen"
                                                                    defaultMessage="Pen"
                                                                />
                                                            }
                                                            preset="accent1"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        {entered &&
                                            !this.state.isWorldBuilding && (
                                                <>
                                                    <div className="toolbarGroup">
                                                        {this.props.hub &&
                                                            this.props.hub.user_data &&
                                                            this.props.hub.user_data.toggle_voice && (
                                                                <AudioPopoverContainer scene={this.props.scene} />
                                                            )}
                                                        <RaiseHandButton
                                                            scene={this.props.scene}
                                                            initialPresence={getPresenceProfileForSession(
                                                                this.props.presences,
                                                                this.props.sessionId
                                                            )}
                                                        />
                                                        {this.props.hubChannel.canOrWillIfCreator("spawn_emoji") && (
                                                            <ReactionPopoverContainer
                                                                scene={this.props.scene}
                                                                initialPresence={getPresenceProfileForSession(
                                                                    this.props.presences,
                                                                    this.props.sessionId
                                                                )}
                                                            />
                                                        )}

                                                        {isMobile && (
                                                            <ToolbarButton
                                                                key={"chat"}
                                                                icon={<ChatIcon />}
                                                                onClick={() => this.toggleSidebar("chat")}
                                                                label={
                                                                    <FormattedMessage
                                                                        id="place-popover.item-type.pen"
                                                                        defaultMessage="Pen"
                                                                    />
                                                                }
                                                                preset="accent1"
                                                            />
                                                        )}
                                                    </div>
                                                    {!isMobile && (
                                                        <div className="toolbarGroup">
                                                            <SharePopoverContainer
                                                                scene={this.props.scene}
                                                                hubChannel={this.props.hubChannel}
                                                            />
                                                            {(isTeacher ||
                                                                this.props.hubChannel.canOrWillIfCreator(
                                                                    "spawn_drawing"
                                                                )) && (
                                                                <ToolbarButton
                                                                    key={"pen"}
                                                                    icon={<PenIcon />}
                                                                    tipTitle={"Pen Tool"}
                                                                    tipBody={"Toggle a pen to draw on surfaces"}
                                                                    selected={hasActivePen}
                                                                    onClick={() =>
                                                                        this.props.scene.emit("penButtonPressed")
                                                                    }
                                                                    label={
                                                                        <FormattedMessage
                                                                            id="place-popover.item-type.pen"
                                                                            defaultMessage="Pen"
                                                                        />
                                                                    }
                                                                    preset="accent1"
                                                                />
                                                            )}
                                                            {(isTeacher ||
                                                                this.props.hubChannel.canOrWillIfCreator(
                                                                    "spawn_and_move_media"
                                                                )) && (
                                                                <StickyNotePopover
                                                                    scene={this.props.scene}
                                                                    hubChannel={this.props.hubChannel}
                                                                    mediaSearchStore={this.props.mediaSearchStore}
                                                                    showNonHistoriedDialog={this.showNonHistoriedDialog}
                                                                />
                                                            )}
                                                            {(isTeacher ||
                                                                this.props.hubChannel.canOrWillIfCreator(
                                                                    "spawn_and_move_media"
                                                                )) && (
                                                                <PlacePopoverContainer
                                                                    scene={this.props.scene}
                                                                    hubChannel={this.props.hubChannel}
                                                                    mediaSearchStore={this.props.mediaSearchStore}
                                                                    showNonHistoriedDialog={this.showNonHistoriedDialog}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                    {!isMobile && (
                                                        <div className="toolbarGroup">
                                                            <StudentPopoverContainer
                                                                scene={this.props.scene}
                                                                hubChannel={this.props.hubChannel}
                                                                closeDialog={this.closeDialog}
                                                                mediaSearchStore={this.props.mediaSearchStore}
                                                                showNonHistoriedDialog={this.showNonHistoriedDialog}
                                                                onViewRoomSettings={() =>
                                                                    this.setSidebar("room-settings")
                                                                }
                                                                onViewTeleportMenu={() =>
                                                                    this.setSidebar("teleport-menu")
                                                                }
                                                            />
                                                            {isTeacher && (
                                                                <TeacherPopoverContainer
                                                                    closeDialog={this.closeDialog}
                                                                    scene={this.props.scene}
                                                                    hubChannel={this.props.hubChannel}
                                                                    mediaSearchStore={this.props.mediaSearchStore}
                                                                    showNonHistoriedDialog={this.showNonHistoriedDialog}
                                                                    onViewRoomSettings={() =>
                                                                        this.setSidebar("room-settings")
                                                                    }
                                                                    onViewTeleportMenu={() =>
                                                                        this.setSidebar("teleport-menu")
                                                                    }
                                                                />
                                                            )}
                                                            {isWorldbuildingButtonVisible && (
                                                                <ToolbarButton
                                                                    key={"worldbuilding"}
                                                                    icon={<EditWorldIcon />}
                                                                    onClick={() => this.enableWorldBuilding()}
                                                                    label={
                                                                        <FormattedMessage
                                                                            id="place-popover.item-type.pen"
                                                                            defaultMessage="Pen"
                                                                        />
                                                                    }
                                                                    preset="accent1"
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        {entered &&
                                            isMobileVR && (
                                                <ToolbarButton
                                                    className={styleUtils.hideLg}
                                                    icon={<VRIcon />}
                                                    preset="accept"
                                                    label={
                                                        <FormattedMessage
                                                            id="toolbar.enter-vr-button"
                                                            defaultMessage="Enter VR"
                                                        />
                                                    }
                                                    onClick={() => exit2DInterstitialAndEnterVR(true)}
                                                />
                                            )}
                                    </>
                                }
                                toolbarRight={
                                    <>
                                        {entered && (
                                            <div className="toolbarGroupRight">
                                                <HelpPopover />
                                                <ChangeAvatarPopover />
                                                <SettingsPopover onClick={() => this.setState({ showPrefs: true })} />
                                                {isTeacher &&
                                                    !isMobile && (
                                                        <>
                                                            <InvitePopoverContainer
                                                                hub={this.props.hub}
                                                                hubChannel={this.props.hubChannel}
                                                                scene={this.props.scene}
                                                            />
                                                        </>
                                                    )}
                                                {isMobileVR && (
                                                    <ToolbarButton
                                                        icon={<VRIcon />}
                                                        preset="accept"
                                                        label={
                                                            <FormattedMessage
                                                                id="toolbar.enter-vr-button"
                                                                defaultMessage="Enter VR"
                                                            />
                                                        }
                                                        onClick={() => exit2DInterstitialAndEnterVR(true)}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </>
                                }
                            />
                        )}
                    </div>
                </ReactAudioContext.Provider>
            </MoreMenuContextProvider>
        );
    }
}

function UIRootHooksWrapper(props) {
    useAccessibleOutlineStyle();
    const breakpoint = useCssBreakpoints();

    useEffect(
        () => {
            const el = document.getElementById("preload-overlay");
            el.classList.add("loaded");

            const sceneEl = props.scene;

            sceneEl.classList.add(roomLayoutStyles.scene);

            // Remove the preload overlay after the animation has finished.
            const timeout = setTimeout(() => {
                el.remove();
            }, 500);

            return () => {
                clearTimeout(timeout);
                sceneEl.classList.remove(roomLayoutStyles.scene);
            };
        },
        [props.scene]
    );

    let params = new URL(document.location).searchParams;
    let editInParam = params.get("edit") !== null;
    window.APP.editMode = editInParam;

    const isEditMode = editInParam;
    if (isEditMode) {
        return (
            <ChatContextProvider messageDispatch={props.messageDispatch}>
                <ObjectListProvider editMode={isEditMode} scene={props.scene}>
                    <UIRoot breakpoint={breakpoint} {...props} />
                </ObjectListProvider>
            </ChatContextProvider>
        );
    }

    return (
        <ChatContextProvider messageDispatch={props.messageDispatch}>
            <ObjectListProvider scene={props.scene}>
                <Toaster />
                <UIRoot breakpoint={breakpoint} {...props} />
            </ObjectListProvider>
        </ChatContextProvider>
    );
}

UIRootHooksWrapper.propTypes = {
    scene: PropTypes.object.isRequired,
    messageDispatch: PropTypes.object,
    store: PropTypes.object.isRequired,
};

export default UIRootHooksWrapper;
