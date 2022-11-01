import React, { Component, useEffect, useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import screenfull from "screenfull";
import { Toaster } from "react-hot-toast";

import ReactGA from "react-ga4";
import "bootstrap/dist/css/bootstrap.min.css";

import configs from "../utils/configs";
import { VR_DEVICE_AVAILABILITY } from "../utils/vr-caps-detect";
import styles from "../assets/stylesheets/ui-root.scss";
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
import { isIOS } from "../utils/is-mobile";

import MediaBrowserContainer from "./media-browser";

import EntryStartPanel from "./entry-start-panel.js";
import PreferencesScreen from "./preferences-screen.js";
import PreloadOverlay from "./preload-overlay.js";
import RTCDebugPanel from "./debug-panel/RtcDebugPanel.js";
import { showFullScreenIfAvailable, showFullScreenIfWasFullScreen } from "../utils/fullscreen";

import { LoadingScreenContainer } from "./room/LoadingScreenContainer";

import { RoomLayoutContainer } from "./room/RoomLayoutContainer";
import roomLayoutStyles from "./layout/RoomLayout.scss";
import { ToolbarButton } from "./input/ToolbarButton";
import { RoomEntryModal } from "./room/RoomEntryModal";
import { InvitePopoverContainer } from "./room/InvitePopoverContainer";
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
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { PlacePopoverContainer } from "./room/PlacePopoverContainer";
import { TeacherPopoverContainer } from "../mega-src/react-components/room/popovers/TeacherPopoverContainer";
import { ObjectMenu } from "../mega-src/react-components/room/ObjectMenu";
import { SidebarMenu } from "../mega-src/react-components/room/SidebarMenu";
import { KeyHintsNormal } from "../mega-src/react-components/room/KeyHintsNormal";
import { TopMenu } from "../mega-src/react-components/room/TopMenu";
import { ChatSystem } from "../mega-src/react-components/room/ChatSystem";
import { HelpPopover } from "../mega-src/react-components/room/popovers/HelpPopover";
import { SettingsPopover } from "../mega-src/react-components/room/popovers/SettingsPopover";
import { ChangeAvatarPopover } from "../mega-src/react-components/room/popovers/ChangeAvatarPopover";
import { EntryDialog } from "../mega-src/react-components/room/entry/EntryDialog";
import { StickyNotePopover } from "../mega-src/react-components/room/popovers/StickyNotePopover";
import { StudentPopoverContainer } from "../mega-src/react-components/room/popovers/StudentPopoverContainer";
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
import { ExitReason } from "./room/ExitedRoomScreen";
import { UserProfileSidebarContainer } from "./room/UserProfileSidebarContainer";
import { WebVRUnsupportedModal } from "./room/WebVRUnsupportedModal";
import { TipContainer, FullscreenTip } from "./room/TipContainer";
import { SignInMessages } from "./auth/SignInModal";
import { MediaDevicesEvents } from "../utils/media-devices-utils";

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
        forcedVREntryType: PropTypes.string,
        store: PropTypes.object,
        mediaSearchStore: PropTypes.object,
        scene: PropTypes.object,
        authChannel: PropTypes.object,
        hubChannel: PropTypes.object,
        hub: PropTypes.object,
        presenceLogEntries: PropTypes.array,
        presences: PropTypes.object,
        sessionId: PropTypes.string,
        showSignInDialog: PropTypes.bool,
        signInMessage: PropTypes.object,
        onContinueAfterSignIn: PropTypes.func,
        showSafariMicDialog: PropTypes.bool,
        onMediaSearchResultEntrySelected: PropTypes.func,
        location: PropTypes.object,
        history: PropTypes.object,
        performConditionalSignIn: PropTypes.func,
        hide: PropTypes.bool,
        showPreload: PropTypes.bool,
        onPreloadLoadClicked: PropTypes.func,
        onLoaded: PropTypes.func,
        activeObject: PropTypes.object,
        selectedObject: PropTypes.object,
        breakpoint: PropTypes.string,
    };

    state = {
        enterInVR: false,
        entered: false,
        entering: false,
        mobileChat: false,
        dialog: null,
        noMoreLoadingUpdates: false,
        hideLoader: false,
        showPrefs: false,

        waitingOnAudio: false,

        signedIn: false,
        videoShareMediaSource: null,
        showVideoShareFailed: false,

        objectInfo: null,
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

    componentDidMount() {
        this.props.scene.addEventListener("loaded", this.onSceneLoaded);
        this.props.scene.addEventListener("share_video_enabled", this.onShareVideoEnabled);
        this.props.scene.addEventListener("share_video_disabled", this.onShareVideoDisabled);
        this.props.scene.addEventListener("share_video_failed", this.onShareVideoFailed);
        this.props.scene.addEventListener("exit", this.exitEventHandler);
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

        this.playerRig = scene.querySelector("#avatar-rig");
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
        this.props.store.removeEventListener("statechanged", this.storeUpdated);
        window.removeEventListener("concurrentload", this.onConcurrentLoad);
        window.removeEventListener("activity_detected", this.onActivityDetected);
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

    onLoadingFinished = () => {
        // console.log("UI root loading has finished");
        this.setState({ noMoreLoadingUpdates: true });
        this.props.scene.emit("loading_finished");

        if (this.props.onLoaded) {
            this.props.onLoaded();
        }
    };

    onSceneLoaded = () => {
        // console.log("UI root scene has loaded");
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
        ReactGA.event({
            category: "entry",
            action: "enter_classroom",
            label: "Entered a classroom", // optional
            nonInteraction: true, // optional, true/false
        });

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

        this.setState({ entered: true, entering: false });

        if (this.mediaDevicesManager.isMicShared) {
            console.log(`Using microphone: ${this.mediaDevicesManager.selectedMicLabel}`);
        }

        if (this.mediaDevicesManager.isVideoShared) {
            console.log("Screen sharing enabled.");
        }
    };

    closeDialog = () => {
        if (this.state.dialog) {
            this.setState({ dialog: null });
        }

        showFullScreenIfWasFullScreen();
    };

    showNonHistoriedDialog = (DialogClass, props = {}) => {
        this.setState({
            dialog: <DialogClass {...{ onClose: this.closeDialog, ...props }} />,
        });
    };

    renderDialog = (DialogClass, props = {}) => <DialogClass {...{ onClose: this.closeDialog, ...props }} />;

    signOut = async () => {
        await this.props.authChannel.signOut(this.props.hubChannel);
        this.setState({ signedIn: false });
    };

    sendMessage = (msg) => {
        this.props.onSendMessage(msg);
    };

    occupantCount = () => {
        let ret = this.props.presences ? Object.entries(this.props.presences) : [];

        let filteredRet = ret.filter((user) => user[1].metas[0].profile.displayName !== "teacher_bot_2df");

        return filteredRet.length;
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

    getSelectedUser() {
        const selectedUserId = this.state.selectedUserId;
        const presence = this.props.presences[selectedUserId];
        const micPresences = getMicrophonePresences();
        return userFromPresence(selectedUserId, presence, micPresences, this.props.sessionId);
    }

    render() {
        const hide = this.state.hide || this.props.hide;

        const rootStyles = {
            [styles.ui]: true,
            "ui-root": true,
            "in-modal-or-overlay": this.isInModalOrOverlay(),
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

        const entered = this.state.entered;
        const showRtcDebugPanel = this.props.store.state.preferences.showRtcDebugPanel;
        const showAudioDebugPanel = this.props.store.state.preferences.showAudioDebugPanel;

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

        const showObjectList = entered;

        const renderEntryFlow = !entered && this.props.hub;

        const isTeacher = this.props.hubChannel.canOrWillIfCreator("close_hub");

        const hasActivePen = !!this.props.scene.systems["pen-tools"].getMyPen();

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
                            viewport={
                                <>
                                    <TopMenu sessionId={this.props.sessionId} presences={this.props.presences} />
                                    <ObjectMenu />
                                    <SidebarMenu />
                                    {!this.state.dialog && renderEntryFlow ? entryDialog : undefined}
                                    <TipContainer
                                        hide={this.props.activeObject}
                                        inRoom={entered}
                                        hubId={this.props.hub.hub_id}
                                        presences={this.props.presences}
                                        scene={this.props.scene}
                                        store={this.props.store}
                                    />
                                </>
                            }
                            sidebar={
                                this.state.sidebarId ? (
                                    <>
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
                                    </>
                                ) : (
                                    undefined
                                )
                            }
                            modal={this.state.dialog}
                            toolbarLeft={
                                <>
                                    <ChatSystem
                                        canChat={
                                            isTeacher ||
                                            (this.props.hub.user_data && this.props.hub.user_data.toggle_chat)
                                        }
                                    />
                                </>
                            }
                            toolbarCenter={
                                !this.state.mobileChat ? (
                                    <>
                                        {entered && (
                                            <>
                                                <div className="toolbarGroup">
                                                    {this.props.hub.user_data &&
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
                                                            onClick={() => this.setState({ mobileChat: true })}
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
                                                        {this.props.hub.user_data &&
                                                        this.props.hub.user_data.toggle_share !== undefined ? (
                                                            <>
                                                                {this.props.hub.user_data.toggle_share === true ? (
                                                                    <SharePopoverContainer
                                                                        scene={this.props.scene}
                                                                        hubChannel={this.props.hubChannel}
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        {isTeacher && (
                                                                            <SharePopoverContainer
                                                                                scene={this.props.scene}
                                                                                hubChannel={this.props.hubChannel}
                                                                            />
                                                                        )}
                                                                    </>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <SharePopoverContainer
                                                                scene={this.props.scene}
                                                                hubChannel={this.props.hubChannel}
                                                            />
                                                        )}
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

                                                        {this.props.hub.user_data &&
                                                        this.props.hub.user_data.toggle_stickynote !== undefined ? (
                                                            <>
                                                                {this.props.hub.user_data.toggle_stickynote === true ? (
                                                                    <StickyNotePopover
                                                                        scene={this.props.scene}
                                                                        hubChannel={this.props.hubChannel}
                                                                        mediaSearchStore={this.props.mediaSearchStore}
                                                                        showNonHistoriedDialog={
                                                                            this.showNonHistoriedDialog
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        {isTeacher && (
                                                                            <StickyNotePopover
                                                                                scene={this.props.scene}
                                                                                hubChannel={this.props.hubChannel}
                                                                                mediaSearchStore={
                                                                                    this.props.mediaSearchStore
                                                                                }
                                                                                showNonHistoriedDialog={
                                                                                    this.showNonHistoriedDialog
                                                                                }
                                                                            />
                                                                        )}
                                                                    </>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <StickyNotePopover
                                                                scene={this.props.scene}
                                                                hubChannel={this.props.hubChannel}
                                                                mediaSearchStore={this.props.mediaSearchStore}
                                                                showNonHistoriedDialog={this.showNonHistoriedDialog}
                                                            />
                                                        )}

                                                        {this.props.hub.user_data &&
                                                        this.props.hub.user_data.toggle_media !== undefined ? (
                                                            <>
                                                                {this.props.hub.user_data.toggle_media === true ? (
                                                                    <PlacePopoverContainer
                                                                        scene={this.props.scene}
                                                                        hubChannel={this.props.hubChannel}
                                                                        mediaSearchStore={this.props.mediaSearchStore}
                                                                        showNonHistoriedDialog={
                                                                            this.showNonHistoriedDialog
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        {isTeacher && (
                                                                            <PlacePopoverContainer
                                                                                scene={this.props.scene}
                                                                                hubChannel={this.props.hubChannel}
                                                                                mediaSearchStore={
                                                                                    this.props.mediaSearchStore
                                                                                }
                                                                                showNonHistoriedDialog={
                                                                                    this.showNonHistoriedDialog
                                                                                }
                                                                            />
                                                                        )}
                                                                    </>
                                                                )}
                                                            </>
                                                        ) : (
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
                                                        />
                                                        {isTeacher && (
                                                            <TeacherPopoverContainer
                                                                closeDialog={this.closeDialog}
                                                                scene={this.props.scene}
                                                                hubChannel={this.props.hubChannel}
                                                                mediaSearchStore={this.props.mediaSearchStore}
                                                                showNonHistoriedDialog={this.showNonHistoriedDialog}
                                                                onViewRoomPermissions={() =>
                                                                    this.setSidebar("room-permissions")
                                                                }
                                                                onViewTeleportMenu={() =>
                                                                    this.setSidebar("teleport-menu")
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <ChatSystem
                                        isMobile={true}
                                        hideMobile={() => this.setState({ mobileChat: false })}
                                        canChat={
                                            isTeacher ||
                                            (this.props.hub.user_data && this.props.hub.user_data.toggle_chat)
                                        }
                                    />
                                )
                            }
                            toolbarRight={
                                !this.state.mobileChat && (
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
                                            </div>
                                        )}
                                    </>
                                )
                            }
                        />
                    )}
                </div>
            </ReactAudioContext.Provider>
        );
    }
}

function UIRootHooksWrapper(props) {
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
                <KeyHintsNormal />
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
