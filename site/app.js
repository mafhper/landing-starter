/* ==========================================================================
   app.js — o JavaScript da galeria: copiar comando e escrever o ano.
   Nada mais: a página é estática e os links de demo/zip são href normais.
   ========================================================================== */

(function () {
  "use strict";

  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy") || "";
      var done = function () {
        btn.classList.add("done");
        btn.textContent = "copied";
        setTimeout(function () {
          btn.classList.remove("done");
          btn.textContent = "copy";
        }, 1200);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var code = btn.parentElement.querySelector("code");
        if (code) {
          var r = document.createRange();
          r.selectNodeContents(code);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
        }
        done();
      }
    });
  });

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
