const fields = document.querySelector("#dynamic-fields");
const canvas = document.querySelector("#qr-canvas");
const previewPanel = document.querySelector(".preview-panel");
const emptyPreview = document.querySelector("#empty-preview");
const status = document.querySelector("#qr-status");
const payloadCount = document.querySelector("#payload-count");
const summaryType = document.querySelector("#summary-type");
const summarySize = document.querySelector("#summary-size");
const summaryLevel = document.querySelector("#summary-level");
const summaryLogo = document.querySelector("#summary-logo");
const recentList = document.querySelector("#recent-list");
const brandName = document.querySelector("#brand-name");
const brandLogo = document.querySelector("#brand-logo");
const appTitle = document.querySelector("#app-title");
const logoPreview = document.querySelector("#logo-preview");
const logoPreviewWrap = document.querySelector(".logo-preview");

const brand = {
  appName: "MP Technology QR",
  customerName: "MP Technology Consulting",
  logoPath: "assets/mp-technology-logo.png",
  logoShortName: "MP",
  defaultFileName: "mp-technology-qr",
  tagline: "QR codes your brand can hand out with confidence.",
  sampleUrl: "https://mptechnologyconsulting.com",
  ...(window.MP_QR_BRAND || {}),
};

const controls = {
  foreground: document.querySelector("#foreground"),
  background: document.querySelector("#background"),
  errorLevel: document.querySelector("#error-level"),
  size: document.querySelector("#size"),
  margin: document.querySelector("#margin"),
  logoSize: document.querySelector("#logo-size"),
  fileName: document.querySelector("#file-name"),
  sizeValue: document.querySelector("#size-value"),
  marginValue: document.querySelector("#margin-value"),
  logoSizeValue: document.querySelector("#logo-size-value"),
};

const storageKey = `${brand.defaultFileName || "customer-qr"}-recents`;
const defaultLogoPath = brand.logoPath || "assets/mp-technology-logo.png";
let currentPayload = "";
let activeType = "url";
let activeLogo = null;

const templates = {
  url: {
    title: "URL",
    fields: [{ id: "url", label: "Website URL", type: "url", value: brand.sampleUrl, wide: true }],
    build: (data) => normalizeUrl(data.url),
    label: (data) => data.url || "URL code",
  },
  text: {
    title: "Text",
    fields: [{ id: "text", label: "Text", multiline: true, value: `Scan me from ${brand.appName}.`, wide: true }],
    build: (data) => data.text.trim(),
    label: (data) => data.text.trim().slice(0, 80) || "Text code",
  },
  email: {
    title: "Email",
    fields: [
      { id: "email", label: "Email address", type: "email", value: "hello@yourdomain.com" },
      { id: "subject", label: "Subject", value: "Hello" },
      { id: "body", label: "Message", multiline: true, value: "I scanned your QR code.", wide: true },
    ],
    build: (data) =>
      `mailto:${data.email.trim()}?subject=${encodeURIComponent(data.subject.trim())}&body=${encodeURIComponent(data.body.trim())}`,
    label: (data) => data.email || "Email code",
  },
  phone: {
    title: "Phone",
    fields: [{ id: "phone", label: "Phone number", type: "tel", value: "+15551234567", wide: true }],
    build: (data) => `tel:${data.phone.replace(/\s+/g, "")}`,
    label: (data) => data.phone || "Phone code",
  },
  sms: {
    title: "SMS",
    fields: [
      { id: "phone", label: "Phone number", type: "tel", value: "+15551234567" },
      { id: "message", label: "Message", value: "I scanned your QR code." },
    ],
    build: (data) => `sms:${data.phone.replace(/\s+/g, "")}?body=${encodeURIComponent(data.message.trim())}`,
    label: (data) => data.phone || "SMS code",
  },
  wifi: {
    title: "Wi-Fi",
    fields: [
      { id: "ssid", label: "Network name", value: "Guest WiFi" },
      { id: "password", label: "Password", type: "password", value: "guest-password" },
      {
        id: "security",
        label: "Security",
        select: [
          ["WPA", "WPA/WPA2"],
          ["WEP", "WEP"],
          ["nopass", "Open"],
        ],
      },
    ],
    build: (data) => `WIFI:T:${data.security};S:${escapeWifi(data.ssid)};P:${escapeWifi(data.password)};;`,
    label: (data) => data.ssid || "Wi-Fi code",
  },
  vcard: {
    title: "vCard",
    fields: [
      { id: "name", label: "Full name", value: "Morgan Avery" },
      { id: "company", label: "Company", value: brand.customerName },
      { id: "phone", label: "Phone", type: "tel", value: "+15551234567" },
      { id: "email", label: "Email", type: "email", value: "morgan@yourdomain.com" },
      { id: "website", label: "Website", type: "url", value: "https://yourdomain.com" },
    ],
    build: (data) =>
      [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${data.name.trim()}`,
        `ORG:${data.company.trim()}`,
        `TEL:${data.phone.trim()}`,
        `EMAIL:${data.email.trim()}`,
        `URL:${normalizeUrl(data.website)}`,
        "END:VCARD",
      ].join("\n"),
    label: (data) => data.name || "vCard code",
  },
};

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function escapeWifi(value) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function applyBrand() {
  document.title = `${brand.appName} | QR Code Generator`;
  brandName.textContent = brand.appName;
  brandLogo.src = defaultLogoPath;
  brandLogo.alt = `${brand.customerName} logo`;
  logoPreview.src = defaultLogoPath;
  logoPreview.alt = `${brand.customerName} logo`;
  appTitle.textContent = brand.tagline;
  controls.fileName.value = brand.defaultFileName || "qr-code";
  summaryLogo.textContent = brand.logoShortName || "On";
}

function renderFields(type) {
  activeType = type;
  const template = templates[type];
  fields.className = `dynamic-fields ${template.fields.length > 2 ? "two-col" : ""}`;
  fields.replaceChildren(...template.fields.map(fieldNode));
  summaryType.textContent = template.title;
  updateQr();
}

function fieldNode(config) {
  const label = document.createElement("label");
  const labelText = document.createElement("span");
  label.className = `field ${config.wide ? "wide" : ""}`;
  labelText.textContent = config.label;
  label.append(labelText);

  if (config.multiline) {
    const textarea = document.createElement("textarea");
    textarea.id = config.id;
    textarea.value = config.value || "";
    textarea.addEventListener("input", updateQr);
    label.append(textarea);
    return label;
  }

  if (config.select) {
    const select = document.createElement("select");
    select.id = config.id;
    config.select.forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.append(option);
    });
    select.addEventListener("change", updateQr);
    label.append(select);
    return label;
  }

  const input = document.createElement("input");
  input.id = config.id;
  input.type = config.type || "text";
  input.value = config.value || "";
  input.addEventListener("input", updateQr);
  label.append(input);
  return label;
}

function readData() {
  return Object.fromEntries(
    [...fields.querySelectorAll("input, textarea, select")].map((input) => [input.id, input.value]),
  );
}

function qrOptions() {
  return {
    errorCorrectionLevel: controls.errorLevel.value,
    width: Number(controls.size.value),
    margin: Number(controls.margin.value),
    color: {
      dark: controls.foreground.value,
      light: controls.background.value,
    },
  };
}

async function updateQr() {
  const template = templates[activeType];
  const data = readData();
  const payload = template.build(data);
  currentPayload = payload;
  payloadCount.textContent = `${payload.length} character${payload.length === 1 ? "" : "s"}`;
  controls.sizeValue.textContent = `${controls.size.value} px`;
  controls.marginValue.textContent = `${controls.margin.value} module${controls.margin.value === "1" ? "" : "s"}`;
  controls.logoSizeValue.textContent = `${controls.logoSize.value}%`;
  summarySize.textContent = controls.size.value;
  summaryLevel.textContent = controls.errorLevel.value;
  summaryLogo.textContent = activeLogo ? logoLabel(activeLogo.label) : "Off";

  if (!payload) {
    previewPanel.classList.add("preview-empty");
    status.textContent = "Waiting";
    return;
  }

  if (!window.QRCode?.toCanvas) {
    previewPanel.classList.add("preview-empty");
    emptyPreview.textContent = "QR engine could not load.";
    status.textContent = "Unavailable";
    return;
  }

  try {
    await window.QRCode.toCanvas(canvas, payload, qrOptions());
    drawLogoOverlay();
    previewPanel.classList.remove("preview-empty");
    status.textContent = "Generated";
  } catch (error) {
    previewPanel.classList.add("preview-empty");
    emptyPreview.textContent = error.message;
    status.textContent = "Needs shorter content";
  }
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeName(extension) {
  const base = controls.fileName.value.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "qr-code";
  return `${base}.${extension}`;
}

async function svgMarkup() {
  const svg = await window.QRCode.toString(currentPayload, { ...qrOptions(), type: "svg" });
  return addLogoToSvg(svg);
}

async function copyPng() {
  if (!navigator.clipboard || !window.ClipboardItem) {
    status.textContent = "Copy not supported";
    return;
  }

  canvas.toBlob(async (blob) => {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    status.textContent = "Copied";
  }, "image/png");
}

function setLogo(src, label = "Custom") {
  const image = new Image();
  image.addEventListener("load", () => {
    activeLogo = { image, src, label };
    logoPreview.src = src;
    logoPreviewWrap.classList.remove("is-empty");
    summaryLogo.textContent = logoLabel(label);
    if (controls.errorLevel.value !== "H") controls.errorLevel.value = "H";
    updateQr();
  });
  image.addEventListener("error", () => {
    status.textContent = "Logo failed";
  });
  image.src = src;
}

function logoLabel(label) {
  return label === "Default" ? brand.logoShortName || "On" : "On";
}

function clearLogo() {
  activeLogo = null;
  logoPreview.removeAttribute("src");
  logoPreviewWrap.classList.add("is-empty");
  summaryLogo.textContent = "Off";
  updateQr();
}

function drawLogoOverlay() {
  if (!activeLogo || Number(controls.logoSize.value) <= 0) return;

  const ctx = canvas.getContext("2d");
  const canvasSize = canvas.width;
  const maxWidth = canvasSize * (Number(controls.logoSize.value) / 100);
  const maxHeight = maxWidth * 0.56;
  const imageRatio = activeLogo.image.width / activeLogo.image.height;
  let logoWidth = maxWidth;
  let logoHeight = logoWidth / imageRatio;

  if (logoHeight > maxHeight) {
    logoHeight = maxHeight;
    logoWidth = logoHeight * imageRatio;
  }

  const padding = Math.max(18, canvasSize * 0.018);
  const plateWidth = logoWidth + padding * 2;
  const plateHeight = logoHeight + padding * 2;
  const plateX = (canvasSize - plateWidth) / 2;
  const plateY = (canvasSize - plateHeight) / 2;
  const logoX = (canvasSize - logoWidth) / 2;
  const logoY = (canvasSize - logoHeight) / 2;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(17, 24, 39, 0.1)";
  ctx.lineWidth = Math.max(2, canvasSize * 0.003);
  roundedRect(ctx, plateX, plateY, plateWidth, plateHeight, canvasSize * 0.022);
  ctx.fill();
  ctx.stroke();
  ctx.drawImage(activeLogo.image, logoX, logoY, logoWidth, logoHeight);
  ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function addLogoToSvg(svg) {
  if (!activeLogo || Number(controls.logoSize.value) <= 0) return svg;
  const size = Number(controls.size.value);
  const maxWidth = size * (Number(controls.logoSize.value) / 100);
  const maxHeight = maxWidth * 0.56;
  const ratio = activeLogo.image.width / activeLogo.image.height;
  let logoWidth = maxWidth;
  let logoHeight = logoWidth / ratio;

  if (logoHeight > maxHeight) {
    logoHeight = maxHeight;
    logoWidth = logoHeight * ratio;
  }

  const padding = Math.max(18, size * 0.018);
  const plateWidth = logoWidth + padding * 2;
  const plateHeight = logoHeight + padding * 2;
  const plateX = (size - plateWidth) / 2;
  const plateY = (size - plateHeight) / 2;
  const logoX = (size - logoWidth) / 2;
  const logoY = (size - logoHeight) / 2;
  const href = activeLogo.src;
  const overlay = [
    `<rect x="${plateX}" y="${plateY}" width="${plateWidth}" height="${plateHeight}" rx="${size * 0.022}" fill="#ffffff" stroke="rgba(17,24,39,0.1)" stroke-width="${Math.max(2, size * 0.003)}"/>`,
    `<image href="${href}" x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMidYMid meet"/>`,
  ].join("");

  return svg.replace("</svg>", `${overlay}</svg>`);
}

function saveRecent() {
  if (!currentPayload) return;
  const data = readData();
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type: activeType,
    title: templates[activeType].label(data),
    payload: currentPayload,
    data,
    created: new Date().toLocaleString(),
  };
  const recents = [entry, ...loadRecents().filter((item) => item.payload !== currentPayload)].slice(0, 8);
  localStorage.setItem(storageKey, JSON.stringify(recents));
  renderRecents();
  status.textContent = "Saved";
}

function loadRecents() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function renderRecents() {
  const recents = loadRecents();
  if (!recents.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = "Saved QR codes will appear here.";
    recentList.replaceChildren(empty);
    return;
  }

  recentList.replaceChildren(
    ...recents.map((item) => {
      const row = document.createElement("div");
      const text = document.createElement("div");
      const title = document.createElement("div");
      const meta = document.createElement("div");
      const button = document.createElement("button");

      row.className = "recent-item";
      title.className = "recent-title";
      meta.className = "recent-meta";
      title.textContent = item.title;
      meta.textContent = `${templates[item.type]?.title || "QR"} - ${item.created}`;
      button.className = "secondary-button";
      button.type = "button";
      button.textContent = "Load";
      button.addEventListener("click", () => loadRecent(item));

      text.append(title, meta);
      row.append(text, button);
      return row;
    }),
  );
}

function loadRecent(item) {
  document.querySelector(`input[name="qr-type"][value="${item.type}"]`).checked = true;
  renderFields(item.type);
  const template = templates[item.type];
  template.fields.forEach((field) => {
    const input = fields.querySelector(`#${field.id}`);
    if (input && item.data?.[field.id] !== undefined) input.value = item.data[field.id];
  });
  updateQr();
}

document.querySelectorAll("input[name='qr-type']").forEach((input) => {
  input.addEventListener("change", () => renderFields(input.value));
});

Object.values(controls).forEach((control) => {
  control.addEventListener("input", updateQr);
  control.addEventListener("change", updateQr);
});

document.querySelector("#refresh-button").addEventListener("click", updateQr);
document.querySelector("#clear-button").addEventListener("click", () => {
  fields.querySelectorAll("input, textarea").forEach((input) => {
    input.value = "";
  });
  updateQr();
});
document.querySelector("#reset-design").addEventListener("click", () => {
  controls.foreground.value = "#111827";
  controls.background.value = "#ffffff";
  controls.errorLevel.value = activeLogo ? "H" : "Q";
  controls.size.value = "1024";
  controls.margin.value = "4";
  controls.logoSize.value = "18";
  updateQr();
});
document.querySelector("#download-png").addEventListener("click", () => {
  if (!currentPayload) return;
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = safeName("png");
  anchor.click();
});
document.querySelector("#download-svg").addEventListener("click", async () => {
  if (!currentPayload) return;
  download(safeName("svg"), await svgMarkup(), "image/svg+xml");
});
document.querySelector("#copy-png").addEventListener("click", copyPng);
document.querySelector("#print-button").addEventListener("click", () => window.print());
document.querySelector("#save-code").addEventListener("click", saveRecent);
document.querySelector("#use-default-logo").addEventListener("click", () => setLogo(defaultLogoPath, "Default"));
document.querySelector("#remove-logo").addEventListener("click", clearLogo);
document.querySelector("#logo-upload").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => setLogo(String(reader.result), "Custom"));
  reader.readAsDataURL(file);
});

window.addEventListener("load", () => {
  if (window.lucide) window.lucide.createIcons();
  applyBrand();
  setLogo(defaultLogoPath, "Default");
  renderFields("url");
  renderRecents();
});
