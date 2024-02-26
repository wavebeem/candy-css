import { $elem } from "../index.js";

const { chroma } = globalThis;
if (!chroma) {
  throw new Error("Chroma.js is required for this module to work.");
}

const html = String.raw;

// Move to HTML <template>?
const outputHtml = html`
  <section>
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
  </section>
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

class ContrastChecker {
  constructor({ targetContrast, foreground, backgrounds }) {
    this.targetContrast = targetContrast;
    this.foreground = foreground;
    this.backgrounds = backgrounds;
  }

  report(theme) {
    return this.backgrounds.map((bgName) => {
      // Chroma.js can't parse modern CSS color functions, so we have to use the
      // DOM API to convert them to classic `rgb(r, g, b)` from modern `hsl(h s
      // l)` format
      const bg = normalizeCssColor(theme[bgName]);
      const fg = normalizeCssColor(theme[this.foreground]);
      const contrast = chroma.contrast(fg, bg);
      return {
        background: bgName,
        foreground: this.foreground,
        contrast: contrast,
        passes: contrast >= this.targetContrast,
      };
    });
  }
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

  contrastCheckers = [
    new ContrastChecker({
      targetContrast: 4.5,
      foreground: "--candy-color-text1",
      backgrounds: allBackgrounds,
    }),
    new ContrastChecker({
      targetContrast: 4.5,
      foreground: "--candy-color-text2",
      backgrounds: allBackgrounds,
    }),
    new ContrastChecker({
      targetContrast: 3,
      foreground: "--candy-color-border1",
      backgrounds: allBackgrounds,
    }),
    new ContrastChecker({
      targetContrast: 3,
      foreground: "--candy-color-accent1",
      backgrounds: allBackgrounds,
    }),
    new ContrastChecker({
      targetContrast: 3,
      foreground: "--candy-color-accent2",
      backgrounds: allBackgrounds,
    }),
  ];

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
        $elem("span", {}, key),
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
    const pre = document.createElement("pre");
    pre.className = "bit-code";
    for (const checker of this.contrastCheckers) {
      for (const { foreground, background, contrast, passes } of checker.report(
        this.theme,
      )) {
        const badge = passes ? "✅" : "❌";
        pre.append(
          `${badge} ${contrast.toFixed(1).padStart(6)} :: ${foreground} on ${background}\n`,
        );
      }
      pre.append("".padStart(80, "-"), "\n");
    }
    this.report.innerHTML = "";
    this.report.append(pre);
  }

  #saveCustomTheme() {
    localStorage.setItem(
      "candy.theme.custom",
      JSON.stringify(this.themes.custom),
    );
  }

  #loadTheme(name) {
    for (const [key, value] of Object.entries(this.themes[name])) {
      this.#updateTheme(key, value);
    }
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
