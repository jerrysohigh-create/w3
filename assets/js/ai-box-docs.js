(() => {
  "use strict";
  const labels = document.body.dataset;
  document.querySelectorAll(".abx-copy").forEach(button => {
    button.addEventListener("click", async () => {
      const text = button.closest(".abx-code").querySelector("code").textContent;
      const status = button.nextElementSibling;
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = labels.copySuccess;
      } catch {
        status.textContent = labels.copyFailure;
      }
    });
  });
})();
