import { $elem } from "../index.js";

const nbsp = "\u00a0";

const { chroma } = globalThis;
if (!chroma) {
  throw new Error("Chroma.js is required for this module to work.");
}

const html = String.raw;

const trimColorName = (colorName) => {
  return colorName.replace(/^--candy-color-/, "");
};

// Move to HTML <template>?
const outputHtml = html`
  <div class="site-padding">
    <h1>Preview</h1>

    <h2>Buttons</h2>
    <div class="site-flex-row-wrap">
      <button class="candy-button candy-primary">Primary</button>
      <button class="candy-button">Button</button>
      <button class="candy-button" disabled>Button</button>
    </div>

    <h2>Selects</h2>
    <div class="site-flex-row-wrap">
      <select class="candy-select">
        <option>Option 1</option>
        <option>Option 2</option>
        <option>Option 3</option>
      </select>
      <select class="candy-select" disabled>
        <option>Option 1</option>
        <option>Option 2</option>
        <option>Option 3</option>
      </select>
    </div>

    <h2>Inputs</h2>
    <div class="site-flex-column site-gap">
      <div class="site-flex-row-wrap">
        <input class="candy-input" value="Input" />
        <input class="candy-input" value="Input" disabled />
      </div>
      <div class="site-flex-row-wrap">
        <input class="candy-input" placeholder="Placeholder" />
        <input class="candy-input" placeholder="Placeholder" disabled />
      </div>
      <div class="site-flex-row-wrap">
        <input class="candy-input" />
        <input class="candy-input" disabled />
      </div>
    </div>

    <h2>Checkboxes</h2>
    <div class="site-flex-row-wrap">
      <input type="checkbox" class="candy-checkbox" />
      <input type="checkbox" class="candy-checkbox" checked />
      <input type="checkbox" class="candy-checkbox" disabled />
      <input type="checkbox" class="candy-checkbox" disabled checked />
    </div>

    <h2>Radio buttons</h2>
    <div class="site-flex-row-wrap">
      <input name="radio1" type="radio" class="candy-radio" />
      <input name="radio1" type="radio" class="candy-radio" checked />
      <input name="radio2" type="radio" class="candy-radio" disabled />
      <input name="radio2" type="radio" class="candy-radio" disabled checked />
    </div>
  </div>
`;

function isThemeProperty(property) {
  return property.startsWith("--candy-color-");
}

function cleanCSSPropertyValue(value) {
  return value.trim();
}

function getThemeObject() {
  const candyRoot = document.querySelector(".candy-root");
  const themeObject = {};
  const candyRootStyle = getComputedStyle(candyRoot);
  // `getComputedStyle` omits custom properties in Chromium for some reason. So
  // we have to work way harder and parse the actual stylesheet to fill in these
  // variables. To keep things simple, we're scanning all stylesheets for all
  // properties starting with `--candy-color-`. (2023-12-14)
  //
  // https://bugs.chromium.org/p/chromium/issues/detail?id=949807
  const keys = [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .flatMap((rules) => [...(rules.style || [])])
    .filter(isThemeProperty)
    .sort();

  for (const key of keys) {
    themeObject[key] = cleanCSSPropertyValue(
      candyRootStyle.getPropertyValue(key) || "",
    );
  }
  return themeObject;
}

const div = document.createElement("div");
function normalizeCssColor(color) {
  div.style.color = color;
  return div.style.color;
}

function getContrast(fg, bg) {
  fg = normalizeCssColor(fg);
  bg = normalizeCssColor(bg);
  return chroma.contrast(fg, bg);
}

const allBackgrounds = [
  "--candy-color-background1",
  "--candy-color-background2",
  "--candy-color-background3",
  "--candy-color-background4",
];

class SiteThemeEditor extends HTMLElement {
  theme = getThemeObject();
  inputs = {};
  themeNames = {
    default: "Default",
    dark: "Dark",
    custom: "Custom",
  };
  themes = {
    default: { ...this.theme },
    dark: {
      "--candy-color-background1": "hsl(160 50% 18%)",
      "--candy-color-background2": "hsl(160 50% 16%)",
      "--candy-color-background3": "hsl(160 50% 13%)",
      "--candy-color-background4": "hsl(160 50% 10%)",
      "--candy-color-text1": "hsl(160 50% 90%)",
      "--candy-color-text2": "hsl(160 50% 70%)",
      "--candy-color-border1": "hsl(160 50% 40%)",
      "--candy-color-border2": "hsl(160 50% 26%)",
      "--candy-color-border3": "hsl(160 50% 22%)",
      "--candy-color-accent1": "hsl(85 90% 50%)",
      "--candy-color-accent2": "hsl(85 90% 90%)",
      "--candy-color-shadow1": "hsl(160 50% 5% / 50%)",
    },
    custom: this.#loadCustomTheme(),
  };

  connectedCallback() {
    this.innerHTML = "";
    this.editor = $elem("div", {
      className:
        "editor candy-root site-flex-column site-gap site-padding candy-texture-smooth",
    });
    this.output = $elem("div", {
      className: "output candy-root",
    });
    this.preview = $elem("div", {
      className: "preview candy-root candy-scrollbar",
    });
    this.report = $elem(
      "div",
      {
        className: "report site-padding",
      },
      "This is a summary of your theme:",
    );
    this.preview.innerHTML = outputHtml;
    this.append(this.editor, this.output);
    this.output.append(this.report, this.preview);
    this.themeSelect = $elem(
      "select",
      {
        className: "candy-select",
        onchange: (event) => {
          this.#loadTheme(event.target.value);
        },
      },
      $elem(
        "option",
        { value: "", selected: true, disabled: true },
        "Load theme...",
      ),
      ...Object.keys(this.themes).map((key) => {
        return $elem("option", { value: key }, this.themeNames[key]);
      }),
    );
    this.editor.append(this.themeSelect);
    for (const [key, value] of Object.entries(this.theme)) {
      this.inputs[key] = $elem("input", {
        className: "candy-input",
        value,
        oninput: (event) => {
          this.#updateTheme({
            [key]: event.target.value,
          });
        },
      });
      const field = $elem(
        "label",
        { className: "site-flex-column" },
        $elem("span", {}, trimColorName(key)),
        this.inputs[key],
      );
      this.editor.append(field);
    }
    this.#updateTheme(this.theme);
  }

  #updateTheme(theme) {
    for (const [key, value] of Object.entries(theme)) {
      this.theme[key] = value;
      if (value !== this.inputs[key].value) {
        this.inputs[key].value = value;
      }
      this.preview.style.setProperty(key, value);
    }
    this.#saveCustomTheme();
    this.#updateReport();
  }

  #updateReport() {
    const div = document.createElement("div");
    div.className = "site-flex-row-wrap";
    const tableContainer = document.createElement("div");
    tableContainer.className =
      "candy-box site-table-responsive contrast-table-container";
    const table = document.createElement("table");
    table.className = "candy-table contrast-table";
    tableContainer.append(table);
    const thead = $elem("thead", {});
    thead.append(
      $elem(
        "tr",
        {},
        $elem("th", {}, "BG1"),
        $elem("th", {}, "BG2"),
        $elem("th", {}, "BG3"),
        $elem("th", {}, "BG4"),
        $elem("th", {}, "Foreground"),
      ),
    );
    const tbody = $elem("tbody", {});

    const appendRow = (target, colorName) => {
      const name = trimColorName(colorName);
      const tr = $elem("tr", {});
      const fg = this.theme[colorName];
      for (const bg of allBackgrounds) {
        const contrast = getContrast(fg, this.theme[bg]);
        const className = contrast < target ? "contrast-fail" : "contrast-pass";
        tr.append(
          $elem(
            "td",
            { className },
            contrast.toFixed(2),
            nbsp,
            contrast < target ? "🚫" : "✅",
          ),
        );
      }
      tr.append($elem("td", {}, name));
      tbody.append(tr);
    };

    appendRow(3, "--candy-color-border1");
    appendRow(4.5, "--candy-color-text1");
    appendRow(4.5, "--candy-color-text2");
    appendRow(4.5, "--candy-color-accent1");
    appendRow(4.5, "--candy-color-accent2");

    table.append(thead, tbody);
    div.append(tableContainer);
    this.report.innerHTML = "";
    this.report.append(div);
  }

  #saveCustomTheme() {
    localStorage.setItem(
      "candy.theme.custom",
      JSON.stringify(this.themes.custom),
    );
  }

  #loadTheme(name) {
    this.#updateTheme(this.themes[name]);
    this.themeSelect.value = "";
  }

  #loadCustomTheme() {
    const theme = localStorage.getItem("candy.theme.custom");
    if (theme === null) {
      return {
        "--candy-color-background1": "hsl(80 35% 99%)",
        "--candy-color-background2": "hsl(80 35% 98%)",
        "--candy-color-background3": "hsl(80 35% 93%)",
        "--candy-color-background4": "hsl(80 35% 90%)",
        "--candy-color-text1": "hsl(80 35% 5%)",
        "--candy-color-text2": "hsl(80 35% 20%)",
        "--candy-color-border1": "hsl(80 35% 40%)",
        "--candy-color-border2": "hsl(80 35% 60%)",
        "--candy-color-border3": "hsl(80 35% 75%)",
        "--candy-color-accent1": "hsl(260 100% 40%)",
        "--candy-color-accent2": "hsl(260 100% 20%)",
        "--candy-color-shadow1": "hsl(80 35% 50% / 30%)",
      };
    }
    return JSON.parse(theme);
  }
}

customElements.define("site-theme-editor", SiteThemeEditor);
