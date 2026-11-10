/* ==========================================================================
   app.js — o único JavaScript da página.

   O que ele faz:
   - mantém a sacola de demonstração (quantidade, remoção e subtotal);
   - abre a ficha da peça e liga os filtros da coleção;
   - controla o menu móvel e a marcação da seção atual na navegação;
   - valida a carta do atelier e escreve o ano corrente no rodapé;
   - faz as entradas com IntersectionObserver + CSS, sem biblioteca.

   O conteúdo das peças (nome, preço e ficha) vive em DETAILS; os cards em
   index.html exibem o mesmo nome e preço. Ao trocar uma peça, ajuste os dois.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var DETAILS = {
    onda: {
      name: "Onda Lenta",
      price: 1480,
      kicker: "Edição de 40 · Outono 2026",
      desc: "Onda Lenta nasce de um único rolo tingido em três banhos de índigo. As faixas claras não são estampadas: são o fio que ficou protegido pelo amarrilho. Cada peça revela uma ondulação diferente.",
      specs: [
        ["Composição", "Seda 100% · 16 momme"],
        ["Dimensão", "90 × 90 cm"],
        ["Borda", "Enrolada e costurada à mão"],
        ["Tingimento", "Três banhos de índigo"]
      ],
      care: "Lavar à mão em água fria com sabão neutro. Secar à sombra, sem torcer. Passar do lado avesso em temperatura baixa."
    },
    jardim: {
      name: "Jardim Seco",
      price: 1620,
      kicker: "Edição de 40 · Outono 2026",
      desc: "Um jardim seco desenhado com carimbos de madeira e pigmento mineral. O fundo cru recebe duas camadas de cor; a terceira é aplicada peça por peça, à mão.",
      specs: [
        ["Composição", "Seda 100% · 16 momme"],
        ["Dimensão", "90 × 90 cm"],
        ["Borda", "Enrolada e costurada à mão"],
        ["Tingimento", "Carimbo manual · pigmento mineral"]
      ],
      care: "Lavar à mão em água fria com sabão neutro. Secar à sombra, sem torcer. Passar do lado avesso em temperatura baixa."
    },
    noite: {
      name: "Noite Clara",
      price: 1540,
      kicker: "Edição de 40 · Outono 2026",
      desc: "Índigo profundo com pontos de ouro aplicados à mão. A leitura muda com a luz: de noite, quase preto; de dia, azul.",
      specs: [
        ["Composição", "Seda 100% · 16 momme"],
        ["Dimensão", "90 × 90 cm"],
        ["Borda", "Enrolada e costurada à mão"],
        ["Detalhe", "Pontos de ouro aplicados à mão"]
      ],
      care: "Lavar à mão em água fria com sabão neutro. Secar à sombra, sem torcer. Passar do lado avesso em temperatura baixa."
    },
    argila: {
      name: "Argila",
      price: 1380,
      kicker: "Edição de 40 · Outono 2026",
      desc: "Terracota e cru, em blocos que se deslocam. O tingimento é feito com barro local, e o desenho nasce do dobramento do tecido antes do banho.",
      specs: [
        ["Composição", "Seda 100% · 16 momme"],
        ["Dimensão", "90 × 90 cm"],
        ["Borda", "Enrolada e costurada à mão"],
        ["Tingimento", "Barro local · dobramento antes do banho"]
      ],
      care: "Lavar à mão em água fria com sabão neutro. Secar à sombra, sem torcer. Passar do lado avesso em temperatura baixa."
    }
  };

  var brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  function money(value) { return brl.format(value); }

  /* ---------------------------------------------------------- referências */
  var head = document.querySelector(".site-head");
  var cartOpen = document.getElementById("cart-open");
  var cartCount = document.getElementById("cart-count");
  var cartDialog = document.getElementById("cart-dialog");
  var cartList = document.getElementById("cart-list");
  var cartEmpty = document.getElementById("cart-empty");
  var cartFoot = document.getElementById("cart-foot");
  var cartTotal = document.getElementById("cart-total");
  var cartStatus = document.getElementById("cart-status");
  var productDialog = document.getElementById("product-dialog");
  var productArt = document.getElementById("product-art");
  var productKicker = document.getElementById("product-kicker");
  var productTitle = document.getElementById("product-title");
  var productPrice = document.getElementById("product-price");
  var productDesc = document.getElementById("product-desc");
  var productSpecs = document.getElementById("product-specs");
  var productCare = document.getElementById("product-care");
  var productAdd = document.getElementById("product-add");
  var menu = document.getElementById("menu");
  var menuToggle = document.getElementById("menu-toggle");
  var menuClose = document.getElementById("menu-close");

  menu.inert = true;

  /* -------------------------------------------------------------- sacola */
  var cart = new Map();

  function cartQuantity() {
    var total = 0;
    cart.forEach(function (qty) { total += qty; });
    return total;
  }

  function cartSubtotal() {
    var total = 0;
    cart.forEach(function (qty, id) { total += DETAILS[id].price * qty; });
    return total;
  }

  function renderCart(animate) {
    var entries = Array.from(cart.entries());
    var count = cartQuantity();
    var empty = entries.length === 0;

    cartCount.textContent = String(count);
    cartCount.hidden = empty;
    cartOpen.setAttribute(
      "aria-label",
      empty ? "Abrir sacola" : "Abrir sacola, " + count + (count === 1 ? " item" : " itens")
    );
    cartEmpty.hidden = !empty;
    cartList.hidden = empty;
    cartFoot.hidden = empty;
    cartTotal.textContent = money(cartSubtotal());

    if (empty) {
      cartList.innerHTML = "";
      cartStatus.textContent = "";
    } else {
      cartList.innerHTML = entries.map(function (entry) {
        var id = entry[0];
        var qty = entry[1];
        var d = DETAILS[id];
        return "" +
          '<li class="cart-line" data-id="' + id + '">' +
            '<span class="cart-line__art"><span class="silk" data-scarf="' + id + '" aria-hidden="true"></span></span>' +
            '<div class="cart-line__main">' +
              '<p class="cart-line__name">' + d.name + "</p>" +
              '<p class="cart-line__spec">90 × 90 cm · seda 16 momme</p>' +
              '<div class="cart-line__controls">' +
                '<button class="qty-btn" type="button" data-qty="-1" aria-label="Diminuir ' + d.name + '">−</button>' +
                '<span class="cart-line__qty">' + qty + "</span>" +
                '<button class="qty-btn" type="button" data-qty="1" aria-label="Aumentar ' + d.name + '">+</button>' +
                '<button class="cart-line__remove" type="button" data-remove aria-label="Remover ' + d.name + ' da sacola">Remover</button>' +
              "</div>" +
            "</div>" +
            '<span class="cart-line__price">' + money(d.price * qty) + "</span>" +
          "</li>";
      }).join("");
    }

    if (animate && count > 0) {
      cartCount.classList.remove("is-bump");
      void cartCount.offsetWidth;
      cartCount.classList.add("is-bump");
    }
  }

  function openCart() {
    if (!cartDialog.open) cartDialog.showModal();
  }

  function addToCart(id, qty) {
    if (!DETAILS[id]) return;
    cart.set(id, (cart.get(id) || 0) + (qty || 1));
    renderCart(true);
  }

  cartList.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;
    var line = button.closest("[data-id]");
    if (!line) return;
    var id = line.getAttribute("data-id");

    if (button.hasAttribute("data-remove")) {
      cart.delete(id);
      renderCart(false);
      return;
    }

    var delta = button.getAttribute("data-qty");
    if (!delta) return;
    var next = (cart.get(id) || 0) + Number(delta);
    if (next <= 0) cart.delete(id);
    else cart.set(id, next);
    renderCart(false);
  });

  cartOpen.addEventListener("click", openCart);

  document.getElementById("cart-explore").addEventListener("click", function () {
    cartDialog.close();
    window.setTimeout(function () {
      document.getElementById("colecao").scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth"
      });
    }, 80);
  });

  document.getElementById("cart-checkout").addEventListener("click", function () {
    cartStatus.textContent = "Demonstração: nenhum pedido foi enviado.";
  });

  /* --------------------------------------------------------------- peça */
  function openProduct(id) {
    var d = DETAILS[id];
    if (!d) return;

    productArt.setAttribute("data-scarf", id);
    productKicker.textContent = d.kicker;
    productTitle.textContent = d.name;
    productPrice.textContent = money(d.price);
    productDesc.textContent = d.desc;
    productCare.textContent = d.care;
    productSpecs.innerHTML = d.specs.map(function (row) {
      return "<div><dt>" + row[0] + "</dt><dd>" + row[1] + "</dd></div>";
    }).join("");
    productAdd.setAttribute("data-add", id);
    productDialog.showModal();
  }

  document.querySelectorAll("[data-open]").forEach(function (button) {
    button.addEventListener("click", function () {
      openProduct(button.getAttribute("data-open"));
    });
  });

  productAdd.addEventListener("click", function () {
    var id = productAdd.getAttribute("data-add");
    productDialog.close();
    addToCart(id, 1);
    openCart();
  });

  /* ------------------------------------------------------------ diálogos */
  document.querySelectorAll("[data-close]").forEach(function (button) {
    button.addEventListener("click", function () {
      var dialog = button.closest("dialog");
      if (dialog) dialog.close();
    });
  });

  [productDialog, cartDialog].forEach(function (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
  });

  /* ------------------------------------------------------------- filtros */
  var filters = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));

  filters.forEach(function (filter) {
    filter.addEventListener("click", function () {
      var value = filter.getAttribute("data-filter");
      filters.forEach(function (other) {
        other.setAttribute("aria-pressed", String(other === filter));
      });
      cards.forEach(function (card) {
        card.hidden = value !== "todas" && card.getAttribute("data-category") !== value;
      });
    });
  });

  /* --------------------------------------------------------------- menu */
  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    menu.inert = !open;
    menuToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    if (open) {
      var first = menu.querySelector("a");
      if (first) first.focus();
    } else {
      menuToggle.focus();
    }
  }

  menuToggle.addEventListener("click", function () { setMenu(true); });
  menuClose.addEventListener("click", function () { setMenu(false); });
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.classList.contains("is-open")) setMenu(false);
  });

  /* ------------------------------------------------------- header/âncoras */
  function onScroll() {
    head.classList.toggle("is-scrolled", window.scrollY > 16);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var sectionIds = ["atelier", "colecao", "oficina", "diario", "contato"];
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav a"));

  function markNav() {
    var best = null;
    sectionIds.forEach(function (id) {
      var section = document.getElementById(id);
      if (!section) return;
      var top = section.getBoundingClientRect().top;
      if (top <= window.innerHeight * 0.4) best = id;
    });
    navLinks.forEach(function (link) {
      if (best && link.getAttribute("href") === "#" + best) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }
  markNav();
  window.addEventListener("scroll", markNav, { passive: true });

  /* --------------------------------------------------------- newsletter */
  var form = document.getElementById("newsletter-form");
  var email = document.getElementById("email");
  var status = document.getElementById("newsletter-status");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      status.textContent = "Confira o e-mail e tente de novo.";
      status.setAttribute("data-state", "error");
      email.focus();
      return;
    }
    form.reset();
    status.textContent = "Pronto. A próxima carta chega na virada da estação.";
    status.setAttribute("data-state", "ok");
  });

  /* ---------------------------------------------------------------- motion */
  /* Sem biblioteca: o observer marca o que entrou; o CSS faz a entrada.
     Reduced motion desliga o modo .js e tudo fica visível de imediato. */
  function markReady() {
    if (!document.body.classList.contains("is-ready")) {
      document.body.classList.add("is-ready");
    }
  }

  function initMotion() {
    if (reduceMotion) {
      document.documentElement.classList.remove("js");
      markReady();
      return;
    }

    var revealTargets = Array.prototype.slice.call(
      document.querySelectorAll("[data-reveal], .collection__grid .card")
    );

    cards.forEach(function (card, index) {
      card.style.setProperty("--d", (index % 4) * 0.08 + "s");
    });

    try {
      if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          });
        }, { rootMargin: "0px 0px -10% 0px", threshold: 0.06 });

        revealTargets.forEach(function (element) { observer.observe(element); });
      } else {
        revealTargets.forEach(function (element) { element.classList.add("is-in"); });
      }
    } catch (error) {
      document.documentElement.classList.remove("js");
    }

    /* parallax curto do conjunto do hero */
    var visual = document.querySelector(".hero__visual");
    if (visual) {
      var ticking = false;
      window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          var distance = Math.min(window.scrollY, window.innerHeight);
          visual.style.transform = "translateY(" + (distance * 0.045).toFixed(1) + "px)";
          ticking = false;
        });
      }, { passive: true });
    }

    /* a entrada do hero espera a fonte, com prazo curto */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(markReady);
    }
    window.setTimeout(markReady, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMotion);
  } else {
    initMotion();
  }

  /* ---------------------------------------------------------------- ano */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  renderCart(false);
})();
