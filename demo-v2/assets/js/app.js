/* ==========================================================================
   app.js - o único JavaScript do site.

   O que ele faz (e o que ele NÃO faz):
   - liga o toggle de tema (o anti-FOUC já rodou inline no <head>);
   - adiciona .scrolled na nav quando a página sai do topo;
   - copia o comando brew para a área de transferência;
   - escreve o ano corrente no rodape.

   A Aurora é dark-first: o tema escuro é o padrão e o claro é a escolha
   explícita (a classe .light no <html>). Não há menu para abrir: a nav é
   subtrativa por CSS.
   ========================================================================== */

(function () {
  "use strict";

  /* ---- 1. tema ----------------------------------------------------------
     O <head> aplicou o tema antes do paint; aqui só alternamos e gravamos.
     Clicar em "system" não existe: alternamos escuro <-> claro, e o
     armazenado passa a ser a escolha explícita do usuário. */
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var light = !root.classList.contains("light");
      root.classList.toggle("light", light);
      try { localStorage.setItem("theme", light ? "light" : "dark"); } catch (e) {}
    });
  }

  /* ---- 2. nav com estado ------------------------------------------------
     Fora do topo, a nav ganha a borda inferior (.scrolled).
     { passive: true } porque não chamamos preventDefault. */
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- 3. copiar comando ------------------------------------------------
     O botão .copy-btn carrega o texto em data-copy. Depois de copiar,
     fica .done por 1.2s. Fallback: navigator.clipboard pode faltar em
     contexto não-seguro (file://, http) - nesse caso seleciona o texto. */
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      '<rect x="9" y="9" width="12" height="12" rx="2"/>' +
      '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
    btn.appendChild(icon);

    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy") || "";
      var done = function () {
        btn.classList.add("done");
        setTimeout(function () { btn.classList.remove("done"); }, 1200);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var prev = document.querySelector(".brew-cmd");
        if (prev) {
          var r = document.createRange();
          r.selectNodeContents(prev);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
        }
        done();
      }
    });
  });

  /* ---- 4. ano ------------------------------------------------------------ */
  var year = document.getElementById("year");
  if (year) { year.textContent = String(new Date().getFullYear()); }
})();
