const repoOwner = "On-Tech-Co";
const repoName = "Glyphs";
const basePath = "icons/svg";
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${basePath}`;
const cdnBaseUrl = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}/dev/${basePath}/`;

let allIcons = {}; // { style: [iconName, ...] }
let selectedStyle = "";
let primaryColor = "#000000";
let secondaryColor = "#666666";

const grid = document.getElementById("icon-grid");
const searchInput = document.getElementById("search");
const pkgFilterEl = document.getElementById("package-filter");
const primaryColorInput = document.getElementById("primary-color");
const secondaryColorInput = document.getElementById("secondary-color");

// 1) Obter a lista de estilos e ícones via GitHub API
async function fetchIcons() {
  try {
    const response = await fetch(apiUrl);
    const styles = await response.json();

    for (const style of styles) {
      if (style.type === "dir") {
        const styleName = style.name;
        const styleUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${basePath}/${styleName}`;
        const styleResponse = await fetch(styleUrl);
        const icons = await styleResponse.json();
        allIcons[styleName] = icons
          .filter((icon) => icon.name.endsWith(".svg"))
          .map((icon) => icon.name.replace(".svg", ""));
      }
    }

    // Selecionar o primeiro estilo disponível
    selectedStyle = Object.keys(allIcons)[0] || "";
    renderPkgFilter();
    renderIcons();
  } catch (error) {
    console.error("Erro ao buscar ícones:", error);
  }
}

// 2) Renderizar o filtro de pacotes
function renderPkgFilter() {
  pkgFilterEl.innerHTML = "";
  Object.keys(allIcons).forEach((style) => {
    const btn = document.createElement("div");
    btn.className = `option${style === selectedStyle ? " active" : ""}`;
    btn.textContent = style;
    btn.onclick = () => {
      selectedStyle = style;
      secondaryColorInput.style.display = style.includes("duotone")
        ? "inline-block"
        : "none";
      renderPkgFilter();
      renderIcons(searchInput.value);
    };
    pkgFilterEl.appendChild(btn);
  });
}

// 3) Renderizar os ícones no grid
function renderIcons(searchTerm = "") {
  const q = searchTerm.toLowerCase();
  grid.innerHTML = "";

  allIcons[selectedStyle]
    .filter((name) => name.includes(q))
    .forEach((iconName) => {
      const card = document.createElement("div");
      card.className = "icon-card";

      const svgUrl = `${cdnBaseUrl}${selectedStyle}/${iconName}.svg`;
      fetch(svgUrl)
        .then((res) => res.text())
        .then((svgText) => {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = svgText.trim();
          const svgEl = tempDiv.querySelector("svg");

          svgEl.setAttribute("width", "64");
          svgEl.setAttribute("height", "64");
          svgEl.style.cursor = "pointer";

          applyColorToSvg(svgEl);

          const label = document.createElement("div");
          label.className = "icon-label";
          label.textContent = iconName;

          const btn = document.createElement("button");
          btn.className = "download";
          btn.textContent = "Download";
          btn.onclick = () => downloadSVG(iconName, svgEl);

          card.append(svgEl, label, btn);
          grid.appendChild(card);
        });
    });
}

// 4) Aplicar cores ao SVG
function applyColorToSvg(svg) {
  const isDuotone = selectedStyle.includes("duotone");
  const paths = svg.querySelectorAll("path");

  if (isDuotone && paths.length >= 2) {
    paths[0].setAttribute("fill", secondaryColor);
    paths[0].setAttribute("fill-opacity", "0.4");
    paths[1].setAttribute("fill", primaryColor);
    paths[1].setAttribute("fill-opacity", "1");
  } else {
    paths.forEach((p) => p.setAttribute("fill", primaryColor));
  }
}

// 5) Eventos de alteração de cor
primaryColorInput.addEventListener("input", (e) => {
  primaryColor = e.target.value;
  document
    .querySelectorAll("#icon-grid svg")
    .forEach((svg) => applyColorToSvg(svg));
});

secondaryColorInput.addEventListener("input", (e) => {
  secondaryColor = e.target.value;
  document
    .querySelectorAll("#icon-grid svg")
    .forEach((svg) => applyColorToSvg(svg));
});

// 6) Download do SVG
function downloadSVG(iconName, svgElement) {
  const clone = svgElement.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const svgData = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${iconName}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

// 7) Busca em tempo real
searchInput.addEventListener("input", () => renderIcons(searchInput.value));

// 8) Inicialização
fetchIcons();
