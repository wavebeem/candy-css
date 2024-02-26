import { $elem } from "../index.js";

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
          this.#updateTheme(key, event.target.value);
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
    for (const [key, value] of Object.entries(this.theme)) {
      this.#updateTheme(key, value);
    }
  }

  #updateTheme(key, value) {
    this.theme[key] = value;
    if (value !== this.inputs[key].value) {
      this.inputs[key].value = value;
    }
    this.preview.style.setProperty(key, value);
    this.#saveCustomTheme();
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
