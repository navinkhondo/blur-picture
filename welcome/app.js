// Blur Picture welcome page: shows the pin guide or the usage guide.
// Code from the Captain Bootcamp 26 lesson 3.2 "Создаем Welcome Page" (platform text of 13.10.2026), unchanged
// except for STORE_EXTENSION_ID. Rules, strongest first: manual choice (#pin / #usage or the switch link) >
// live reply of the extension (every 1.5 s on a visible tab and on return to the tab) > ?pinned=1|0 hint > pin guide.
(function () {
  "use strict";
  // TODO(Blur Picture): replace with the Chrome Web Store ID. It appears top left in the CWS developer dashboard
  // right after the first draft upload, before publication (module 3, nuance 7). Until then the page relies on ?id=.
  var STORE_EXTENSION_ID = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; // your Web Store ID
  var POLL_INTERVAL_MS = 1500;
  var params = new URLSearchParams(location.search);
  // Use the ID from the link (developer-mode installs differ), else the store ID.
  var extensionId = /^[a-p]{32}$/.test(params.get("id") || "") ? params.get("id") : STORE_EXTENSION_ID;
  var manual = false;          // the user picked a mode by hand
  var reachable = true;        // the extension answers our messages
  var pollTimer = 0;
  function setMode(mode) {
    if (mode === "pin" || mode === "usage") document.body.dataset.mode = mode;
  }
  function stopPolling() { clearInterval(pollTimer); pollTimer = 0; }
  // Ask the extension whether its icon is on the toolbar right now.
  function checkPinState() {
    if (manual || !reachable) return;
    var runtime = window.chrome && chrome.runtime;
    // chrome.runtime exists here only thanks to externally_connectable.
    if (!runtime || typeof runtime.sendMessage !== "function") { reachable = false; stopPolling(); return; }
    runtime.sendMessage(extensionId, { type: "getPinState" }, function (reply) {
      if (runtime.lastError) {          // not installed, disabled or an old version
        reachable = false; stopPolling(); return;
      }
      if (!manual && reply && typeof reply.isOnToolbar === "boolean") {
        setMode(reply.isOnToolbar ? "usage" : "pin");
      }
    });
  }
  // Start: hash > link hint > default.
  var hash = location.hash.slice(1);
  if (hash === "pin" || hash === "usage") {
    manual = true; setMode(hash);
  } else {
    setMode(params.get("pinned") === "1" ? "usage" : "pin");
    checkPinState();
    pollTimer = setInterval(function () {
      if (document.visibilityState === "visible") checkPinState();
    }, POLL_INTERVAL_MS);
  }
  // Re-check as soon as the user comes back from the toolbar.
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") checkPinState();
  });
  // Manual switch links always win.
  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-switch]");
    if (!link) return;
    e.preventDefault();
    manual = true; stopPolling();
    setMode(link.dataset.switch);
    history.replaceState(null, "", "#" + link.dataset.switch);
  });
})();
