import configs from "./utils/configs";

const ga = window.ga;

export default function registerTelemetry(trackedPage, trackedTitle) {
  const gaTrackingId = configs.GA_TRACKING_ID;

  if (ga && gaTrackingId) {
    console.log("Tracking: Google Analytics ID: " + gaTrackingId);

    ga("create", gaTrackingId, "auto");

    if (trackedPage) {
      ga("set", "page", trackedPage);
    }

    if (trackedTitle) {
      ga("set", "title", trackedTitle);
    }

    ga("send", "pageview");
  }
}
