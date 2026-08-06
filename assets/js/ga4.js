"use strict";

(function () {
  var GA_MEASUREMENT_ID = "G-KNYX0KWLY";

  if (window.dataLayer && window.dataLayer.__ga4Initialized) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.__ga4Initialized = true;

  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);

  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
  document.head.appendChild(script);
})();
