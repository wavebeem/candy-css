const html = String.raw;

function* range(start, end) {
  for (let i = start; i < end; i++) {
    yield i;
  }
}

function htmlToCode(code) {
  // - Remove initial newlines
  // - Remove trailing whitespace
  // - Split on newlines
  const lines = code.replace(/^\n*/, "").replace(/\s+$/, "").split("\n");
  const match = lines[0].match(/^[ ]*/);
  if (match) {
    const length = match[0].length;
    line: for (const [index, value] of lines.entries()) {
      lines[index] = value;
      for (const i of range(0, length)) {
        if (value[i] !== " ") {
          continue line;
        }
        lines[index] = lines[index].slice(1);
      }
    }
  }
  return lines.join("\n");
}

function cleanCSSPropertyValue(value) {
  return value.trim();
}

function stringMatchesPattern(string, pattern) {
  if (pattern.endsWith("*")) {
    return string.startsWith(pattern.slice(0, -1));
  }
  return string === pattern;
}

function stringSplit(string) {
  return string.trim().split(/\s+/);
}

const candyRoot = document.querySelector(".candy-root");
const baseCustomProperties = {};
const candyRootStyle = getComputedStyle(candyRoot);
// `getComputedStyle` omits custom properties in Chromium for some reason. So we
// have to work way harder and parse the actual stylesheet to fill in these
// variables. To keep things simple, we're scanning all stylesheets for all
// properties starting with `--candy-`. (2023-12-14)
//
// https://bugs.chromium.org/p/chromium/issues/detail?id=949807
const keys = [...document.styleSheets]
  .flatMap((sheet) => [...sheet.cssRules])
  .flatMap((rules) => [...(rules.style || [])])
  .filter((style) => style.startsWith("--candy-"));

for (const key of keys) {
  baseCustomProperties[key] = cleanCSSPropertyValue(
    candyRootStyle.getPropertyValue(key) || "",
  );
}

class InjectExample extends HTMLElement {
  connectedCallback() {
    const name = this.dataset.example;
    const template = document.getElementById(`template-${name}`);
    const div = document.createElement("div");
    div.dataset.exampleName = name;
    div.dataset.exampleType = "result";
    div.appendChild(template.content.cloneNode(true));
    const divH3 = document.createElement("h3");
    divH3.textContent = "Example";
    const pre = document.createElement("pre");
    pre.className = "candy-code";
    pre.textContent = htmlToCode(template.innerHTML);
    pre.dataset.exampleName = name;
    pre.dataset.exampleType = "html";
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Show code";
    summary.className = "candy-button";
    details.insertAdjacentElement("beforeend", summary);
    if ("properties" in this.dataset) {
      const propertyEditor = document.createElement("custom-properties-editor");
      propertyEditor.dataset.properties = this.dataset.properties;
      details.insertAdjacentElement("beforeend", propertyEditor);
    }
    details.insertAdjacentElement("beforeend", pre);
    this.insertAdjacentElement("beforeend", divH3);
    this.insertAdjacentElement("beforeend", div);
    this.insertAdjacentElement("beforeend", details);
  }
}

customElements.define("inject-example", InjectExample);

class CustomPropertiesEditor extends HTMLElement {
  connectedCallback() {
    const patterns = stringSplit(this.dataset.properties || "");
    const properties = Object.keys(baseCustomProperties).filter((key) =>
      patterns.some((pattern) => stringMatchesPattern(key, pattern)),
    );
    // TODO: Don't alter class list in a custom element
    this.classList.add("candy-card", "site-property-editor");
    const title = document.createElement("h3");
    title.className = "site-property-editor-title";
    title.textContent = "CSS custom properties";
    this.appendChild(title);
    const grid = document.createElement("div");
    grid.className = "site-property-editor-grid";
    this.appendChild(grid);
    for (const prop of properties) {
      const label = document.createElement("label");
      label.textContent = prop;
      const input = document.createElement("input");
      input.className = "candy-input";
      input.placeholder = baseCustomProperties[prop] || "";
      input.addEventListener(
        "input",
        (event) => {
          candyRoot.style.setProperty(prop, event.target.value);
        },
        false,
      );
      grid.appendChild(label);
      grid.appendChild(input);
    }
  }
}

customElements.define("custom-properties-editor", CustomPropertiesEditor);

class SiteToc extends HTMLElement {
  connectedCallback() {
    const div = document.createElement("div");
    div.className = "candy-texture-paper candy-card";
    // TODO: Don't alter class list in a custom element
    this.classList.add("site-toc", "candy-texture-striped");
    for (const h2 of document.querySelectorAll("h2")) {
      const a = document.createElement("a");
      a.href = `#${h2.id}`;
      a.textContent = h2.textContent;
      a.className = "candy-link";
      div.append(a);
      h2.innerHTML = html`<a
        href="#${h2.id}"
        class="candy-link site-link-header"
        >${h2.innerHTML}</a
      >`;
    }
    this.append(div);
  }
}

customElements.define("site-toc", SiteToc);
