<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MP Technology QR | QR Code Generator</title>
    <meta
      name="description"
      content="Generate branded QR codes for links, contact cards, Wi-Fi access, email, phone, SMS, and plain text."
    >
    <link rel="stylesheet" href="styles.css">
    <script defer src="vendor/qrcode.min.js"></script>
    <script defer src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
    <script defer src="brand-config.js"></script>
    <script defer src="app.js"></script>
  </head>
  <body>
    <main class="app-shell">
      <section class="workspace" aria-labelledby="app-title">
        <header class="topbar">
          <a class="brand" href="#" aria-label="MP Technology QR home">
            <img class="brand-logo" id="brand-logo" src="assets/mp-technology-logo.png" alt="">
            <span id="brand-name">MP Technology QR</span>
          </a>
          <nav aria-label="Primary">
            <a href="#generator">Generator</a>
            <a href="#design">Design</a>
            <a href="#exports">Exports</a>
          </nav>
        </header>

        <section class="hero">
          <div>
            <p class="eyebrow">Client-side QR suite</p>
            <h1 id="app-title">QR codes your brand can hand out with confidence.</h1>
          </div>
          <div class="trust-strip" aria-label="Generator summary">
            <div>
              <span id="summary-type">URL</span>
              <small>Content</small>
            </div>
            <div>
              <span id="summary-size">1024</span>
              <small>Pixels</small>
            </div>
            <div>
              <span id="summary-level">Q</span>
              <small>Recovery</small>
            </div>
            <div>
              <span id="summary-logo">MP</span>
              <small>Logo</small>
            </div>
          </div>
        </section>

        <section class="generator-grid" id="generator">
          <section class="panel input-panel" aria-labelledby="content-title">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Content</p>
                <h2 id="content-title">QR destination</h2>
              </div>
              <button class="secondary-button" type="button" id="clear-button">
                <i data-lucide="eraser"></i>
                Clear
              </button>
            </div>

            <div class="type-grid" role="radiogroup" aria-label="QR content type">
              <label><input type="radio" name="qr-type" value="url" checked><span>URL</span></label>
              <label><input type="radio" name="qr-type" value="text"><span>Text</span></label>
              <label><input type="radio" name="qr-type" value="email"><span>Email</span></label>
              <label><input type="radio" name="qr-type" value="phone"><span>Phone</span></label>
              <label><input type="radio" name="qr-type" value="sms"><span>SMS</span></label>
              <label><input type="radio" name="qr-type" value="wifi"><span>Wi-Fi</span></label>
              <label><input type="radio" name="qr-type" value="vcard"><span>vCard</span></label>
            </div>

            <div class="dynamic-fields" id="dynamic-fields"></div>

            <div class="status-row">
              <span class="status" id="qr-status">Ready</span>
              <span id="payload-count">0 characters</span>
            </div>
          </section>

          <aside class="panel preview-panel" aria-label="QR preview">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Preview</p>
                <h2>Live code</h2>
              </div>
              <button class="icon-button" type="button" id="refresh-button" aria-label="Refresh QR" title="Refresh QR">
                <i data-lucide="refresh-cw"></i>
              </button>
            </div>
            <div class="qr-stage">
              <canvas id="qr-canvas" width="1024" height="1024" aria-label="Generated QR code"></canvas>
              <div class="empty-preview" id="empty-preview">Enter content to generate a QR code.</div>
            </div>
            <div class="export-actions" id="exports">
              <button class="primary-button" type="button" id="download-png">
                <i data-lucide="download"></i>
                PNG
              </button>
              <button class="secondary-button" type="button" id="download-svg">
                <i data-lucide="file-code-2"></i>
                SVG
              </button>
              <button class="secondary-button" type="button" id="copy-png">
                <i data-lucide="copy"></i>
                Copy
              </button>
              <button class="secondary-button" type="button" id="print-button">
                <i data-lucide="printer"></i>
                Print
              </button>
            </div>
          </aside>
        </section>

        <section class="tool-grid" id="design">
          <section class="panel" aria-labelledby="design-title">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Design</p>
                <h2 id="design-title">Code styling</h2>
              </div>
              <button class="secondary-button" type="button" id="reset-design">
                <i data-lucide="rotate-ccw"></i>
                Reset
              </button>
            </div>
            <div class="control-grid">
              <label class="field">
                <span>Foreground</span>
                <input id="foreground" type="color" value="#111827">
              </label>
              <label class="field">
                <span>Background</span>
                <input id="background" type="color" value="#ffffff">
              </label>
              <label class="field">
                <span>Error correction</span>
                <select id="error-level">
                  <option value="L">L - 7%</option>
                  <option value="M">M - 15%</option>
                  <option value="Q" selected>Q - 25%</option>
                  <option value="H">H - 30%</option>
                </select>
              </label>
              <label class="field">
                <span>File name</span>
                <input id="file-name" type="text" value="codeforge-qr">
              </label>
              <label class="field wide">
                <span>Size <strong id="size-value">1024 px</strong></span>
                <input id="size" type="range" min="256" max="2048" step="128" value="1024">
              </label>
              <label class="field wide">
                <span>Quiet zone <strong id="margin-value">4 modules</strong></span>
                <input id="margin" type="range" min="0" max="8" step="1" value="4">
              </label>
              <div class="brand-control wide">
                <div class="logo-preview">
                  <img id="logo-preview" src="assets/mp-technology-logo.png" alt="">
                </div>
                <div class="logo-actions">
                  <label class="secondary-button file-button" for="logo-upload">
                    <i data-lucide="image-up"></i>
                    Upload logo
                  </label>
                  <input id="logo-upload" class="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml">
                  <button class="secondary-button" type="button" id="use-default-logo">
                    <i data-lucide="badge-check"></i>
                    Default logo
                  </button>
                  <button class="secondary-button" type="button" id="remove-logo">
                    <i data-lucide="x"></i>
                    Remove
                  </button>
                </div>
              </div>
              <label class="field wide">
                <span>Logo size <strong id="logo-size-value">18%</strong></span>
                <input id="logo-size" type="range" min="0" max="28" step="1" value="18">
              </label>
            </div>
          </section>

          <section class="panel" aria-labelledby="recent-title">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Recent</p>
                <h2 id="recent-title">Saved codes</h2>
              </div>
              <button class="secondary-button" type="button" id="save-code">
                <i data-lucide="save"></i>
                Save
              </button>
            </div>
            <div class="recent-list" id="recent-list"></div>
          </section>
        </section>
      </section>
    </main>
  </body>
</html>
