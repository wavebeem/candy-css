const html = String.raw;
const css = String.raw;

export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $$(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function $elem(tagName, props, ...children) {
  const element = document.createElement(tagName);
  Object.assign(element, props);
  element.append(...children);
  return element;
}

class HTMLSiteNavElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html`
      <nav class="bit-card">
        <ul class="site-nav-menu">
          <li><a href="/" class="bit-link">Home</a></li>
          <li><a href="/docs/" class="bit-link">Documentation</a></li>
          <li><a href="/form-example/" class="bit-link">Form Example</a></li>
          <li>
            <a href="/palette-swapping/" class="bit-link">Palette Swapping</a>
          </li>
        </ul>
      </nav>
    `;
  }
}

customElements.define("site-nav", HTMLSiteNavElement);

class HTMLSiteFooterElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html`
      <footer class="bit-card">
        &copy; <span data-slot="year"></span>
        <a href="https://www.wavebeem.com" class="bit-link">Sage Fennel</a>
      </footer>
    `;
    $("[data-slot='year']", this).textContent = new Date().getFullYear();
  }
}

customElements.define("site-footer", HTMLSiteFooterElement);
