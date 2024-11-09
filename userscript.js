// ==UserScript==
// @name         Planspiel Börse - Tools
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  TamperMonkey script for customizing the Planspiel Börse Webapp
// @author       Vincenz Ernst
// @match        https://trading.planspiel-boerse.de/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=planspiel-boerse.de
// @grant        none
// @source       https://github.com/vinc3nz/Planspiel-Boerse-Tools
// @updateURL    https://raw.githubusercontent.com/vinc3nz/Planspiel-Boerse-Tools/refs/heads/main/userscript.js
// @downloadURL  https://raw.githubusercontent.com/vinc3nz/Planspiel-Boerse-Tools/refs/heads/main/userscript.js
// ==/UserScript==

(function () {
  "use strict";

  function roundNumber(num, scale) {
    if (!("" + num).includes("e")) {
      return +(Math.round(num + "e+" + scale) + "e-" + scale);
    } else {
      var arr = ("" + num).split("e");
      var sig = "";
      if (+arr[1] + scale > 0) {
        sig = "+";
      }
      return +(
        Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) +
        "e-" +
        scale
      );
    }
  }

  function parseJwt(token) {
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    var jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    return JSON.parse(jsonPayload);
  }

  async function run() {
    let portfolioID = parseJwt(window.localStorage.getItem("scat")).depotId;

    let res = await fetch(
      "https://trading.planspiel-boerse.de/stockcontest/services/api/v-ms1/portfolio/getPortfolioWithItems?portfolioId=" + portfolioID + "&withItems=true&withOrderIds=true",
      {
        credentials: "include",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "de,en-US;q=0.9,en;q=0.8",
          "Content-Type": "application/json",
          Authorization: "Bearer " + window.localStorage.getItem("scat"),
          "Sec-GPC": "1",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
        },
        referrer:
          "https://trading.planspiel-boerse.de/web/account/depot/portfolio",
        method: "GET",
        mode: "cors",
      },
    );

    let response = await res.json();

    let container = document.createElement("div");
    document.getElementById("table").innerHTML = "";

    let width = "100%";
    width =
      document.getElementById("table").getBoundingClientRect().width / 2 -
      40 +
      "px";
    let imagewidth =
      document.getElementById("table").getBoundingClientRect().width / 2 - 80;

    response.items.forEach((item) => {
      let itemContainer = document.createElement("div");
      itemContainer.style = `
  display: inline-block;
    background-color: white;
    font-size: 14px !important;
    font-family: serif !important;
    line-height: 20px !important;

    margin: 5px;
    vertical-align: top;
    color: #333;

    border-radius: 5px;
    margin: 10px;
    padding: 20px;
    border: 1px solid lightgray;


    border-radius:5px;
    -webkit-border-radius: 5px;


    display: inline-block;
    page-break-after: always;

    width: ${width};
  `;

      itemContainer.innerHTML = `
  <h1>${item.instrument.name}</h1>
  ${item.currentValue - item.buyValue > 0 ? '<p style="color: green"> Zurzeit: ' + item.currentValue + "€ (plus von " + roundNumber(item.currentValue - item.buyValue, 2) + "€)</p>" : '<p style="color: red">Zurzeit: ' + item.currentValue + "€ (minus von " + roundNumber(item.currentValue - item.buyValue, 2) + "€)</p>"}
  <img src="https://charts2.byteworx.de/bwcharts/images/MMC/plain/Web_Plain.png?key.isin=${item.instrument.isin}&key.codeMarket=_VIE&timeSpan=1Y&chart.width=${imagewidth}&chart.height=330">
  <p>Heute: ${item.instrument.performanceRel > 0 ? '<span style="color: green">' + roundNumber(item.instrument.performanceRel, 2) + "%</span>" : '<span style="color: red">' + roundNumber(item.instrument.performanceRel, 2) + "%</span>"} Seit Kauf: ${item.instrument.performanceAbs > 0 ? '<span style="color: green">' + roundNumber(item.instrument.performanceAbs, 2) + "%</span>" : '<span style="color: red">' + roundNumber(item.instrument.performanceAbs, 2) + "%</span>"}</p>
  `;

      itemContainer.onClick = function () {
        document.location.href =
          "https://trading.planspiel-boerse.de/web/instrument/" +
          item.instrument.isin +
          "/information";
      };
      itemContainer.addEventListener("click", function () {
        document.location.href =
          "https://trading.planspiel-boerse.de/web/instrument/" +
          item.instrument.isin +
          "/information";
      });
      container.appendChild(itemContainer);
    });

    document.getElementById("table").appendChild(container);
  }

  window.addEventListener("locationchange", function () {
    if (
      window.location.href.startsWith(
        "https://trading.planspiel-boerse.de/web/account/depot/portfolio",
      )
    ) {
      run();
    }
  });
  if (
    window.location.href.startsWith(
      "https://trading.planspiel-boerse.de/web/account/depot/portfolio",
    )
  ) {
    run();
  }

  var pushState = history.pushState;
  history.pushState = function () {
    pushState.apply(history, arguments);
    if (
      window.location.href.startsWith(
        "https://trading.planspiel-boerse.de/web/account/depot/portfolio",
      )
    ) {
      run();
    }
  };
})();
