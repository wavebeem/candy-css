import { $elem } from "../index.js";

const nbsp = "\u00a0";

const { chroma } = globalThis;
if (!chroma) {
  throw new Error("Chroma.js is required for this module to work.");
}

const html = String.raw;

function trimColorName(colorName) {
  return colorName.replace(/^--candy-color-/, "");
}

function areSetsEqual(a, b) {
  if (a.size !== b.size) {
    return false;
  }
  for (const x of a) {
    if (!b.has(x)) {
      return false;
    }
  }
  return true;
}

// Move to HTML <template>?
const outputHtml = html`
  <div>
    <h1>Preview</h1>

    <h2>Buttons</h2>
    <div class="site-flex-column site-gap">
      <div class="site-flex-row-wrap">
        <button class="candy-button candy-primary">Primary</button>
        <button class="candy-button">Button</button>
        <button class="candy-button candy-primary" disabled>Primary</button>
        <button class="candy-button" disabled>Button</button>
      </div>
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

    <h2>Tables</h2>
    <div class="candy-box site-table-responsive site-table-music">
      <table class="candy-table" style="width: 100%">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Time</th>
            <th>Rating</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>1</td>
            <td>Pretelethal</td>
            <td>3:21</td>
            <td>&starf;&starf;&starf;&starf;&star;</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Key Entity Extraction V: Sentry the Defiant</td>
            <td>5:45</td>
            <td>&starf;&starf;&starf;&starf;&starf;</td>
          </tr>
          <tr>
            <td>3</td>
            <td>The Hard Sell</td>
            <td>5:10</td>
            <td>&starf;&starf;&star;&star;&star;</td>
          </tr>
          <tr>
            <td>4</td>
            <td>Number City</td>
            <td>3:49</td>
            <td>&starf;&starf;&starf;&star;&star;</td>
          </tr>
          <tr>
            <td>5</td>
            <td>Gravity's Union</td>
            <td>6:46</td>
            <td>&starf;&starf;&starf;&starf;&starf;</td>
          </tr>
        </tbody>
      </table>
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
  try {
    fg = normalizeCssColor(fg);
    bg = normalizeCssColor(bg);
    return chroma.contrast(fg, bg);
  } catch (err) {
    console.error(err);
    return 0;
  }
}

const allBackgrounds = [
  "--candy-color-background1",
  "--candy-color-background2",
  "--candy-color-background3",
  "--candy-color-background4",
];

class SiteThemeEditor extends HTMLElement {
  theme = this.#loadCustomTheme();
  inputs = {};
  themeNames = {
    lightGreen: "Light Green",
    darkGreen: "Dark Green",
    gray: "Gray",
    cyber: "Cyber",
  };
  themes = {
    lightGreen: getThemeObject(),
    darkGreen: {
      "--candy-color-background1": "hsl(160 50% 10%)",
      "--candy-color-background2": "hsl(160 50% 20%)",
      "--candy-color-background3": "hsl(160 50% 17%)",
      "--candy-color-background4": "hsl(160 50% 14%)",
      "--candy-color-text1": "hsl(160 50% 90%)",
      "--candy-color-text2": "hsl(160 50% 70%)",
      "--candy-color-border1": "hsl(160 50% 45%)",
      "--candy-color-border2": "hsl(160 50% 26%)",
      "--candy-color-border3": "hsl(160 50% 22%)",
      "--candy-color-accent-background1": "hsl(85 80% 50%)",
      "--candy-color-accent-background2": "hsl(85 80% 45%)",
      "--candy-color-accent-border1": "hsl(85 80% 80%)",
      "--candy-color-accent-text1": "hsl(85 80% 5%)",
      "--candy-color-shadow1": "hsl(160 50% 0% / 50%)",
    },
    gray: {
      "--candy-color-background1": "hsl(0 0% 100%)",
      "--candy-color-background2": "hsl(0 0% 96%)",
      "--candy-color-background3": "hsl(0 0% 90%)",
      "--candy-color-background4": "hsl(0 0% 84%)",
      "--candy-color-text1": "hsl(0 0% 5%)",
      "--candy-color-text2": "hsl(0 0% 25%)",
      "--candy-color-border1": "hsl(0 0% 40%)",
      "--candy-color-border2": "hsl(0 0% 60%)",
      "--candy-color-border3": "hsl(0 0% 70%)",
      "--candy-color-accent-background1": "hsl(0 0% 30%)",
      "--candy-color-accent-background2": "hsl(0 0% 25%)",
      "--candy-color-accent-border1": "hsl(0 0% 10%)",
      "--candy-color-accent-text1": "hsl(0 0% 100%)",
      "--candy-color-shadow1": "hsl(0 0% 5% / 20%)",
    },
    cyber: {
      "--candy-color-background1": "#002222",
      "--candy-color-background2": "#003c3c",
      "--candy-color-background3": "#003333",
      "--candy-color-background4": "#002c2c",
      "--candy-color-text1": "#00eeee",
      "--candy-color-text2": "#00cccc",
      "--candy-color-border1": "#00aaaa",
      "--candy-color-border2": "#006666",
      "--candy-color-border3": "#004444",
      "--candy-color-accent-background1": "#00e8e8",
      "--candy-color-accent-background2": "#00d8d8",
      "--candy-color-accent-border1": "#00ffff",
      "--candy-color-accent-text1": "#001111",
      "--candy-color-shadow1": "#00111188",
    },
  };

  connectedCallback() {
    this.#checkThemes();
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
      { className: "report site-padding" },
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
        return $elem("option", { value: key }, this.themeNames[key] || key);
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
        $elem("th", {}, "Foreground"),
        $elem("th", {}, "BG1"),
        $elem("th", {}, "BG2"),
        $elem("th", {}, "BG3"),
        $elem("th", {}, "BG4"),
      ),
    );
    const tbody = $elem("tbody", {});

    const appendRow = (target, colorName, backgrounds) => {
      const name = trimColorName(colorName);
      const tr = $elem("tr", {});
      tr.append($elem("td", {}, name));
      const fg = this.theme[colorName];
      for (const bg of backgrounds) {
        if (bg === undefined) {
          tr.append($elem("td", {}));
        } else {
          const contrast = getContrast(fg, this.theme[bg]);
          const className =
            contrast < target ? "contrast-fail" : "contrast-pass";
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
      }
      tbody.append(tr);
    };

    appendRow(3, "--candy-color-border1", allBackgrounds);
    appendRow(4.5, "--candy-color-text1", allBackgrounds);
    appendRow(4.5, "--candy-color-text2", allBackgrounds);
    appendRow(4.5, "--candy-color-accent-border1", allBackgrounds);
    appendRow(4.5, "--candy-color-accent-text1", [
      "--candy-color-accent-background1",
      "--candy-color-accent-background2",
      undefined,
      undefined,
    ]);

    table.append(thead, tbody);
    div.append(tableContainer);
    this.report.innerHTML = "";
    this.report.append(div);
  }

  #checkThemes() {
    const lightThemeKeys = new Set(Object.keys(this.themes.lightGreen));
    for (const [name, theme] of Object.entries(this.themes)) {
      const set = new Set(Object.keys(theme));
      if (!areSetsEqual(set, lightThemeKeys)) {
        console.error(`Theme "${name}" has a different set of keys.`);
      }
    }
  }

  #saveCustomTheme() {
    localStorage.setItem("candy.theme.custom", JSON.stringify(this.theme));
  }

  #loadTheme(name) {
    for (const key of Object.keys(this.theme)) {
      delete this.theme[key];
    }
    this.#updateTheme(this.themes[name]);
    this.themeSelect.value = "";
  }

  #loadCustomTheme() {
    const json = localStorage.getItem("candy.theme.custom");
    let value = {};
    try {
      value = JSON.parse(json);
    } catch (err) {
      console.error(err);
    }
    return {
      ...getThemeObject(),
      ...value,
    };
  }
}

customElements.define("site-theme-editor", SiteThemeEditor);
