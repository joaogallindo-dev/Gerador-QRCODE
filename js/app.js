/* ============================================================
   QR CODE STUDIO — app.js
   Estrutura:
     1. Config loader (data/config.json, com fallback embutido)
     2. Estado da aplicação
     3. Construção dinâmica dos formulários por tipo
     4. Builders de conteúdo (url, texto, wifi, vcard, email, tel, whatsapp)
     5. Geração do QR Code (qrcode-generator) + logo central
     6. Exportação (PNG / SVG / copiar imagem / copiar texto)
     7. Tema claro/escuro + utilidades de UI (toast)
   ============================================================ */

(() => {
  "use strict";

  /* ------------------------------------------------------------
     1. CONFIG
     ------------------------------------------------------------ */
  const FALLBACK_CONFIG = {
    errorCorrectionLevels: [
      { value: "L", label: "Baixa (7%)" },
      { value: "M", label: "Média (15%)" },
      { value: "Q", label: "Alta (25%)" },
      { value: "H", label: "Máxima (30%)" }
    ],
    colorPresets: [
      { name: "Clássico", fg: "#0B0B12", bg: "#FFFFFF" },
      { name: "Esmeralda", fg: "#0B3B2E", bg: "#EAFBF3" },
      { name: "Âmbar", fg: "#2E1B04", bg: "#FFF4DC" },
      { name: "Violeta", fg: "#1F1147", bg: "#F1ECFF" },
      { name: "Rosa", fg: "#3A0B22", bg: "#FFEAF3" },
      { name: "Noturno", fg: "#EDEFF7", bg: "#12141C" }
    ],
    qrTypes: [
      { id: "url", label: "Link", icon: "link", build: "url",
        fields: [{ id: "url", label: "Endereço do site", type: "url", placeholder: "https://exemplo.com.br", required: true }] },
      { id: "text", label: "Texto", icon: "text", build: "text",
        fields: [{ id: "text", label: "Texto livre", type: "textarea", placeholder: "Digite qualquer texto", required: true }] },
      { id: "wifi", label: "Wi-Fi", icon: "wifi", build: "wifi",
        fields: [
          { id: "ssid", label: "Nome da rede (SSID)", type: "text", placeholder: "MinhaRedeWiFi", required: true },
          { id: "password", label: "Senha", type: "text", placeholder: "Deixe em branco se for aberta", required: false },
          { id: "encryption", label: "Segurança", type: "select", options: ["WPA", "WEP", "nopass"], required: true }
        ] },
      { id: "contact", label: "Contato", icon: "contact", build: "vcard",
        fields: [
          { id: "name", label: "Nome completo", type: "text", placeholder: "Maria Silva", required: true },
          { id: "phone", label: "Telefone", type: "tel", placeholder: "+55 11 91234-5678", required: false },
          { id: "email", label: "E-mail", type: "email", placeholder: "maria@email.com", required: false }
        ] },
      { id: "email", label: "E-mail", icon: "email", build: "email",
        fields: [
          { id: "to", label: "Destinatário", type: "email", placeholder: "contato@email.com", required: true },
          { id: "subject", label: "Assunto", type: "text", placeholder: "Opcional", required: false },
          { id: "body", label: "Mensagem", type: "textarea", placeholder: "Opcional", required: false }
        ] },
      { id: "phone", label: "Telefone", icon: "phone", build: "phone",
        fields: [{ id: "phone", label: "Número com DDI e DDD", type: "tel", placeholder: "+55 11 91234-5678", required: true }] },
      { id: "whatsapp", label: "WhatsApp", icon: "whatsapp", build: "whatsapp",
        fields: [
          { id: "phone", label: "Número com DDI e DDD", type: "tel", placeholder: "+55 11 91234-5678", required: true },
          { id: "message", label: "Mensagem inicial", type: "textarea", placeholder: "Opcional", required: false }
        ] }
    ]
  };

  const ICONS = {
    link: '<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 15l6-6M10 6l1-1a4 4 0 015.7 5.7l-2 2M14 18l-1 1a4 4 0 01-5.7-5.7l2-2"/></svg>',
    text: '<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    wifi: '<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8.5a16 16 0 0120 0M5.5 12a11 11 0 0113 0M9 15.5a6 6 0 016 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></svg>',
    contact: '<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4"/></svg>',
    email: '<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/></svg>',
    phone: '<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h3l1.5 4.5-2 1.5a13 13 0 006 6l1.5-2L20.5 15v3a2 2 0 01-2.2 2A17 17 0 014 5.2 2 2 0 016 3z"/></svg>',
    whatsapp: '<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20l1.4-4.1A8 8 0 1112 20a8 8 0 01-4.6-1.4L4 20z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5"/></svg>'
  };

  /* ------------------------------------------------------------
     2. ESTADO
     ------------------------------------------------------------ */
  const state = {
    config: null,
    activeType: null,
    fgColor: "#0B0B12",
    bgColor: "#FFFFFF",
    size: 280,
    ecLevel: "M",
    logoDataUrl: null,
    lastPayload: null,   // { text, meta } usado para validar a geração
    lastQr: null         // instância qrcode-generator
  };

  const PREFS_KEY = "qrStudio.prefs";

  /* ------------------------------------------------------------
     Referências de DOM
     ------------------------------------------------------------ */
  const el = {
    tabs: document.getElementById("type-tabs"),
    fieldsContainer: document.getElementById("fields-container"),
    form: document.getElementById("qr-form"),
    ecLevel: document.getElementById("ec-level"),
    size: document.getElementById("qr-size"),
    sizeValue: document.getElementById("qr-size-value"),
    presets: document.getElementById("color-presets"),
    fgColor: document.getElementById("fg-color"),
    bgColor: document.getElementById("bg-color"),
    logoToggle: document.getElementById("add-logo-toggle"),
    logoInput: document.getElementById("logo-input"),
    logoPickBtn: document.getElementById("logo-pick-btn"),
    logoFilename: document.getElementById("logo-filename"),
    generateBtn: document.getElementById("generate-btn"),
    clearBtn: document.getElementById("clear-btn"),
    qrFrame: document.getElementById("qr-frame"),
    qrPlaceholder: document.getElementById("qr-placeholder"),
    qrWrap: document.getElementById("qrcode"),
    resultActions: document.getElementById("result-actions"),
    downloadPng: document.getElementById("download-png-btn"),
    downloadSvg: document.getElementById("download-svg-btn"),
    copyImg: document.getElementById("copy-img-btn"),
    themeToggle: document.getElementById("theme-toggle"),
    toast: document.getElementById("toast")
  };

  /* ------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------ */
  let toastTimer = null;
  function showToast(message, isError = false) {
    el.toast.textContent = message;
    el.toast.classList.toggle("toast-error", isError);
    el.toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("visible"), 2600);
  }

  function debounce(fn, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  function escapeVCard(str) {
    return String(str || "").replace(/([,;\\])/g, "\\$1");
  }

  /* ------------------------------------------------------------
     3. CARREGAR CONFIG E MONTAR UI
     ------------------------------------------------------------ */
  async function loadConfig() {
    try {
      const res = await fetch("data/config.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      state.config = json;
    } catch (err) {
      // Ambiente sem servidor (file://) ou config indisponível: usa fallback embutido.
      state.config = FALLBACK_CONFIG;
    }
  }

  function buildTabs() {
    el.tabs.innerHTML = "";
    state.config.qrTypes.forEach((type, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "type-tab";
      btn.setAttribute("role", "tab");
      btn.dataset.typeId = type.id;
      btn.setAttribute("aria-controls", "fields-container");
      btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
      btn.innerHTML = `${ICONS[type.icon] || ""}<span>${type.label}</span>`;
      btn.addEventListener("click", () => selectType(type.id));
      el.tabs.appendChild(btn);
    });
  }

  function buildEcOptions() {
    el.ecLevel.innerHTML = "";
    state.config.errorCorrectionLevels.forEach((lvl) => {
      const opt = document.createElement("option");
      opt.value = lvl.value;
      opt.textContent = lvl.label;
      if (lvl.value === state.ecLevel) opt.selected = true;
      el.ecLevel.appendChild(opt);
    });
  }

  function buildPresets() {
    el.presets.innerHTML = "";
    state.config.colorPresets.forEach((preset) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset-swatch";
      btn.title = preset.name;
      btn.setAttribute("aria-label", `Usar cores: ${preset.name}`);
      btn.style.background = `linear-gradient(135deg, ${preset.fg} 50%, ${preset.bg} 50%)`;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => {
        state.fgColor = preset.fg;
        state.bgColor = preset.bg;
        el.fgColor.value = preset.fg;
        el.bgColor.value = preset.bg;
        [...el.presets.children].forEach((c) => c.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");
        renderIfReady();
      });
      el.presets.appendChild(btn);
    });
  }

  function selectType(typeId) {
    state.activeType = state.config.qrTypes.find((t) => t.id === typeId);
    [...el.tabs.children].forEach((tab) => {
      tab.setAttribute("aria-selected", tab.dataset.typeId === typeId ? "true" : "false");
    });
    buildFields(state.activeType);
    hideResult();
  }

  function buildFields(type) {
    el.fieldsContainer.innerHTML = "";
    el.fieldsContainer.classList.remove("fields-container");
    void el.fieldsContainer.offsetWidth; // reflow para reiniciar animação
    el.fieldsContainer.classList.add("fields-container");

    type.fields.forEach((field) => {
      const wrap = document.createElement("div");
      wrap.className = "field";

      const label = document.createElement("label");
      label.setAttribute("for", `f-${field.id}`);
      label.textContent = field.label;
      wrap.appendChild(label);

      let input;
      if (field.type === "textarea") {
        input = document.createElement("textarea");
      } else if (field.type === "select") {
        input = document.createElement("select");
        field.options.forEach((optVal) => {
          const opt = document.createElement("option");
          opt.value = optVal;
          opt.textContent = optVal === "nopass" ? "Rede aberta (sem senha)" : optVal;
          input.appendChild(opt);
        });
      } else {
        input = document.createElement("input");
        input.type = field.type;
      }
      input.id = `f-${field.id}`;
      input.name = field.id;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.required) input.required = true;
      input.autocomplete = "off";
      input.addEventListener("input", debounce(renderIfReady, 350));
      input.addEventListener("change", renderIfReady);

      wrap.appendChild(input);
      el.fieldsContainer.appendChild(wrap);
    });
  }

  /* ------------------------------------------------------------
     4. BUILDERS DE CONTEÚDO
     ------------------------------------------------------------ */
  function getFieldValues(type) {
    const values = {};
    type.fields.forEach((f) => {
      const node = document.getElementById(`f-${f.id}`);
      values[f.id] = node ? node.value.trim() : "";
    });
    return values;
  }

  function isFormValid(type, values) {
    return type.fields.every((field) => {
      if (field.required && !values[field.id]) return false;
      if (!values[field.id]) return true;
      if (field.type === "email") return document.getElementById(`f-${field.id}`).checkValidity();
      if (field.type === "url") {
        try { return Boolean(new URL(/^https?:\/\//i.test(values[field.id]) ? values[field.id] : `https://${values[field.id]}`).hostname); }
        catch { return false; }
      }
      return true;
    });
  }

  const BUILDERS = {
    url(v) {
      let url = v.url;
      if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
      return { text: url, meta: "Link", display: url };
    },
    text(v) {
      return { text: v.text, meta: "Texto", display: v.text };
    },
    wifi(v) {
      const enc = v.encryption === "nopass" ? "nopass" : v.encryption;
      const escapeWifi = (value) => String(value || "").replace(/([\\;,:])/g, "\\$1");
      const pass = enc === "nopass" ? "" : `P:${escapeWifi(v.password)};`;
      const text = `WIFI:T:${enc};S:${escapeWifi(v.ssid)};${pass};`;
      return { text, meta: "Wi-Fi", display: `Rede: ${v.ssid}` };
    },
    vcard(v) {
      const text = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${escapeVCard(v.name)}`,
        v.phone ? `TEL;TYPE=CELL:${escapeVCard(v.phone)}` : "",
        v.email ? `EMAIL:${escapeVCard(v.email)}` : "",
        "END:VCARD"
      ].filter(Boolean).join("\n");
      return { text, meta: "Contato", display: v.name };
    },
    email(v) {
      const params = new URLSearchParams();
      if (v.subject) params.set("subject", v.subject);
      if (v.body) params.set("body", v.body);
      const qs = params.toString();
      const text = `mailto:${v.to}${qs ? "?" + qs : ""}`;
      return { text, meta: "E-mail", display: v.to };
    },
    phone(v) {
      return { text: `tel:${v.phone.replace(/\s+/g, "")}`, meta: "Telefone", display: v.phone };
    },
    whatsapp(v) {
      const digits = v.phone.replace(/\D/g, "");
      const params = v.message ? `?text=${encodeURIComponent(v.message)}` : "";
      return { text: `https://wa.me/${digits}${params}`, meta: "WhatsApp", display: v.phone };
    }
  };

  /* ------------------------------------------------------------
     5. GERAÇÃO DO QR CODE
     ------------------------------------------------------------ */
  function renderIfReady() {
    if (!state.activeType) return;
    const values = getFieldValues(state.activeType);
    if (!isFormValid(state.activeType, values)) { hideResult(); return; }
    const payload = BUILDERS[state.activeType.build](values);
    if (!payload.text) { hideResult(); return; }
    generate(payload);
  }

  function generate(payload) {
    try {
      const qr = qrcode(0, state.ecLevel);
      qr.addData(payload.text);
      qr.make();
      state.lastQr = qr;
      state.lastPayload = payload;

      const cellSize = Math.max(4, Math.floor(state.size / qr.getModuleCount()));
      const canvas = renderToCanvas(qr, cellSize, state.fgColor, state.bgColor);

      const finish = () => {
        showResult(canvas);
      };
      if (state.logoDataUrl && el.logoToggle.checked) {
        drawLogoOnCanvas(canvas, state.logoDataUrl, finish);
      } else {
        finish();
      }
    } catch (err) {
      showToast("Não foi possível gerar o QR Code. Verifique o conteúdo.", true);
    }
  }

  function renderToCanvas(qr, cellSize, fg, bg) {
    const count = qr.getModuleCount();
    const size = count * cellSize;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = fg;
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
    return canvas;
  }

  function drawLogoOnCanvas(canvas, dataUrl, done) {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      const logoSize = canvas.width * 0.22;
      const x = (canvas.width - logoSize) / 2;
      const y = (canvas.height - logoSize) / 2;
      const pad = logoSize * 0.12;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      const r = 10;
      const rx = x - pad, ry = y - pad, rw = logoSize + pad * 2, rh = logoSize + pad * 2;
      ctx.moveTo(rx + r, ry);
      ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
      ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
      ctx.arcTo(rx, ry + rh, rx, ry, r);
      ctx.arcTo(rx, ry, rx + rw, ry, r);
      ctx.closePath();
      ctx.fill();
      ctx.drawImage(img, x, y, logoSize, logoSize);
      done();
    };
    img.onerror = done;
    img.src = dataUrl;
  }

  function showResult(canvas) {
    el.qrWrap.innerHTML = "";
    el.qrWrap.appendChild(canvas);
    el.qrWrap.classList.add("visible");
    el.qrPlaceholder.style.display = "none";
    el.qrFrame.classList.add("has-code");
    el.resultActions.hidden = false;
  }

  function hideResult() {
    el.qrWrap.classList.remove("visible");
    el.qrWrap.innerHTML = "";
    el.qrPlaceholder.style.display = "flex";
    el.qrFrame.classList.remove("has-code");
    el.resultActions.hidden = true;
    state.lastPayload = null;
  }

  /* ------------------------------------------------------------
     6. EXPORTAÇÃO
     ------------------------------------------------------------ */
  function currentCanvas() {
    return el.qrWrap.querySelector("canvas");
  }

  function triggerDownload(href, filename) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function downloadPng() {
    const canvas = currentCanvas();
    if (!canvas) return;
    triggerDownload(canvas.toDataURL("image/png"), `qrcode-${state.activeType.id}.png`);
    showToast("PNG baixado.");
  }

  function downloadSvg() {
    if (!state.lastQr) return;
    const qr = state.lastQr;
    const count = qr.getModuleCount();
    const cell = Math.max(4, Math.floor(state.size / count));
    const size = count * cell;
    let modules = "";
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) {
          modules += `<rect x="${col * cell}" y="${row * cell}" width="${cell}" height="${cell}"/>`;
        }
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" fill="${state.bgColor}"/>` +
      `<g fill="${state.fgColor}">${modules}</g></svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `qrcode-${state.activeType.id}.svg`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("SVG baixado.");
  }

  async function copyImage() {
    const canvas = currentCanvas();
    if (!canvas) return;
    try {
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error("unsupported");
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
      showToast("Imagem copiada para a área de transferência.");
    } catch (err) {
      showToast("Seu navegador não permite copiar imagens. Baixe o PNG.", true);
    }
  }

  /* ------------------------------------------------------------
     7. TEMA + PREFERÊNCIAS
     ------------------------------------------------------------ */
  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ theme })); } catch { /* ignore */ }
  }

  function loadPrefs() {
    try {
      const prefs = JSON.parse(localStorage.getItem(PREFS_KEY));
      if (prefs && prefs.theme) return prefs.theme;
    } catch { /* ignore */ }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  /* ------------------------------------------------------------
     EVENTOS GERAIS
     ------------------------------------------------------------ */
  function bindEvents() {
    el.form.addEventListener("submit", (e) => {
      e.preventDefault();
      renderIfReady();
      if (!state.lastPayload) showToast("Preencha os campos obrigatórios.", true);
    });

    el.clearBtn.addEventListener("click", () => {
      el.fieldsContainer.querySelectorAll("input, textarea, select").forEach((node) => {
        if (node.tagName === "SELECT") node.selectedIndex = 0; else node.value = "";
      });
      hideResult();
    });

    el.ecLevel.addEventListener("change", () => { state.ecLevel = el.ecLevel.value; renderIfReady(); });

    el.size.addEventListener("input", () => {
      state.size = Number(el.size.value);
      el.sizeValue.textContent = `${state.size}px`;
      renderIfReady();
    });

    el.fgColor.addEventListener("input", () => { state.fgColor = el.fgColor.value; renderIfReady(); });
    el.bgColor.addEventListener("input", () => { state.bgColor = el.bgColor.value; renderIfReady(); });

    el.logoToggle.addEventListener("change", () => {
      const on = el.logoToggle.checked;
      el.logoPickBtn.hidden = !on;
      if (!on) { state.logoDataUrl = null; el.logoFilename.textContent = ""; }
      renderIfReady();
    });
    el.logoPickBtn.addEventListener("click", () => el.logoInput.click());
    el.logoInput.addEventListener("change", () => {
      const file = el.logoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.logoDataUrl = reader.result;
        el.logoFilename.textContent = file.name;
        renderIfReady();
      };
      reader.readAsDataURL(file);
    });

    el.downloadPng.addEventListener("click", downloadPng);
    el.downloadSvg.addEventListener("click", downloadSvg);
    el.copyImg.addEventListener("click", copyImage);
    el.themeToggle.addEventListener("click", () => {
      applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  /* ------------------------------------------------------------
     INIT
     ------------------------------------------------------------ */
  async function init() {
    applyTheme(loadPrefs());
    await loadConfig();
    buildTabs();
    buildEcOptions();
    buildPresets();
    bindEvents();
    selectType(state.config.qrTypes[0].id);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
