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

class SiteNav extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html`
      <nav>
        <ul class="site-nav-menu">
          <li><a href="/" class="candy-link">Home</a></li>
          <li><a href="/docs/" class="candy-link">Documentation</a></li>
          <li><a href="/form-example/" class="candy-link">Form Example</a></li>
        </ul>
      </nav>
    `;
  }
}

customElements.define("site-nav", SiteNav);

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html`
      <footer>
        &copy; <span data-slot="year"></span>
        <a href="https://www.wavebeem.com" class="candy-link">Sage Fennel</a>
      </footer>
    `;
    $("[data-slot='year']", this).textContent = new Date().getFullYear();
  }
}

customElements.define("site-footer", SiteFooter);

class SiteCopyright extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html`
      &copy; <span data-slot="year"></span>
      <a href="https://www.wavebeem.com" class="candy-link">Sage Fennel</a>
    `;
    $("[data-slot='year']", this).textContent = new Date().getFullYear();
  }
}

customElements.define("site-copyright", SiteCopyright);
