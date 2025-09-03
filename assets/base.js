class NewsletterPopup extends HTMLElement {
  constructor() {
    super();
    this.popup = this.querySelector("div");
    this.closeButton = this.querySelector("#close-newsletter");
    this.init();
  }

  init() {
    // Check local storage to see if the pop-up should be shown
    if (localStorage.getItem("newsletterDismissed")) {
      this.popup.removeAttribute("open");
      return;
    }

    // if ?customer_posted=true#contact_form in the url dismiss the pop up
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("customer_posted") === "true") {
      this.popup.removeAttribute("open");
      localStorage.setItem("newsletterDismissed", "true");
      return;
    }

    // Automatically open the popup when the page loads
    setTimeout(() => {
      this.popup.setAttribute("open", "true");
    }, 500); // Delay slightly to ensure smooth transition

    // Close button logic
    this.closeButton.addEventListener("click", () => {
      this.popup.removeAttribute("open");
      // local storage after 5 seconds
      setTimeout(() => {
        localStorage.setItem("newsletterDismissed", "true");
      }, 500);
    });
  }
}

// Define the custom element
customElements.define("newsletter-popup", NewsletterPopup);

class SizeChart extends HTMLElement {
  constructor() {
    super();

    // Parse the JSON data from the #chart-data <p> child
    this.sizeChart = JSON.parse(this.querySelector("#chart-data").textContent);

    // Create a shadow DOM for encapsulation
    const shadow = this.attachShadow({ mode: "open" });

    // Apply styles and add the table to the shadow DOM
    const style = document.createElement("style");
    style.textContent = `
      * {
      font-style: normal;
      font-weight: 400;
      text-align: left;
      font-size: 14px;
      }
    

      @media (min-width: 768px) {
        * {
          font-size: 16px;
        }
      }

   
      table {
      width: 100%;
      outline: 0;
      border-collapse: collapse;
      }

      th, td {
      width: 1%;
      }

      th {
        padding-bottom: 6px;
      }

      td {
        padding: 6px 0; 
      }

      tr:last-child td {
        padding-bottom: 0;
      }

      .break {
      height: 0.5px;
      background-color: #D1D1D1;
      }
    `;

    // Generate the table and append it to the shadow DOM
    const table = this.generateTable();
    shadow.appendChild(style);
    shadow.appendChild(table);
  }

  // Method to generate the table based on JSON data
  generateTable() {
    const table = document.createElement("table");

    // Create headers from the first item in the data array
    if (this.sizeChart.length > 0) {
      const headers = Object.values(this.sizeChart[0]);
      const thead = document.createElement("thead");
      thead.classList.add("table-header");

      const headerRow = document.createElement("tr");
      headers.forEach((headerText) => {
        const th = document.createElement("th");
        th.textContent = headerText;
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Create table body with data
      const tbody = document.createElement("tbody");
      this.sizeChart.slice(1).forEach((rowData) => {
        const row = document.createElement("tr");

        Object.values(rowData).forEach((cellData) => {
          const cell = document.createElement("td");
          cell.textContent = cellData;
          row.appendChild(cell);
        });

        tbody.appendChild(row);
      });
      table.appendChild(tbody);
    }

    return table;
  }
}

// Define the custom element if it’s not already defined
if (!customElements.get("size-chart")) {
  customElements.define("size-chart", SizeChart);
}

class CartItem extends HTMLElement {
  constructor() {
    super();
    // bind click event to button id decrease
    this.decreaseButton = this.querySelector("button[id='decrease']");
    this.increaseButton = this.querySelector("button[id='increase']");
    // this.quantity = parseInt(this.querySelector("p[id='quantity']").innerHTML);

    this.pid = this.getAttribute("data-product-id");
    // this.handleQuantity = this.handleQuantity.bind(this);

    //this.decreaseButton.addEventListener("click", this.handleQuantity);
    //this.increaseButton.addEventListener("click", this.handleQuantity);
  }

  // async handleQuantity(e) {
  //   console.log(e.target.id);
  //   if (e.target.id === "decrease") {
  //     if (parseInt(this.quantity) === 1) {
  //       console.log("too low");
  //     }
  //     if (parseInt(this.quantity) > 1) {
  //       document
  //         .querySelector("cart-drawer")
  //         .updateQuantity(this.pid, this.quantity - 1);
  //       console.log("decrease it by 1 bro");
  //     }
  //   }
  //   if (e.target.id === "increase") {
  //     document
  //       .querySelector("cart-drawer")
  //       .updateQuantity(this.pid, this.quantity + 1);
  //   }
  //   e.preventDefault();
  //   console.log(this.pid, this.quantity);
  // }
}

if (!customElements.get("cart-item")) {
  customElements.define("cart-item", CartItem);
}

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.openDrawer = this.openDrawer.bind(this);
    this.closeDrawer = this.closeDrawer.bind(this);

    this.addEventListener("click", this.onClick);
  }

  onClick(e) {
    // Close the cart if the user clicks outside of the cart
    const isCloseButton = e.target.closest("#close");

    if (e.target.id === "cart" || isCloseButton) {
      e.preventDefault();

      if (window.location.pathname === "/cart") {
        window.location.href = "/";
      } else {
        this.closeDrawer();
      }
    }
  }

  openDrawer() {
    this.setAttribute("open", "true");
  }

  closeDrawer() {
    this.removeAttribute("open");
  }

  async updateQuantity(itemId, quantity) {
    await fetch("/cart/change", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: itemId,
        quantity: quantity,
      }),
    }).then((res) => {
      console.log(res);
    });
    // Update the cart drawer after the quantity change
    await this.update();
  }

  async update() {
    const res = await fetch("/?section_id=cart-drawer");
    const text = await res.text();
    const html = document.createElement("div");
    html.innerHTML = text;

    const cartDrawer = document.getElementById("cart");
    if (cartDrawer) {
      cartDrawer.innerHTML = html.querySelector("#cart").innerHTML;
    }

    // Update the cart count in the header
    const cartItemCount = document.getElementById("cart-item-count");

    console.log(html, "html");
    console.log("cartItemCount", cartItemCount);
    // set to nothing if 0, otherwise set to the cart item count
    cartItemCount.textContent =
      html.querySelector("#item-count-helper").textContent || "";
  }

  async addToCart(form) {
    await fetch("/cart/add", {
      method: "post",
      body: new FormData(form),
    });
    // update cart
    await this.update().then(() => {
      this.openDrawer();
    });
  }

  async addObjectToCart(object) {
    await fetch("/cart/add.js", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(object),
    });

    // update cart
    await this.update().then(() => {
      this.openDrawer();
    });
  }
}

if (!customElements.get("cart-drawer")) {
  customElements.define("cart-drawer", CartDrawer);
}

class HeaderCart extends HTMLElement {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
    this.addEventListener("click", this.onClick);
  }

  onClick(e) {
    e.preventDefault();
    document.querySelector("cart-drawer").openDrawer();
  }
}

if (!customElements.get("header-cart")) {
  customElements.define("header-cart", HeaderCart);
}

// Turn into a more abstracted component for the drawer
class RemoveButton extends HTMLElement {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
    this.addEventListener("click", this.onClick);
  }

  async onClick(e) {
    e.preventDefault();

    const form = this.closest("form");

    await fetch(e.target.href, {
      method: "post",
      body: new FormData(form),
    });

    // Fetch the updated cart data to check if it's empty
    const response = await fetch("/cart.js");
    const cartData = await response.json();

    // If the cart is empty, close the drawer
    if (cartData.item_count === 0) {
      document.querySelector("cart-drawer").closeDrawer();
    }

    // Update the cart drawer after removing the item
    await document.querySelector("cart-drawer").update();
  }
}

if (!customElements.get("remove-button")) {
  customElements.define("remove-button", RemoveButton);
}

class Newsletter extends HTMLElement {
  constructor() {
    super();
    // elements are input with id email, button with id subscribe
    this.email = this.querySelector("input[id='email']");
    this.button = this.querySelector("button[id='subscribe']");
    this.onClick = this.onClick.bind(this);
    console.log(this.button);

    // if ?customer_posted=true#contact_form is in the url, show a success message
    const urlParams = new URLSearchParams(window.location.search);
    const customerPosted = urlParams.get("customer_posted");
    if (customerPosted === "true") {
      this.changeStatus("Thank you for subscribing");
    }
    this.button.addEventListener("click", this.onClick);
  }
  async onClick(e) {
    console.log(this.email.value);
    if (this.email.value.length < 5) {
      this.changeStatus("Please enter a valid email ");
    }
    // alert('yeas')
  }

  async changeStatus(text) {
    this.querySelector("p").textContent = text;
  }
}

if (!customElements.get("newsletter")) {
  customElements.define("newsletter-widget", Newsletter);
}

class SlideShow extends HTMLElement {
  constructor() {
    super();
    this.initSwiper();
  }

  initSwiper() {
    // Make sure Swiper only initializes when the swiper-container is present
    const swiperContainer = this;
    console.log(swiperContainer);
    if (swiperContainer) {
      const swiper = new Swiper(".swiper", {
        // Swiper options
        slidesPerView: 1, // Number of slides to show
        spaceBetween: 0, // Space between slides
        speed: 400,
        on: {
          init: this.updateProgressBar.bind(this), // Reference to class method
          slideChange: this.updateProgressBar.bind(this), // Reference to class method
        },
      });
      console.log(swiper);
    }
  }
  updateProgressBar() {
    this.querySelector("div[id='progress']").style.width = `${
      ((this.swiper.activeIndex + 1) / this.swiper.slides.length) * 100
    }%`;

    console.log(this.swiper.activeIndex + 1, this.swiper.slides.length);
  }
}

if (!customElements.get("product-slideshow")) {
  customElements.define("product-slideshow", SlideShow);
}

class SearchWidget extends HTMLElement {
  constructor() {
    super();
    this.searchInput = this.querySelector("#search");
    this.searchButton = this.querySelector("#search-button");

    console.log(this.searchInput, this.searchButton);

    // Bind the event handlers
    this.executeSearch = this.executeSearch.bind(this);

    // Listen for Enter key in the input field
    this.searchInput.addEventListener("keydown", this.executeSearch);
    this.searchButton.addEventListener("click", this.executeSearch);
  }

  executeSearch(event) {
    if (event.key === "Enter" || event.type === "click") {
      event.preventDefault();
      const query = this.searchInput.value.trim();

      if (query.length > 0) {
        // Redirect to the Shopify search page with the search query
        window.location.href = `/search?q=${encodeURIComponent(
          query,
        )}&type=product`;
      }
    }
  }
}

// Define the custom element
if (!customElements.get("search-widget")) {
  customElements.define("search-widget", SearchWidget);
}
class Header extends HTMLElement {
  constructor() {
    super();
    this.buttons = this.querySelectorAll("[data-drawer]");

    this.drawers = {
      shop: document.getElementById("shop-drawer"),
      info: document.getElementById("info-drawer"),
      search: document.getElementById("search-drawer"),
      cart: document.getElementById("cart-drawer"),
    };

    this.activeDrawer = null;

    this.buttons.forEach((button) => {
      button.classList.add("green"); // Set all buttons to green by default
      button.addEventListener("click", (e) => {
        const button = e.target.closest("[data-drawer]");
        if (button) {
          this.toggleDrawer(button.dataset.drawer, button);
        }
      });
    });
  }

  toggleDrawer(drawerName, button) {
    const drawer = this.drawers[drawerName];

    if (!drawer) {
      console.error(`Drawer not found: ${drawerName}`);
      return;
    }

    this.closeAllDrawers();

    if (this.activeDrawer === drawerName) {
      return;
    }

    drawer.classList.remove("hidden");
    this.activeDrawer = drawerName;

    // Set all buttons to inactive
    this.buttons.forEach((btn) => {
      btn.classList.add("inactive");
    });

    // Keep the active button green
    button.classList.remove("inactive");

    // if #cart-drawer, open the cart drawer
    if (drawerName === "cart") {
      document.querySelector("cart-drawer").openDrawer();
    }
  }

  closeAllDrawers() {
    Object.values(this.drawers).forEach((drawer) => {
      if (drawer) drawer.classList.add("hidden");
    });

    // Reset all buttons to green when no menu is open
    this.buttons.forEach((button) => {
      button.classList.remove("inactive");
    });

    // close the cart drawer
    document.querySelector("cart-drawer").closeDrawer();

    this.activeDrawer = null;
  }
}

customElements.define("header-holder", Header);

class DescriptionSwitch extends HTMLElement {
  constructor() {
    super();

    this.desc = this.querySelector("div[id='desc']");

    this.onClick = this.onClick.bind(this);
    this.addEventListener("click", this.onClick);

    // If there is a reviews div, initialize the fading function.
    this.reviews = this.querySelector("div[id='reviews']");

    if (this.reviews) {
      this.setupReviewFader();
    }
  }

  onClick(e) {
    // if the target is the outbound link, do nothing
    if (e.target.id === "outbound") {
      return;
    }
    e.preventDefault();

    // if closest is a button
    if (e.target.closest("button")) {
      const clicked = e.target.closest("button");

      // set the text to the attribute which is the button's id
      const id = clicked.id;

      // remove the open attribute from all direct children of desc
      Array.from(this.desc.children).forEach((child) => {
        child.removeAttribute("open");
      });

      // add the open attribute to the child with the id of the button
      this.desc.querySelector(`[id=${id}]`).setAttribute("open", true);

      // set the button to open, and remove open from the other buttons
      this.querySelectorAll("button").forEach((button) => {
        button.removeAttribute("open");
      });

      clicked.setAttribute("open", true);
    }
  }

  setupReviewFader() {
    // Get all child review divs
    this.reviewItems = this.reviews.querySelectorAll("div");

    if (!this.reviewItems.length) return;

    this.reviewIndex = 0;

    // Set interval to automatically fade through reviews every 4 seconds
    this.reviewInterval = setInterval(() => {
      this.fadeThroughReviews();
    }, 6000);
  }

  fadeThroughReviews() {
    // Fade out current review
    this.reviewItems[this.reviewIndex].removeAttribute("open");

    // Calculate the index of the next review
    this.reviewIndex = (this.reviewIndex + 1) % this.reviewItems.length;

    // Fade in the next review
    this.reviewItems[this.reviewIndex].setAttribute("open", true);
  }
}

if (!customElements.get("description-switch")) {
  customElements.define("description-switch", DescriptionSwitch);
}

class OptionHolder extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", this.onClick);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.onClick);
  }

  onClick(e) {
    e.preventDefault();

    const button = e.target.closest("button");
    if (button) {
      const newVariant = button.getAttribute("data-new-variant");
      const newImageIndex = button.getAttribute("data-image-index");
      console.log("New Variant:", newVariant);
      if (newVariant) {
        this.changeVariant(newVariant, newImageIndex);
      }
    }
  }

  async changeVariant(newVariant, newImageIndex) {
    // get the current url without any query params
    const url =
      new URL(window.location.href).origin +
      new URL(window.location.href).pathname;

    // construct query parameters using URLSearchParams
    const params = new URLSearchParams({
      variant: newVariant,
      variantHelper: "true",
    });
    const toPing = `${url}?${params.toString()}`;

    // fetch the new page
    fetch(toPing)
      .then((res) => res.text())
      .then((html) => {
        // parse the fetched HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // get #size-options, #color-options, and #add-to-cart from the new page
        const newSizeOptions = doc.querySelector("#size-options");
        const currentSizeOptions = document.querySelector("#size-options");
        const newColorOptions = doc.querySelector("#color-options");
        const currentColorOptions = document.querySelector("#color-options");
        const newAddToCart = doc.querySelector("#add-to-cart");
        const currentAddToCart = document.querySelector("#add-to-cart");
        // replace the current #size-options with the new one
        if (newSizeOptions && currentSizeOptions) {
          currentSizeOptions.replaceWith(newSizeOptions);
        }

        // replace the current #color-options with the new one
        if (newColorOptions && currentColorOptions) {
          currentColorOptions.replaceWith(newColorOptions);
        }

        // replace the current #add-to-cart with the new one
        if (newAddToCart && currentAddToCart) {
          currentAddToCart.replaceWith(newAddToCart);
        }
      })
      .catch((err) => console.error("Error fetching new variant:", err));

    if (newImageIndex) {
      const swiper = document.querySelector("#pdp-swiper").swiper;
      swiper.slideTo(newImageIndex);
    }
  }
}

if (!customElements.get("option-holder")) {
  customElements.define("option-holder", OptionHolder);
}

class CollectionControl extends HTMLElement {
  constructor() {
    super();
    this.filterToggle = this.querySelector("#collection-filter-toggle");
    this.filter = this.querySelector("#collection-filter");
    this.sortToggle = this.querySelector("#collection-sort-toggle");
    this.sort = this.querySelector("#collection-sort");

    this.filterToggle.addEventListener("click", this.toggleFilter.bind(this));
    this.sortToggle.addEventListener("click", this.toggleSort.bind(this));
    this.addEventListener("click", this.onClick.bind(this));
  }

  toggleFilter() {
    if (this.filter.hasAttribute("open")) {
      this.filter.removeAttribute("open");
    } else {
      this.filter.setAttribute("open", "true");
      this.sort.removeAttribute("open");
    }
  }

  toggleSort() {
    if (this.sort.hasAttribute("open")) {
      this.sort.removeAttribute("open");
    } else {
      this.sort.setAttribute("open", "true");
      this.filter.removeAttribute("open");
    }
  }

  onClick(e) {
    const filterButton = e.target.closest("#filter-button");
    const sortButton = e.target.closest("#sort-button");

    if (filterButton) {
      const paramName = filterButton.getAttribute("data-filter");
      const value = filterButton.getAttribute("data-value");

      const url = new URL(window.location.href);
      const currentValues = url.searchParams.getAll(paramName);

      if (filterButton.hasAttribute("open")) {
        // Remove the filter if it's already open
        const newValues = currentValues.filter((v) => v !== value);
        url.searchParams.delete(paramName);
        newValues.forEach((v) => url.searchParams.append(paramName, v));
        filterButton.removeAttribute("open");
      } else {
        // Add the filter if it's not open
        url.searchParams.append(paramName, value);
        filterButton.setAttribute("open", "true");
      }

      window.history.pushState({}, "", url);
      this.updateProducts(url.href);
    }

    if (sortButton) {
      const sortValue = sortButton.getAttribute("data-sort");

      const url = new URL(window.location.href);
      url.searchParams.set("sort_by", sortValue);

      window.history.pushState({}, "", url);
      this.updateProducts(url.href);
    }
  }

  async updateProducts(newUrl) {
    try {
      const response = await fetch(newUrl);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");

      const newProductsSection = doc.querySelector("#collection-page");
      const currentProductsSection = document.querySelector("#collection-page");

      if (newProductsSection && currentProductsSection) {
        currentProductsSection.replaceWith(newProductsSection);
      }
    } catch (error) {
      console.error("Error updating products:", error);
    }
  }
}

if (!customElements.get("collection-control")) {
  customElements.define("collection-control", CollectionControl);
}

class MobileMenu extends HTMLElement {
  constructor() {
    super();

    this.addEventListener("click", this.onClick.bind(this));
    window.addEventListener("popstate", this.close.bind(this));
  }

  onClick(e) {
    if (e.target.closest("#close-menu")) {
      this.close();
      return;
    }

    const menuItem = e.target.closest(".group");

    // close other groups
    Array.from(this.querySelectorAll(".group")).forEach((group) => {
      if (group !== menuItem) {
        group.removeAttribute("open");
      }
    });

    if (menuItem.hasAttribute("open")) {
      menuItem.removeAttribute("open");
    } else {
      menuItem.setAttribute("open", "true");
    }
  }

  close() {
    // re-enable scroll
    document.body.style.overflow = "auto";

    // close the menu
    this.removeAttribute("open");

    // set #search-mobile to closed
    document.querySelector("#search-mobile").removeAttribute("open");
  }

  open() {
    // disable scroll
    document.body.style.overflow = "hidden";

    // open the menu
    this.setAttribute("open", "true");
  }
}

if (!customElements.get("mobile-menu")) {
  customElements.define("mobile-menu", MobileMenu);
}

class RestockNotify extends HTMLElement {
  constructor() {
    super();
    this.restockButton = this.querySelector("#restock-button");
    this.emailContainer = this.querySelector("#notify");
    this.emailSubmitButton = this.querySelector("#emailSubmitButton");
    this.emailInput = this.querySelector("#emailInput");
    this.init();
  }

  init() {
    // Toggle visibility of the email input form
    this.restockButton.addEventListener("click", () => {
      this.restockButton.classList.toggle("hidden");
      this.emailContainer.classList.toggle("hidden");
      this.emailContainer.classList.toggle("flex");
    });

    // Handle email submission
    this.emailSubmitButton.addEventListener("click", (event) => {
      event.preventDefault();
      if (this.emailInput.value) {
        const variantId = this.emailSubmitButton.getAttribute("variant-id");

        const payload = {
          data: {
            type: "back-in-stock-subscription",
            attributes: {
              profile: {
                data: {
                  type: "profile",
                  attributes: {
                    email: this.emailInput.value,
                  },
                },
              },
              channels: ["EMAIL"],
            },
            relationships: {
              variant: {
                data: {
                  type: "catalog-variant",
                  id: `$shopify:::$default:::${variantId}`,
                },
              },
            },
          },
        };
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            revision: "2024-06-15",
          },
          body: JSON.stringify(payload),
        };

        fetch(
          "https://a.klaviyo.com/client/back-in-stock-subscriptions/?company_id=Xug2Bq",
          requestOptions,
        )
          .then((result) => console.log(result))
          .catch((error) => console.log("error", error));

        this.emailInput.value = ""; // Clear the input field

        // Display success message in DOM

        this.emailInput.placeholder = "Submitted!";
      } else {
        alert("Please enter a valid email address.");
      }
    });
  }
}

// Define the custom element
customElements.define("restock-notify", RestockNotify);
