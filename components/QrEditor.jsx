"use client";

import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { makeShortCode, normalizeUrl, sanitizeQrAlias } from "../lib/qr";

const templates = [
  { id: "url", label: "URL", hint: "Website, landing page, booking link" },
  { id: "text", label: "Text", hint: "Plain message or instructions" },
  { id: "email", label: "Email", hint: "Open a new email draft" },
  { id: "phone", label: "Phone", hint: "Call a business number" },
  { id: "sms", label: "SMS", hint: "Start a text message" },
  { id: "support", label: "Support", hint: "Open a customer request form" },
];

const DEFAULT_PUBLIC_SITE_URL = "https://app.scanops.io";

function getPublicSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL;
  return configuredUrl.replace(/\/$/, "");
}

export default function QrEditor({ supabase, user, profile, accountId, usage, onSaved }) {
  const canvasRef = useRef(null);
  const [type, setType] = useState("url");
  const [name, setName] = useState("Homepage QR");
  const [url, setUrl] = useState(profile?.sample_url || "https://scanops.io");
  const [customAlias, setCustomAlias] = useState("");
  const [textValue, setTextValue] = useState("Scan me from this QR code.");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsNumber, setSmsNumber] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [supportTopic, setSupportTopic] = useState("Customer support request");
  const [mode, setMode] = useState("dynamic");
  const [qrStatus, setQrStatus] = useState("active");
  const [expiresAt, setExpiresAt] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");
  const [foreground, setForeground] = useState(profile?.foreground || "#111827");
  const [eyeColor, setEyeColor] = useState(profile?.foreground || "#111827");
  const [background, setBackground] = useState(profile?.background || "#ffffff");
  const [logoSize, setLogoSize] = useState(18);
  const [dotStyle, setDotStyle] = useState("square");
  const [frameStyle, setFrameStyle] = useState("none");
  const [frameText, setFrameText] = useState("Scan me");
  const [savedDynamicUrl, setSavedDynamicUrl] = useState("");
  const contrastScore = getContrastRatio(foreground, background);
  const isLowContrast = contrastScore < 4.5;

  const directPayload = useMemo(() => {
    if (type === "url") return normalizeUrl(url);
    if (type === "email") {
      const params = new URLSearchParams();
      if (emailSubject.trim()) params.set("subject", emailSubject.trim());
      if (emailBody.trim()) params.set("body", emailBody.trim());
      const query = params.toString();
      return `mailto:${emailAddress.trim()}${query ? `?${query}` : ""}`;
    }
    if (type === "phone") return `tel:${phoneNumber.replace(/[^\d+]/g, "")}`;
    if (type === "sms") {
      const cleanedNumber = smsNumber.replace(/[^\d+]/g, "");
      return `sms:${cleanedNumber}${smsMessage.trim() ? `?&body=${encodeURIComponent(smsMessage.trim())}` : ""}`;
    }
    if (type === "support") return supportTopic.trim();
    return textValue.trim();
  }, [emailAddress, emailBody, emailSubject, phoneNumber, smsMessage, smsNumber, supportTopic, textValue, type, url]);

  const previewPayload = useMemo(() => {
    if ((mode === "dynamic" || type === "support") && savedDynamicUrl) return savedDynamicUrl;
    if ((mode === "dynamic" || type === "support") && typeof window !== "undefined") return `${getPublicSiteUrl()}/?qr=preview`;
    return directPayload;
  }, [directPayload, mode, savedDynamicUrl, type]);

  useEffect(() => {
    setSavedDynamicUrl("");
  }, [directPayload, mode, name, type]);

  useEffect(() => {
    async function render() {
      if (!canvasRef.current || !previewPayload) return;
      await drawStyledQr(canvasRef.current, previewPayload, {
        foreground,
        background,
        eyeColor,
        logoUrl: profile?.logo_url || "",
        logoSize,
        dotStyle,
        frameStyle,
        frameText,
      });
    }
    render();
  }, [background, dotStyle, eyeColor, foreground, frameStyle, frameText, logoSize, previewPayload, profile?.logo_url]);

  async function saveQr() {
    if (!name.trim()) {
      setMessage("Name is required");
      return;
    }
    if (!directPayload.trim() || directPayload === "mailto:" || directPayload === "tel:" || directPayload === "sms:") {
      setMessage("Complete the required QR details first.");
      return;
    }
    if (type === "url" && /\/r\/[a-z0-9]/i.test(url)) {
      setMessage("Use the final website URL. The app creates tracking links automatically.");
      return;
    }
    if (mode === "dynamic" && usage && usage.dynamicCount >= usage.dynamicLimit) {
      setMessage(`Plan limit reached: ${usage.dynamicLimit} dynamic QR codes. Upgrade to save more.`);
      return;
    }

    const isTrackedMode = mode === "dynamic" || type === "support";
    const sanitizedAlias = sanitizeQrAlias(customAlias);
    if (customAlias.trim() && sanitizedAlias !== customAlias.trim()) {
      setMessage("Alias can only use letters, numbers, dots, dashes, and underscores.");
      return;
    }
    if (sanitizedAlias && sanitizedAlias.length < 4) {
      setMessage("Custom aliases must be at least 4 characters.");
      return;
    }
    const shortCode = isTrackedMode ? sanitizedAlias || makeShortCode() : null;
    if (shortCode) {
      const { data: existingCode } = await supabase
        .from("qr_codes")
        .select("id")
        .eq("short_code", shortCode)
        .maybeSingle();
      if (existingCode) {
        setMessage("That custom alias is already taken. Try another.");
        return;
      }
    }
    const dynamicUrl = `${getPublicSiteUrl()}/?qr=${shortCode}`;
    const finalDestination = type === "support" ? `${getPublicSiteUrl()}/support/${shortCode}` : directPayload;
    const qrPayload = isTrackedMode ? dynamicUrl : directPayload;
    setMessage("Saving...");

    const { error } = await supabase.from("qr_codes").insert({
      user_id: user.id,
      account_id: accountId || profile?.account_id || null,
      name: name.trim(),
      type,
      destination_url: finalDestination,
      payload: qrPayload,
      short_code: shortCode,
      is_dynamic: isTrackedMode,
      status: qrStatus,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      foreground,
      background,
      logo_url: profile?.logo_url || null,
      style_config: {
        dotStyle,
        eyeColor,
        frameStyle,
        frameText,
        logoSize,
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }
    if (isTrackedMode) {
      setSavedDynamicUrl(dynamicUrl);
    }
    setMessage(isTrackedMode ? `Saved: ${shortCode}` : "Saved");
    onSaved();
  }

  function downloadPng() {
    const anchor = document.createElement("a");
    anchor.href = canvasRef.current.toDataURL("image/png");
    anchor.download = `${name.trim().replace(/[^a-z0-9-_]+/gi, "-") || "qr-code"}.png`;
    anchor.click();
  }

  async function downloadSvg() {
    const svg = await QRCode.toString(previewPayload, {
      type: "svg",
      errorCorrectionLevel: "H",
      color: { dark: foreground, light: background },
      margin: 4,
    });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${name.trim().replace(/[^a-z0-9-_]+/gi, "-") || "qr-code"}.svg`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  function downloadPdf() {
    const imageUrl = canvasRef.current.toDataURL("image/png");
    const popup = window.open("", "_blank", "width=900,height=1100");
    if (!popup) {
      setMessage("Allow popups to export a PDF.");
      return;
    }
    popup.document.write(`<!doctype html><title>${escapeHtml(name)}</title><style>body{font-family:Arial,sans-serif;margin:40px;text-align:center}img{width:78%;max-width:720px}p{color:#475467}</style><h1>${escapeHtml(name)}</h1><img src="${imageUrl}" alt="QR code"/><p>${escapeHtml(previewPayload)}</p><script>window.onload=()=>window.print();</script>`);
    popup.document.close();
  }

  return (
    <section className="studio-grid">
      <div className="panel editor-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Generator</p>
            <h2>Create QR campaign</h2>
          </div>
          <span className="status">{message || "Draft"}</span>
        </div>

        <div className="template-grid">
          {templates.map((item) => (
            <label className="template-card" key={item.id}>
              <input checked={type === item.id} name="type" onChange={() => setType(item.id)} type="radio" />
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </label>
          ))}
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Campaign name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          {(mode === "dynamic" || type === "support") && (
            <label className="field">
              <span>Optional custom alias</span>
              <input
                value={customAlias}
                onChange={(event) => setCustomAlias(sanitizeQrAlias(event.target.value))}
                placeholder="AssetA7 or Warehouse-02"
              />
            </label>
          )}
          <label className="field">
            <span>{getPrimaryFieldLabel(type)}</span>
            {type === "url" && (
              <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" />
            )}
            {type === "text" && (
              <textarea value={textValue} onChange={(event) => setTextValue(event.target.value)} placeholder="Plain text shown when scanned" />
            )}
            {type === "email" && (
              <input value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} type="email" placeholder="customer@example.com" />
            )}
            {type === "phone" && (
              <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} type="tel" placeholder="+1 555 555 5555" />
            )}
            {type === "sms" && (
              <input value={smsNumber} onChange={(event) => setSmsNumber(event.target.value)} type="tel" placeholder="+1 555 555 5555" />
            )}
            {type === "support" && (
              <input value={supportTopic} onChange={(event) => setSupportTopic(event.target.value)} placeholder="Customer support request" />
            )}
          </label>
          {type === "email" && (
            <div className="two-col">
              <label className="field">
                <span>Email subject</span>
                <input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} placeholder="Question about..." />
              </label>
              <label className="field">
                <span>Email body</span>
                <input value={emailBody} onChange={(event) => setEmailBody(event.target.value)} placeholder="Hello, I would like..." />
              </label>
            </div>
          )}
          {type === "sms" && (
            <label className="field">
              <span>SMS message</span>
              <textarea value={smsMessage} onChange={(event) => setSmsMessage(event.target.value)} placeholder="Message to start the text" />
            </label>
          )}
          <div className="two-col">
            <label className="field">
              <span>Code mode</span>
              <select value={mode} onChange={(event) => setMode(event.target.value)}>
                <option value="dynamic">Dynamic tracked link</option>
                <option value="static">Static direct QR</option>
              </select>
            </label>
            <label className="field">
              <span>Activation</span>
              <select value={qrStatus} onChange={(event) => setQrStatus(event.target.value)}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </label>
          </div>
          <div className="two-col">
            <label className="field">
              <span>Tags or categories</span>
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Warehouse, Support, Asset" />
            </label>
            <label className="field">
              <span>Expiration date</span>
              <input value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} type="datetime-local" />
            </label>
          </div>
          <label className="field">
            <span>Logo size {logoSize}%</span>
            <input value={logoSize} onChange={(event) => setLogoSize(Number(event.target.value))} type="range" min="0" max="22" />
          </label>
          <div className="two-col">
            <label className="field">
              <span>QR pattern</span>
              <select value={dotStyle} onChange={(event) => setDotStyle(event.target.value)}>
                <option value="square">Classic square</option>
                <option value="rounded">Rounded blocks</option>
                <option value="dots">Dot pattern</option>
              </select>
            </label>
            <label className="field">
              <span>Frame</span>
              <select value={frameStyle} onChange={(event) => setFrameStyle(event.target.value)}>
                <option value="none">No frame</option>
                <option value="simple">Simple frame</option>
                <option value="cta">CTA frame</option>
              </select>
            </label>
          </div>
          {frameStyle !== "none" && (
            <label className="field">
              <span>Frame text</span>
              <input value={frameText} onChange={(event) => setFrameText(event.target.value)} maxLength={28} />
            </label>
          )}
          <div className="two-col">
            <label className="field color-field">
              <span>Foreground</span>
              <input value={foreground} onChange={(event) => setForeground(event.target.value)} type="color" />
            </label>
            <label className="field color-field">
              <span>Eye color</span>
              <input value={eyeColor} onChange={(event) => setEyeColor(event.target.value)} type="color" />
            </label>
          </div>
          <div className="two-col">
            <label className="field color-field">
              <span>Background</span>
              <input value={background} onChange={(event) => setBackground(event.target.value)} type="color" />
            </label>
            <div className={`scan-check ${isLowContrast ? "warning" : ""}`}>
              <strong>{isLowContrast ? "Contrast warning" : "Scannability check"}</strong>
              <span>{isLowContrast ? "Use a darker foreground or lighter background before printing." : "Good contrast for most phone cameras."}</span>
            </div>
          </div>
        </div>

        <div className="export-actions">
          <button className="primary-button" type="button" onClick={saveQr}>Save campaign</button>
          <button className="secondary-button" type="button" onClick={downloadPng}>Download PNG</button>
          <button className="secondary-button" type="button" onClick={downloadSvg}>Download SVG</button>
          <button className="secondary-button" type="button" onClick={downloadPdf}>Download PDF</button>
        </div>
        {usage && (
          <p className="form-message">
            Usage: {usage.dynamicCount}/{usage.dynamicLimit} dynamic QR codes and {usage.monthlyScans}/{usage.scanLimit} saved scan records this month.
          </p>
        )}
      </div>

      <aside className="panel preview-panel modern-preview">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>{mode === "dynamic" || type === "support" ? "Tracked QR" : "Static QR"}</h2>
          </div>
          <span className="status">H recovery</span>
        </div>
        <div className="qr-stage elevated">
          <canvas ref={canvasRef} id="qr-canvas" width="1024" height="1024" />
        </div>
        <div className="preview-foot">
          <div>
            <span>Payload</span>
            <strong>{mode === "dynamic" || type === "support" ? (savedDynamicUrl ? savedDynamicUrl : "Save to create tracking link") : "Direct destination"}</strong>
          </div>
          <div>
            <span>Export</span>
            <strong>1024 PNG</strong>
          </div>
        </div>
      </aside>
    </section>
  );
}

function getPrimaryFieldLabel(type) {
  if (type === "url") return "Website URL";
  if (type === "text") return "Text message";
  if (type === "email") return "Email address";
  if (type === "phone") return "Phone number";
  if (type === "sms") return "SMS phone number";
  if (type === "support") return "Request form title";
  return "Destination";
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

async function drawStyledQr(canvas, payload, options) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const frameOn = options.frameStyle !== "none";
  const qr = QRCode.create(payload, { errorCorrectionLevel: "H" });
  const moduleCount = qr.modules.size;
  const quietModules = 4;
  const totalModules = moduleCount + quietModules * 2;
  const qrArea = frameOn ? 760 : 900;
  const cell = qrArea / totalModules;
  const qrDrawSize = cell * moduleCount;
  const qrX = (size - qrDrawSize) / 2;
  const qrY = frameOn ? 116 : (size - qrDrawSize) / 2;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = options.background;
  ctx.fillRect(0, 0, size, size);

  if (frameOn) {
    drawFrame(ctx, size, options);
  }

  ctx.fillStyle = options.background;
  roundedRect(ctx, qrX - cell * quietModules, qrY - cell * quietModules, qrArea, qrArea, 28);
  ctx.fill();

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!qr.modules.get(row, col)) continue;
      const x = qrX + col * cell;
      const y = qrY + row * cell;
      const isEye = isFinderModule(row, col, moduleCount);
      ctx.fillStyle = isEye ? options.eyeColor : options.foreground;
      drawModule(ctx, x, y, cell, options.dotStyle, isEye);
    }
  }

  await drawLogo(ctx, canvas, options);
}

function drawFrame(ctx, size, options) {
  const framePad = 44;
  roundedRect(ctx, framePad, framePad, size - framePad * 2, size - framePad * 2, 42);
  ctx.lineWidth = 18;
  ctx.strokeStyle = options.eyeColor;
  ctx.stroke();
  if (options.frameStyle === "cta") {
    const text = (options.frameText || "Scan me").slice(0, 28);
    ctx.fillStyle = options.eyeColor;
    roundedRect(ctx, 286, 858, 452, 92, 46);
    ctx.fill();
    ctx.fillStyle = options.background;
    ctx.font = "900 44px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, 904, 390);
  }
}

function drawModule(ctx, x, y, cell, style, isEye) {
  const gap = isEye ? cell * 0.08 : cell * 0.14;
  const drawX = x + gap / 2;
  const drawY = y + gap / 2;
  const drawSize = cell - gap;
  if (style === "dots" && !isEye) {
    ctx.beginPath();
    ctx.arc(x + cell / 2, y + cell / 2, drawSize / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (style === "rounded" || isEye) {
    roundedRect(ctx, drawX, drawY, drawSize, drawSize, drawSize * 0.3);
    ctx.fill();
    return;
  }
  ctx.fillRect(drawX, drawY, drawSize, drawSize);
}

async function drawLogo(ctx, canvas, options) {
  if (options.logoSize <= 0 || !options.logoUrl) return;
  const image = await loadImage(options.logoUrl);
  const size = canvas.width * (options.logoSize / 100);
  const height = size * 0.56;
  const x = (canvas.width - size) / 2;
  const y = (canvas.height - height) / 2;
  const pad = canvas.width * 0.022;
  roundedRect(ctx, x - pad, y - pad, size + pad * 2, height + pad * 2, 24);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.drawImage(image, x, y, size, height);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function isFinderModule(row, col, size) {
  const inTop = row < 7;
  const inLeft = col < 7;
  const inRight = col >= size - 7;
  const inBottom = row >= size - 7;
  return (inTop && inLeft) || (inTop && inRight) || (inBottom && inLeft);
}

function getContrastRatio(hexA, hexB) {
  const lumA = getLuminance(hexA);
  const lumB = getLuminance(hexB);
  const light = Math.max(lumA, lumB);
  const dark = Math.min(lumA, lumB);
  return (light + 0.05) / (dark + 0.05);
}

function getLuminance(hex) {
  const rgb = hex.replace("#", "").match(/.{1,2}/g).map((value) => parseInt(value, 16) / 255);
  const [r, g, b] = rgb.map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
