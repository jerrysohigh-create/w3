(function () {
  var chartState = new WeakMap();

  function escapeText(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function fallback(svg, message) {
    if (!svg) return;
    svg.setAttribute("viewBox", "0 0 360 220");
    svg.innerHTML =
      '<text x="180" y="112" text-anchor="middle" fill="#96969e" font-family="JetBrains Mono, monospace" font-size="11">' +
      escapeText(message || "SOURCE TEMPORARILY UNAVAILABLE") +
      "</text>";
  }

  function normalize(payload) {
    if (!payload || !Array.isArray(payload.rows)) return [];
    return payload.rows
      .slice()
      .filter(function (row) {
        return row && row.day && Number.isFinite(Number(row.total_participants));
      })
      .sort(function (a, b) {
        return String(a.day).localeCompare(String(b.day));
      });
  }

  function getScale(rows) {
    var maximum = Math.max.apply(
      null,
      rows.map(function (row) {
        return Number(row.total_participants);
      }),
    );
    var step = maximum > 60000 ? 20000 : maximum > 30000 ? 10000 : 5000;
    var yMax = Math.max(step, Math.ceil(maximum / step) * step);
    return { maximum: maximum, step: step, yMax: yMax };
  }

  function grid(parts, ticks, yMax, margin, chartWidth, chartHeight, fontSize) {
    ticks.forEach(function (tick) {
      var y = margin.top + chartHeight - (tick / yMax) * chartHeight;
      parts.push(
        '<line x1="' + margin.left + '" y1="' + y.toFixed(1) + '" x2="' + (margin.left + chartWidth) + '" y2="' + y.toFixed(1) + '" stroke="rgba(255,255,255,.08)" stroke-width="1" />',
      );
      parts.push(
        '<text x="' + (margin.left - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" fill="#6d6e77" font-family="JetBrains Mono, monospace" font-size="' + fontSize + '">' +
          (tick === 0 ? "0" : tick / 1000 + "k") +
          "</text>",
      );
    });
  }

  function renderDesktop(svg, rows, payload) {
    var width = 900;
    var height = 340;
    var margin = { top: 38, right: 20, bottom: 52, left: 62 };
    var chartWidth = width - margin.left - margin.right;
    var chartHeight = height - margin.top - margin.bottom;
    var scale = getScale(rows);
    var ticks = [];
    for (var value = 0; value <= scale.yMax; value += scale.step) ticks.push(value);
    var milestones = payload.milestones || {};
    var xKeyDates = [rows[0].day]
      .concat(Object.keys(milestones))
      .concat(rows[rows.length - 1].day)
      .filter(function (day, index, all) {
        return all.indexOf(day) === index;
      });
    var slot = chartWidth / rows.length;
    var barWidth = Math.max(2, slot * 0.68);
    var parts = [];

    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    grid(parts, ticks, scale.yMax, margin, chartWidth, chartHeight, 10);

    rows.forEach(function (row, index) {
      var number = Number(row.total_participants);
      var x = margin.left + index * slot + (slot - barWidth) / 2;
      var barHeight = (number / scale.yMax) * chartHeight;
      var y = margin.top + chartHeight - barHeight;
      var milestone = Object.prototype.hasOwnProperty.call(milestones, row.day);
      parts.push(
        '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barWidth.toFixed(1) + '" height="' + barHeight.toFixed(1) + '" fill="' + (milestone ? "#00d4d4" : "rgba(0,212,212,.38)") + '"><title>' +
          escapeText(row.day + ": " + number.toLocaleString("en-US")) +
          "</title></rect>",
      );
      if (milestone) {
        parts.push(
          '<text x="' + (x + barWidth / 2).toFixed(1) + '" y="' + Math.max(18, y - 7).toFixed(1) + '" text-anchor="middle" fill="#f2f3f3" font-family="JetBrains Mono, monospace" font-size="10" font-weight="600">' +
            number.toLocaleString("en-US") +
            "</text>",
        );
      }
    });

    parts.push(
      '<line x1="' + margin.left + '" y1="' + (margin.top + chartHeight) + '" x2="' + (margin.left + chartWidth) + '" y2="' + (margin.top + chartHeight) + '" stroke="#5f6068" stroke-width="1" />',
    );
    rows.forEach(function (row, index) {
      if (xKeyDates.indexOf(row.day) === -1) return;
      var x = margin.left + index * slot + slot / 2;
      parts.push(
        '<text x="' + x.toFixed(1) + '" y="' + (margin.top + chartHeight + 22) + '" text-anchor="middle" fill="#96969e" font-family="JetBrains Mono, monospace" font-size="9">' +
          escapeText(row.day.slice(5)) +
          "</text>",
      );
    });
    svg.innerHTML = parts.join("");
  }

  function renderMobile(svg, rows, payload) {
    var width = 360;
    var height = 286;
    var margin = { top: 28, right: 12, bottom: 42, left: 42 };
    var chartWidth = width - margin.left - margin.right;
    var chartHeight = height - margin.top - margin.bottom;
    var scale = getScale(rows);
    var ticks = [0, scale.yMax / 2, scale.yMax];
    var milestones = payload.milestones || {};
    var points = rows.map(function (row, index) {
      return {
        day: row.day,
        value: Number(row.total_participants),
        x: margin.left + (index / Math.max(1, rows.length - 1)) * chartWidth,
        y: margin.top + chartHeight - (Number(row.total_participants) / scale.yMax) * chartHeight,
      };
    });
    var linePath = points.map(function (point, index) {
      return (index ? "L" : "M") + point.x.toFixed(1) + " " + point.y.toFixed(1);
    }).join(" ");
    var areaPath = linePath + " L" + (margin.left + chartWidth) + " " + (margin.top + chartHeight) + " L" + margin.left + " " + (margin.top + chartHeight) + " Z";
    var parts = [
      '<defs><linearGradient id="s1-mobile-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00d4d4" stop-opacity=".34"/><stop offset="100%" stop-color="#00d4d4" stop-opacity=".02"/></linearGradient></defs>',
    ];

    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    grid(parts, ticks, scale.yMax, margin, chartWidth, chartHeight, 9);
    parts.push('<path d="' + areaPath + '" fill="url(#s1-mobile-area)" />');
    parts.push('<path d="' + linePath + '" fill="none" stroke="#00d4d4" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round" />');

    points.forEach(function (point) {
      if (!Object.prototype.hasOwnProperty.call(milestones, point.day)) return;
      parts.push(
        '<circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="3.5" fill="#09090b" stroke="#7ce5e5" stroke-width="2"><title>' +
          escapeText(point.day + ": " + point.value.toLocaleString("en-US")) +
          "</title></circle>",
      );
    });

    var first = points[0];
    var middle = points[Math.floor((points.length - 1) / 2)];
    var last = points[points.length - 1];
    [first, middle, last].forEach(function (point, index) {
      var anchor = index === 0 ? "start" : index === 2 ? "end" : "middle";
      parts.push(
        '<text x="' + point.x.toFixed(1) + '" y="' + (margin.top + chartHeight + 21) + '" text-anchor="' + anchor + '" fill="#96969e" font-family="JetBrains Mono, monospace" font-size="9">' +
          escapeText(point.day.slice(5)) +
          "</text>",
      );
    });

    parts.push(
      '<g transform="translate(' + (last.x - 6).toFixed(1) + " " + Math.max(16, last.y - 16).toFixed(1) + ')"><text text-anchor="end" fill="#f2f3f3" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">' +
        last.value.toLocaleString("en-US") +
        '</text><text y="13" text-anchor="end" fill="#7ce5e5" font-family="JetBrains Mono, monospace" font-size="8">LATEST</text></g>',
    );
    svg.innerHTML = parts.join("");
  }

  function render(svg, payload) {
    var rows = normalize(payload);
    if (!svg || !rows.length) {
      fallback(svg);
      return false;
    }
    var mobile = window.matchMedia("(max-width: 600px)").matches;
    svg.dataset.chartMode = mobile ? "mobile-line" : "desktop-bars";
    svg.setAttribute(
      "aria-label",
      mobile ? "Season 1 累計參與錢包位址成長折線圖" : "Season 1 累計參與錢包位址成長長條圖",
    );
    if (mobile) renderMobile(svg, rows, payload);
    else renderDesktop(svg, rows, payload);
    chartState.set(svg, payload);
    return true;
  }

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      document.querySelectorAll("svg[data-chart-mode]").forEach(function (svg) {
        var payload = chartState.get(svg);
        var shouldBeMobile = window.matchMedia("(max-width: 600px)").matches;
        if (payload && (svg.dataset.chartMode === "mobile-line") !== shouldBeMobile) render(svg, payload);
      });
    }, 120);
  });

  window.W3SeasonChart = { render: render, fallback: fallback };
})();
