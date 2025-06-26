// export.js

// 1) Fontes + CSS para Brands, Classic (solid, regular, light, thin) e Duotone (solid apenas)
const sources = [
  // Brands
  {
    css: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/css/brands.css",
    font: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/webfonts/fa-brands-400.woff2",
    pkg: "brands",
    style: "brands",
    fontFamily: "Font Awesome 6 Brands",
    classPrefix: "fa-brands",
  },
  // Classic
  {
    css: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/css/all.css",
    font: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/webfonts/fa-solid-900.woff2",
    pkg: "classic",
    style: "solid",
    fontFamily: "Font Awesome 6 Free",
    classPrefix: "fa-solid",
  },
  {
    css: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/css/all.css",
    font: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/webfonts/fa-regular-400.woff2",
    pkg: "classic",
    style: "regular",
    fontFamily: "Font Awesome 6 Free",
    classPrefix: "fa-regular",
  },
  {
    css: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/css/all.css",
    font: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/webfonts/fa-light-300.woff2",
    pkg: "classic",
    style: "light",
    fontFamily: "Font Awesome 6 Free",
    classPrefix: "fa-light",
  },
  {
    css: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/css/all.css",
    font: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/webfonts/fa-thin-100.woff2",
    pkg: "classic",
    style: "thin",
    fontFamily: "Font Awesome 6 Free",
    classPrefix: "fa-thin",
  },
  // Duotone (só solid, por hora)
  {
    css: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/css/all.css",
    font: "https://cdn.jsdelivr.net/gh/On-Tech-Co/Glyphs@main/icons/fontawesome/webfonts/fa-duotone-900.woff2",
    pkg: "duotone",
    style: "solid",
    fontFamily: "Font Awesome 6 Duotone",
    classPrefix: "fa-duotone fa-solid",
  },
];

import html2canvas from "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm";

const packageOptions = [
  { key: "brands", label: "Brands" },
  { key: "classic", label: "Classic" },
  { key: "duotone", label: "Duotone" },
];

let allIcons = [];
let selectedPkg = "classic";
let selectedStyle = "solid";

const grid = document.getElementById("icon-grid");
const searchInput = document.getElementById("search");
const pkgFilterEl = document.getElementById("package-filter");
const styleFilterEl = document.getElementById("style-filter");

// 2) Carrega e extrai unicodes, pulando nomes de brands para os outros pacotes
async function loadIconsFromCSS() {
  const cache = {};
  const regex = /\.fa-([a-z0-9-]+)[^{]*\{[^}]*--fa:\s*"\\([0-9a-f]+)"/gi;
  const seen = new Set();

  // 1) Monte o Set de nomes de Brand
  const brandSrc = sources.find((s) => s.pkg === "brands");
  cache[brandSrc.css] =
    cache[brandSrc.css] || (await fetch(brandSrc.css).then((r) => r.text()));
  let brandCss = cache[brandSrc.css]; // <-- let em vez de const
  const brandNames = new Set();
  let m;
  while ((m = /\.fa-([a-z0-9-]+)\s*\{/.exec(brandCss)) !== null) {
    brandNames.add(m[1]);
    brandCss = brandCss.slice(m.index + 1); // agora legal
  }

  // 2) Parseie todas as fontes pulando esses nomes
  for (const s of sources) {
    const cssText =
      cache[s.css] || (cache[s.css] = await fetch(s.css).then((r) => r.text()));
    regex.lastIndex = 0;
    while ((m = regex.exec(cssText)) !== null) {
      const name = m[1],
        uni = m[2];
      if (s.pkg !== "brands" && brandNames.has(name)) continue;
      const key = `${s.pkg}|${s.style}|${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      allIcons.push({
        name,
        unicode: uni,
        pkg: s.pkg,
        style: s.style,
        font: s.font,
        fontFamily: s.fontFamily,
        classPrefix: s.classPrefix,
      });
    }
  }

  // inicializa filtros e grid
  renderPkgFilter();
  renderStyleFilter();
  renderIcons();
}

// 3) Filtro de pacote
function renderPkgFilter() {
  pkgFilterEl.innerHTML = "";
  packageOptions.forEach((o) => {
    const btn = document.createElement("div");
    btn.className = `option${o.key === selectedPkg ? " active" : ""}`;
    btn.textContent = o.label;
    btn.onclick = () => {
      selectedPkg = o.key;
      document.getElementById("secondary-color").style.display =
        o.key === "duotone" ? "inline-block" : "none";
      // ao mudar pacote, reset estilo para o primeiro válido
      selectedStyle = allIcons.find((ic) => ic.pkg === o.key).style;
      renderPkgFilter();
      renderStyleFilter();
      renderIcons(searchInput.value);
    };
    pkgFilterEl.appendChild(btn);
  });
}

// 4) Filtro de estilo (dentro do pacote)
function renderStyleFilter() {
  styleFilterEl.innerHTML = "";
  const styles = Array.from(
    new Set(
      allIcons.filter((ic) => ic.pkg === selectedPkg).map((ic) => ic.style)
    )
  );
  styles.forEach((st) => {
    const btn = document.createElement("div");
    btn.className = `option${st === selectedStyle ? " active" : ""}`;
    btn.textContent = st.charAt(0).toUpperCase() + st.slice(1);
    btn.onclick = () => {
      selectedStyle = st;
      renderStyleFilter();
      renderIcons(searchInput.value);
    };
    styleFilterEl.appendChild(btn);
  });
}

// 5) Renderiza a grid
function renderIcons(searchTerm = "") {
  const q = searchTerm.toLowerCase();
  grid.innerHTML = "";

  allIcons
    .filter(
      (ic) =>
        ic.pkg === selectedPkg &&
        ic.style === selectedStyle &&
        ic.name.includes(q)
    )
    .forEach((icon) => {
      const card = document.createElement("div");
      card.className = "icon-card";

      const i = document.createElement("i");
      i.className = `${icon.classPrefix} fa-${icon.name}`;
      i.style.fontFamily = icon.fontFamily;

      const label = document.createElement("div");
      label.className = "icon-label";
      label.textContent = icon.name;

      const btn = document.createElement("button");
      btn.className = "download";
      btn.textContent = "Download";
      btn.onclick = () => downloadSVG(icon, i);

      card.append(i, label, btn);
      grid.appendChild(card);
    });
  applyColorStyles();
}

// 6) Gera e baixa o SVG
async function downloadSVG(icon, el) {
  try {
    // Cria wrapper invisível com estilo controlado
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "-9999px";
    wrapper.style.width = "auto";
    wrapper.style.height = "auto";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.fontSize = "256px";
    wrapper.style.lineHeight = "1";
    wrapper.style.background = "transparent";
    wrapper.style.padding = "64px"; // margem de segurança

    // Clona o ícone e aplica a cor computada
    const clone = el.cloneNode(true);
    const computed = getComputedStyle(el);
    clone.style.color = computed.color;
    clone.style.fontFamily = computed.fontFamily || icon.fontFamily;
    clone.style.fontWeight = computed.fontWeight || "900";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Aguarda um pequeno delay para garantir que fontes foram aplicadas
    await new Promise((res) => setTimeout(res, 100));

    const canvas = await html2canvas(wrapper, {
      backgroundColor: null,
      useCORS: true,
      scale: 2,
    });

    document.body.removeChild(wrapper);

    canvas.toBlob((blob) => {
      if (!blob) throw new Error("Falha ao gerar imagem.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${icon.name}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  } catch (err) {
    console.error("Erro ao exportar PNG:", err);
    alert("Erro ao exportar PNG: " + err.message);
  }
}

const primaryColorInput = document.getElementById("primary-color");
const secondaryColorInput = document.getElementById("secondary-color");

let primaryColor = "#000000";
let secondaryColor = "#666666";

// Atualiza as cores nos ícones do grid
function applyColorStyles() {
  const isDuotone = selectedPkg === "duotone";
  document.querySelectorAll("#icon-grid i").forEach((icon) => {
    if (isDuotone) {
      icon.style.setProperty("--fa-primary-color", primaryColor);
      icon.style.setProperty("--fa-secondary-color", secondaryColor);
    } else {
      icon.style.color = primaryColor;
      icon.style.removeProperty("--fa-primary-color");
      icon.style.removeProperty("--fa-secondary-color");
    }
  });
}

// Eventos de cor
primaryColorInput.addEventListener("input", (e) => {
  primaryColor = e.target.value;
  applyColorStyles();
});
secondaryColorInput.addEventListener("input", (e) => {
  secondaryColor = e.target.value;
  applyColorStyles();
});

// 7) Busca em tempo real
searchInput.addEventListener("input", () => renderIcons(searchInput.value));

// 8) Começa tudo
loadIconsFromCSS();
