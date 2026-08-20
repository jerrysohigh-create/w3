(function () {
  var form = document.getElementById("sandbox-form");
  var input = document.getElementById("sandbox-command");
  var output = document.getElementById("sandbox-output");
  var runButton = document.getElementById("sandbox-run");
  var state = document.getElementById("sandbox-state");
  var fallbackCommand = "pay 0.42 USDC for data access";
  var running = false;

  if (!form || !input || !output || !runButton) return;

  function append(line) {
    output.textContent += "\n" + line;
    output.scrollTop = output.scrollHeight;
  }

  function wait(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (running) return;

    running = true;
    var command = input.value.trim() || fallbackCommand;
    var receiptId = "rcpt_demo_" + Date.now().toString(36);
    runButton.disabled = true;
    runButton.textContent = "RUNNING…";
    if (state) state.textContent = "● EXECUTING";

    append("");
    append("$ " + command);
    append("[ .. ] resolving intent");
    await wait(180);
    append("[ OK ] identity: demo principal / browser session");
    await wait(180);
    append("[ OK ] policy: sandbox-only action");
    await wait(180);
    append("[ OK ] approval: simulated human confirmation");
    await wait(180);
    append("[ OK ] execution: no external call performed");
    append("[ OK ] receipt: " + receiptId);
    append("[ .. ] environment: BROWSER SANDBOX / NOT ON-CHAIN");

    input.value = "";
    runButton.disabled = false;
    runButton.textContent = "RUN";
    if (state) state.textContent = "● READY";
    running = false;
    input.focus();
  });
})();
