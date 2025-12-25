
/* =========================================================
   GLOBAL WALLET SCRIPT
   Works on ALL pages
========================================================= */
(() => {
  /* =======================
     HELPERS
  ======================= */
  const qs = s => document.querySelector(s);
  const qsa = s => document.querySelectorAll(s);

  const formatAmount = (v, d = 8) =>
    !v || isNaN(v) ? "0" : Number(v).toFixed(d).replace(/\.?0+$/, "");

  const getLastCoin = () => localStorage.getItem("lastCoin") || "USDT";

  /* =======================
     SORT LOGIC (SAFE)
  ======================= */
  (() => {
    const table = qs(".balance-table");
    if (!table) return;

    const headers = table.querySelectorAll(".balance-sort");
    const tbody = table.querySelector("tbody");
    let sortState = {};

    headers.forEach(header => {
      header.addEventListener("click", () => {
        const colIndex = Number(header.dataset.col);
        const asc = sortState[colIndex] !== "asc";
        sortState = { [colIndex]: asc ? "asc" : "desc" };

        headers.forEach(h => h.classList.remove("asc", "desc"));
        header.classList.add(asc ? "asc" : "desc");

        const rows = Array.from(tbody.querySelectorAll("tr"));
        rows.sort((a, b) => {
          const aVal = parseFloat(a.children[colIndex].innerText) || 0;
          const bVal = parseFloat(b.children[colIndex].innerText) || 0;
          return asc ? aVal - bVal : bVal - aVal;
        });

        rows.forEach(row => tbody.appendChild(row));
      });
    });
  })();

  /* =======================
     SEARCH LOGIC (SAFE)
  ======================= */
  (() => {
    const searchInput = qs("#balanceSearch");
    if (!searchInput) return;

    const rows = qsa(".balance-table tbody tr");

    searchInput.addEventListener("input", () => {
      const value = searchInput.value.toLowerCase();
      rows.forEach(row => {
        const text = row.querySelector(".balance-asset").innerText.toLowerCase();
        row.style.display = text.includes(value) ? "" : "none";
      });
    });
  })();

  /* =======================
     DEPOSIT MODULE
  ======================= */
  const Deposit = {
    modal: qs("#depositModal"),

    open(coin = "USDT") {
      if (!this.modal) return;
      this.reset();
      qs("#depositCoinTitle").innerText = coin;
      qs("#depositCoinSelect").value = coin;
      this.modal.classList.add("active");
    },

    close() {
      if (!this.modal) return;
      this.modal.classList.remove("active");
      this.reset();
    },

    reset() {
      if (!qs("#depositPlaceholder")) return;

      qs("#depositPlaceholder").style.display = "block";
      qs("#depositData").style.display = "none";
      qs("#depositGenerateBtn").disabled = true;
      qs("#depositAddress").value = "";
      qs("#depositQr").innerHTML = "";

      qsa(".deposit-networks .net").forEach(n => n.classList.remove("active"));
      qs("#warningDefault").style.display = "block";
      qs("#warningNetwork").style.display = "none";
    },

    enableButton() {
      qs("#depositGenerateBtn").disabled = false;
    },

    generateAddress() {
      const coin = qs("#depositCoinSelect").value;
      const network = qs("#networkName").innerText;
      const address = `${coin}_${network}_ADDRESS_123456`;

      qs("#depositPlaceholder").style.display = "none";
      qs("#depositData").style.display = "block";
      qs("#depositAddress").value = address;

      qs("#depositQr").innerHTML = "";
      new QRCode(qs("#depositQr"), {
        text: address,
        width: 200,
        height: 200
      });
    }
  };

  /* =======================
     WITHDRAW MODULE
  ======================= */
  const Withdraw = {
    modal: qs("#withdrawModal"),
    commission: 0.005,

    open(coin = "USDT") {
      if (!this.modal) return;
      this.reset();
      qs("#withdrawCoinTitle").innerText = coin;
      qs("#withdrawCoinSelect").value = coin;
      this.modal.classList.add("active");
    },

    close() {
      if (!this.modal) return;
      this.modal.classList.remove("active");
      this.reset();
    },

    reset() {
      if (!qs("#withdrawAmount")) return;

      qs("#withdrawAmount").value = "";
      qs("#commissionToggle").checked = false;
      qs("#payAmount").innerText = "0";
      qs("#receiveAmount").innerText = "0";

      const addr = qs(".withdraw-right input[type='text']");
      if (addr) addr.value = "";
    },

    updateAmounts() {
      const amount = parseFloat(qs("#withdrawAmount").value) || 0;
      const coin = qs("#withdrawCoinTitle").innerText;
      const withFee = qs("#commissionToggle").checked;

      let pay = amount;
      let receive = amount;

      if (withFee) pay += amount * this.commission;

      qs("#payAmount").innerText = `${formatAmount(pay)} ${coin}`;
      qs("#receiveAmount").innerText = `${formatAmount(receive)} ${coin}`;
    }
  };

  /* =======================
     TABLE BUTTONS
  ======================= */
  qsa(".balance-row-actions button").forEach(btn => {
    btn.addEventListener("click", e => {
      const coin = e.target.closest("tr").querySelector("strong").innerText;
      localStorage.setItem("lastCoin", coin);

      const action = btn.innerText.trim();
      if (action === "Deposit") Deposit.open(coin);
      if (action === "Withdraw") Withdraw.open(coin);
    });
  });

  /* =======================
     GLOBAL HEADER HANDLER
  ======================= */
  document.addEventListener("click", e => {
    const btn =
      e.target.closest("button.deposit") ||
      e.target.closest(".assets-actions .assets-btn");

    if (!btn) return;

    const text = btn.innerText.trim().toLowerCase();
    const coin = getLastCoin();

    if (text === "deposit") Deposit.open(coin);
    if (text === "withdraw") Withdraw.open(coin);
  });

  /* =======================
     MODAL CONTROLS
  ======================= */
  qs("#depositClose")?.addEventListener("click", () => Deposit.close());
  qs("#withdrawClose")?.addEventListener("click", () => Withdraw.close());
  qs(".deposit-overlay")?.addEventListener("click", () => Deposit.close());
  qs(".withdraw-overlay")?.addEventListener("click", () => Withdraw.close());

  /* =======================
     DEPOSIT NETWORKS
  ======================= */
  qsa(".deposit-networks .net").forEach(net => {
    net.addEventListener("click", () => {
      qsa(".deposit-networks .net").forEach(n => n.classList.remove("active"));
      net.classList.add("active");
      qs("#networkName").innerText = net.innerText;
      Deposit.enableButton();
      qs("#warningDefault").style.display = "none";
      qs("#warningNetwork").style.display = "block";
    });
  });

  qs("#depositGenerateBtn")?.addEventListener("click", () =>
    Deposit.generateAddress()
  );

  qs("#copyDepositAddress")?.addEventListener("click", () =>
    navigator.clipboard.writeText(qs("#depositAddress").value)
  );

  /* =======================
     WITHDRAW INPUTS
  ======================= */
  qs("#withdrawAmount")?.addEventListener("input", () =>
    Withdraw.updateAmounts()
  );
  qs("#commissionToggle")?.addEventListener("change", () =>
    Withdraw.updateAmounts()
  );

})();

