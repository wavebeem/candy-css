const html = String.raw;

function htmlToCode(code) {
  const lines = code.replace(/^\n*/, "").replace(/\s+$/, "").split("\n");
  const match = lines[0].match(/^[ ]*/);
  if (match) {
    // TODO: This is dangerous; we should only remove an equivalent amount
    // of leading whitespace, not just any arbitrary chunk of `length`
    // characters...
    const length = match[0].length;
    for (const [index, value] of lines.entries()) {
      lines[index] = value.slice(length);
    }
  }
  return lines.join("\n");
}

function cleanCSSPropertyValue(value) {
  return value.trim();
}

const bitRoot = document.querySelector(".candy-root");
const baseCustomProperties = {};
const bitRootStyle = getComputedStyle(bitRoot);
// `getComputedStyle` omits custom properties in Chromium for some reason. So we
// have to work way harder and parse the actual stylesheet to fill in these
// variables. To keep things simple, we're scanning all stylesheets for all
// properties starting with `--candy-`.
//
// 2023-12-14 https://bugs.chromium.org/p/chromium/issues/detail?id=949807
const keys = [...document.styleSheets]
  .flatMap((sheet) => [...sheet.cssRules])
  .flatMap((rules) => [...(rules.style || [])])
  .filter((style) => style.startsWith("--candy-"));

for (const key of keys) {
  baseCustomProperties[key] = cleanCSSPropertyValue(
    bitRootStyle.getPropertyValue(key) || "",
  );
}

class InjectExample extends HTMLElement {
  connectedCallback() {
    // TODO: Don't alter class list in a custom element
    this.classList.add("site-example");
    const name = this.dataset.example;
    const template = document.getElementById(`template-${name}`);
    const div = document.createElement("div");
    div.dataset.exampleName = name;
    div.dataset.exampleType = "result";
    div.appendChild(template.content.cloneNode(true));
    const divH3 = document.createElement("h3");
    divH3.textContent = "Example";
    const pre = document.createElement("pre");
    pre.className = "candy-pre";
    pre.textContent = htmlToCode(template.innerHTML);
    pre.dataset.exampleName = name;
    pre.dataset.exampleType = "html";
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Show HTML & CSS";
    summary.className = "candy-button";
    summary.style.maxWidth = "max-content";
    summary.style.marginTop = "1rem";
    summary.style.userSelect = "none";
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
    const properties = (this.dataset.properties || "")
      .trim()
      .split(/\s+/)
      .filter((x) => x);
    // TODO: Don't alter class list in a custom element
    this.classList.add("candy-card", "site-property-editor");
    const title = document.createElement("h3");
    title.className = "site-property-editor-title";
    title.textContent = "CSS Custom Properties";
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
          bitRoot.style.setProperty(prop, event.target.value);
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
    this.classList.add("candy-card", "site-toc", "candy-texture-striped");
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
