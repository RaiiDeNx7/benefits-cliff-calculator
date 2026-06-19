(function () {
  "use strict";

  const COUNT_MAX = 8;
  const HOUSEHOLD_SIZE_MAX = 8;

  const BENEFIT_OUTPUT_IDS_CURRENT = [
    "output-cc-subsidy-current",
    "output-eitc-current",
    "output-marketplace-current",
    "output-medicaid-current",
    "output-hcv-current",
    "output-snap-current",
    "output-tanf-max-current",
    "output-wic-current",
  ];

  const BENEFIT_OUTPUT_IDS_NEW = [
    "output-cc-subsidy-new",
    "output-eitc-new",
    "output-marketplace-new",
    "output-medicaid-new",
    "output-hcv-new",
    "output-snap-new",
    "output-tanf-max-new",
    "output-wic-new",
  ];

  /** @param {string} id */
  function $(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error("Missing element: #" + id);
    return el;
  }

  function parseNonNegativeNumber(value) {
    const n = parseFloat(String(value).trim());
    if (Number.isNaN(n) || n < 0) return 0;
    return n;
  }

  function parseOptionalNonNegativeNumber(value) {
    const raw = String(value).trim();
    if (!raw) return null;
    return parseNonNegativeNumber(raw);
  }

  function isRadioYes(name) {
    const el = document.querySelector('input[name="' + name + '"]:checked');
    return el instanceof HTMLInputElement && el.value === "yes";
  }

  function setPanelVisible(panelId, visible) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.toggle("is-hidden", !visible);
    panel.hidden = !visible;
  }

  function updateChildSsiPanel() {
    setPanelVisible(
      "child-ssi-panel",
      isRadioYes("children_disabled") && isRadioYes("child_ssi_income")
    );
  }

  function updateAdultSsiPanel() {
    setPanelVisible(
      "adult-ssi-panel",
      isRadioYes("adults_disabled") && isRadioYes("adult_ssi_income")
    );
  }

  function updateDisabilityPanels() {
    const adultsYes = isRadioYes("adults_disabled");
    setPanelVisible("adult-disability-panel", adultsYes);
    if (!adultsYes) {
      setPanelVisible("adult-ssi-panel", false);
    } else {
      updateAdultSsiPanel();
    }
    const childrenYes = isRadioYes("children_disabled");
    setPanelVisible("child-disability-panel", childrenYes);
    if (!childrenYes) {
      setPanelVisible("child-ssi-panel", false);
    } else {
      updateChildSsiPanel();
    }
  }

  function updateParentSsPanels() {
    setPanelVisible("parent-yes-ss-panel", isRadioYes("parent_yes_ss"));
    setPanelVisible("parent-no-ss-panel", isRadioYes("parent_no_ss"));
  }

  /** TIP D80 — SS of adults who are parents of the children. */
  function getParentYesSocialSecurityMonthly() {
    if (!isRadioYes("parent_yes_ss")) return 0;
    const el = document.getElementById("parent-yes-ss-amount");
    if (!(el instanceof HTMLInputElement)) return 0;
    const amount = parseOptionalNonNegativeNumber(el.value);
    return amount !== null ? amount : 0;
  }

  /** TIP D86 — SS of adults who are not parents of the children. */
  function getParentNoSocialSecurityMonthly() {
    if (!isRadioYes("parent_no_ss")) return 0;
    const el = document.getElementById("parent-no-ss-amount");
    if (!(el instanceof HTMLInputElement)) return 0;
    const amount = parseOptionalNonNegativeNumber(el.value);
    return amount !== null ? amount : 0;
  }

  /** SNAP E209 and other paths that sum D80 + D86. */
  function getMonthlySocialSecurityTotal() {
    return getParentYesSocialSecurityMonthly() + getParentNoSocialSecurityMonthly();
  }

  /** TANF-VIEW L/T for child care and HCV linkage (from calculated TANF paths). */
  function getTanfPathLTForLinkage() {
    if (typeof computeTanfViewRowLT !== "function") return { tanfL: 0, tanfT: 0 };
    const p = buildTanfParams(monthlyEarnedCurrentDollars());
    const row = computeTanfViewRowLT(p);
    const tanfCb = getTanfCheckboxes().tanf;
    const tanfViewCb = getTanfCheckboxes().tanfView;
    return {
      tanfL: tanfCb && tanfCb.checked ? Math.max(0, row.L) : 0,
      tanfT: tanfViewCb && tanfViewCb.checked ? Math.max(0, row.T) : 0,
    };
  }

  function getChildSsiMonthlyTotal() {
    if (!isRadioYes("children_disabled") || !isRadioYes("child_ssi_income")) return 0;
    const el = document.getElementById("child-ssi-total-monthly");
    return el instanceof HTMLInputElement ? parseNonNegativeNumber(el.value) : 0;
  }

  function getAdultSsiMonthlyTotal() {
    if (!isRadioYes("adults_disabled") || !isRadioYes("adult_ssi_income")) return 0;
    const el = document.getElementById("adult-ssi-total-monthly");
    return el instanceof HTMLInputElement ? parseNonNegativeNumber(el.value) : 0;
  }

  function getAllSsiMonthlyTotal() {
    return getChildSsiMonthlyTotal() + getAdultSsiMonthlyTotal();
  }

  function refreshBenefitIncomeFromForm() {
    updateChildCareSubsidyOutputs();
    updateHcvOutputs();
    updateSnapOutputs();
    updateTanfOutputs();
    updateWicOutputs();
    updateAggregateOutputs();
  }

  function snapUtilityStandardMonthly(householdSize) {
    const hh = Math.max(1, Math.min(8, Math.floor(Number(householdSize)) || 1));
    const table = { 1: 375, 2: 375, 3: 375, 4: 476, 5: 475, 6: 476, 7: 476, 8: 476 };
    return table[hh] || 0;
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /** Summary totals: exact cents (no rounding to whole dollars). */
  function formatAggregateAmount(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /** EITC/12 — two decimals to match typical monthly split of annual credit. */
  function formatEitcMonthly(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /** Medicaid N212/N214 can be half-dollars (Program spend rates). */
  function formatMedicaidMonthly(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /** TANF-VIEW L/T and MAX(L,T) — cents to match workbook (e.g. 249.80). */
  function formatTanfMonthly(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /** HCV Q209/Q211 — cents to match workbook display (e.g. 1266.06). */
  function formatHcvMonthly(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function filingIsMarriedJointly() {
    const el = document.querySelector('input[name="tax_filing_status"]:checked');
    return el instanceof HTMLInputElement && el.value === "mfj";
  }

  function initLocalitySelect() {
    const select = $("locality");
    const frag = document.createDocumentFragment();
    for (const name of LOCALITIES) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      frag.appendChild(opt);
    }
    select.appendChild(frag);
  }

  function initBenefitCheckboxes() {
    const container = $("benefits-checkboxes");
    container.innerHTML = "";
    for (const prog of BENEFIT_PROGRAMS) {
      const wrap = document.createElement("div");
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "benefits";
      input.value = prog.id;
      input.id = "benefit-" + prog.id;
      if (prog.id === "hcv") input.dataset.hcv = "1";
      if (prog.id === "tanf") input.dataset.tanfPair = "tanf_view";
      if (prog.id === "tanf_view") input.dataset.tanfPair = "tanf";
      label.appendChild(input);
      label.appendChild(document.createTextNode(prog.label));
      wrap.appendChild(label);
      container.appendChild(wrap);
    }
  }

  function getHcvCheckbox() {
    return document.getElementById("benefit-hcv");
  }

  function getTanfCheckboxes() {
    return {
      tanf: document.getElementById("benefit-tanf"),
      tanfView: document.getElementById("benefit-tanf_view"),
    };
  }

  function getEitcCheckbox() {
    return document.getElementById("benefit-eitc");
  }

  function getChildCareSubsidyCheckbox() {
    return document.getElementById("benefit-child_care_subsidy");
  }

  function getMarketplaceCheckbox() {
    return document.getElementById("benefit-marketplace");
  }

  function getMedicaidCheckbox() {
    return document.getElementById("benefit-medicaid");
  }

  function getWicCheckbox() {
    return document.getElementById("benefit-wic");
  }

  function getSnapCheckbox() {
    return document.getElementById("benefit-snap");
  }

  function getWicEligiblePersonCount() {
    const c = getChildCareCountsFromForm();
    return c.infant + c.toddler + c.two + c.preschool;
  }

  /** Adults who answered Yes to "Parent of any children listed below?" (TANF-VIEW C4 / D6 path). */
  function getTanfParentYesCountFromForm() {
    const n = clampCount($("num-adults").value);
    let explicitYes = 0;
    for (let i = 0; i < n; i++) {
      const el = document.querySelector(
        'input[name="adult_parent_' + i + '"]:checked'
      );
      if (el instanceof HTMLInputElement && el.value === "yes") explicitYes += 1;
    }
    if (explicitYes > 0) return explicitYes;

    // Workbook / meeting notes: when parent radios are unset (default No), infer from age.
    let under62 = 0;
    let elderly62Plus = 0;
    for (let i = 0; i < n; i++) {
      const ageEl = document.getElementById("adult-age-" + i);
      const age = ageEl ? Math.floor(parseNonNegativeNumber(ageEl.value)) : 0;
      if (age >= 62) elderly62Plus += 1;
      else if (age > 0 && age < 62) under62 += 1;
    }
    if (under62 > 0) return under62;
    if (elderly62Plus > 0 && elderly62Plus < n) return n - elderly62Plus;

    const parentYesIncome = parseNonNegativeNumber($("parent-yes-current").value);
    if (parentYesIncome > 0 && n > 0) {
      return Math.max(1, n - elderly62Plus);
    }
    return 0;
  }

  /** TIP D66 — disabled children excluded from TANF assistance unit. */
  function getTipD66ChildrenNotInTanfAuFromForm() {
    if (!isRadioYes("children_disabled")) return 0;
    const children = clampCount($("num-children").value);
    const el = document.getElementById("disabled-children-count");
    const disabled =
      el instanceof HTMLInputElement ? clampCount(el.value) : 0;
    return Math.min(disabled, children);
  }

  /** TIP D61 — non-parent adults excluded from TANF AU parent count (beyond first). */
  function getTipD61FromForm() {
    const numAdults = clampCount($("num-adults").value);
    const parentYesCount = getTanfParentYesCountFromForm();
    if (parentYesCount === 0) return 0;

    // Workbook: only non-elderly (under 62) non-parent adults count toward D61.
    let nonParentUnder62 = 0;
    let anyExplicitParentYes = false;
    for (let i = 0; i < numAdults; i++) {
      const parentEl = document.querySelector(
        'input[name="adult_parent_' + i + '"]:checked'
      );
      const isParent =
        parentEl instanceof HTMLInputElement && parentEl.value === "yes";
      if (isParent) {
        anyExplicitParentYes = true;
        continue;
      }
      const ageEl = document.getElementById("adult-age-" + i);
      const age = ageEl ? Math.floor(parseNonNegativeNumber(ageEl.value)) : 0;
      if (age > 0 && age < 62) nonParentUnder62 += 1;
    }
    if (!anyExplicitParentYes) {
      let under62 = 0;
      for (let i = 0; i < numAdults; i++) {
        const ageEl = document.getElementById("adult-age-" + i);
        const age = ageEl ? Math.floor(parseNonNegativeNumber(ageEl.value)) : 0;
        if (age > 0 && age < 62) under62 += 1;
      }
      nonParentUnder62 = Math.max(0, under62 - parentYesCount);
    }

    let tipD61 = Math.max(0, nonParentUnder62 - 1);
    tipD61 = Math.min(tipD61, parentYesCount - 1);
    return tipD61;
  }

  function buildTanfParams(monthlyEarned) {
    const locality = $("locality").value;
    const a3 =
      typeof getTanfRegionGroupForLocality === "function"
        ? getTanfRegionGroupForLocality(locality)
        : 1;
    const children = clampCount($("num-children").value);
    const tanfCb = document.getElementById("benefit-tanf");
    const tanfViewCb = document.getElementById("benefit-tanf_view");
    return {
      monthlyEarned: monthlyEarned,
      monthlySS: getParentYesSocialSecurityMonthly(),
      tanfParentYesCount: getTanfParentYesCountFromForm(),
      tipD61: getTipD61FromForm(),
      tipD66ChildrenNotInTanfAu: getTipD66ChildrenNotInTanfAuFromForm(),
      tipB31Children: children,
      tanfRegionGroupA3: a3,
      tanfSelected: !!(tanfCb && tanfCb.checked),
      tanfViewSelected: !!(tanfViewCb && tanfViewCb.checked),
    };
  }

  /** WIC column D: both TANF-VIEW rows use current packaged earned (B90) in the workbook. */
  function buildTanfParamsForWic() {
    return buildTanfParams(monthlyEarnedCurrentDollars());
  }

  function getAdultAgesFromForm() {
    const ages = [];
    const n = clampCount($("num-adults").value);
    for (let i = 0; i < 8; i++) {
      if (i < n) {
        const el = document.getElementById("adult-age-" + i);
        ages.push(el ? Math.floor(parseNonNegativeNumber(el.value)) : 0);
      } else {
        ages.push(0);
      }
    }
    return ages;
  }

  function getChildCareCountsFromForm() {
    const counts = {
      infant: 0,
      toddler: 0,
      two: 0,
      preschool: 0,
      school: 0,
      teenIncapable: 0,
    };
    document.querySelectorAll("[id^=\"child-band-\"]").forEach(function (sel) {
      if (!(sel instanceof HTMLSelectElement)) return;
      const v = sel.value;
      if (v === "infant") counts.infant += 1;
      else if (v === "toddler") counts.toddler += 1;
      else if (v === "two") counts.two += 1;
      else if (v === "preschool") counts.preschool += 1;
      else if (v === "school_age") counts.school += 1;
      else if (v === "teen_incapable") counts.teenIncapable += 1;
    });
    return counts;
  }

  function monthlyEarnedCurrentDollars() {
    const yc = parseNonNegativeNumber($("parent-yes-current").value);
    const nc = parseNonNegativeNumber($("parent-no-current").value);
    return Math.ceil(yc) + Math.ceil(nc);
  }

  function monthlyEarnedNewDollars() {
    const yn = parseNonNegativeNumber($("parent-yes-new").value);
    const nn = parseNonNegativeNumber($("parent-no-new").value);
    return Math.ceil(yn) + Math.ceil(nn);
  }

  /** Exact earned income for aggregate resources (no ceil). */
  function monthlyEarnedCurrentExact() {
    const yc = parseNonNegativeNumber($("parent-yes-current").value);
    const nc = parseNonNegativeNumber($("parent-no-current").value);
    return yc + nc;
  }

  function monthlyEarnedNewExact() {
    const yn = parseNonNegativeNumber($("parent-yes-new").value);
    const nn = parseNonNegativeNumber($("parent-no-new").value);
    return yn + nn;
  }

  function parseDisplayedCurrency(text) {
    const t = String(text).trim();
    if (!t || t === "\u2014" || t === "—") return 0;
    const n = parseFloat(t.replace(/[^0-9.-]/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }

  function sumBenefitOutputs(ids) {
    let sum = 0;
    for (let i = 0; i < ids.length; i++) {
      const el = document.getElementById(ids[i]);
      if (el) sum += parseDisplayedCurrency(el.textContent);
    }
    return sum;
  }

  function updateAggregateOutputs() {
    const benefitsCur = sumBenefitOutputs(BENEFIT_OUTPUT_IDS_CURRENT);
    const benefitsNew = sumBenefitOutputs(BENEFIT_OUTPUT_IDS_NEW);
    const incomeCur = monthlyEarnedCurrentExact();
    const incomeNew = monthlyEarnedNewExact();
    $("output-benefits-total-current").textContent = formatAggregateAmount(benefitsCur);
    $("output-benefits-total-new").textContent = formatAggregateAmount(benefitsNew);
    $("output-resources-current").textContent = formatAggregateAmount(
      benefitsCur + incomeCur
    );
    $("output-resources-new").textContent = formatAggregateAmount(benefitsNew + incomeNew);
  }

  function updateHcvPanel() {
    const hcv = getHcvCheckbox();
    const panel = $("hcv-panel");
    const bedrooms = $("hcv-bedrooms");
    if (!hcv || !panel || !bedrooms) return;
    const on = hcv.checked;
    panel.classList.toggle("is-hidden", !on);
    panel.hidden = !on;
    bedrooms.required = on;
    if (!on) {
      bedrooms.value = "";
    }
    updateHcvOutputs();
  }

  function onBenefitChange(ev) {
    const target = ev.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;

    if (target.dataset.tanfPair) {
      const otherId = "benefit-" + target.dataset.tanfPair;
      const other = document.getElementById(otherId);
      if (target.checked && other instanceof HTMLInputElement) {
        other.checked = false;
      }
    }

    if (target.dataset.hcv === "1" || target.id === "benefit-hcv") {
      updateHcvPanel();
    }

    updateEitcTaxWarning();
    updateChildCareSubsidyOutputs();
    updateEitcOutputs();
    updateMarketplaceOutputs();
    updateMedicaidOutputs();
    updateHcvOutputs();
    updateSnapOutputs();
    updateTanfOutputs();
    updateWicOutputs();
  }

  function updateEitcTaxWarning() {
    const eitc = getEitcCheckbox();
    const warning = $("eitc-tax-warning");
    if (!eitc || !warning) return;
    const statusSelected = document.querySelector('input[name="tax_filing_status"]:checked');
    if (eitc.checked && !statusSelected) {
      warning.textContent =
        "EITC is selected: choose a tax filing status above for accurate EITC treatment.";
      warning.classList.remove("is-hidden");
    } else {
      warning.textContent = "";
      warning.classList.add("is-hidden");
    }
  }

  function clampCount(raw) {
    let n = parseInt(String(raw), 10);
    if (Number.isNaN(n) || n < 0) n = 0;
    if (n > COUNT_MAX) n = COUNT_MAX;
    return n;
  }

  function updateTotalPeople() {
    const adults = clampCount($("num-adults").value);
    const children = clampCount($("num-children").value);
    $("total-people").value = String(adults + children);
  }

  function renderAdultRows() {
    const n = clampCount($("num-adults").value);
    const container = $("adult-rows");
    container.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const card = document.createElement("div");
      card.className = "dynamic-card";
      card.innerHTML =
        "<h3>Adult " +
        (i + 1) +
        "</h3>" +
        '<div class="field-row-inner">' +
        '<div class="field">' +
        '<label for="adult-age-' +
        i +
        '">Age</label>' +
        '<input type="number" id="adult-age-' +
        i +
        '" name="adult_age_' +
        i +
        '" min="0" max="120" step="1" />' +
        "</div>" +
        '<div class="field">' +
        '<span class="label-like" id="adult-parent-label-' +
        i +
        '">Parent of any children listed below?</span>' +
        '<div class="radio-row" role="group" aria-labelledby="adult-parent-label-' +
        i +
        '">' +
        '<label><input type="radio" name="adult_parent_' +
        i +
        '" value="yes" /> Yes</label>' +
        '<label><input type="radio" name="adult_parent_' +
        i +
        '" value="no" checked /> No</label>' +
        "</div>" +
        "</div>" +
        "</div>";
      container.appendChild(card);
    }
  }

  function renderChildRows() {
    const n = clampCount($("num-children").value);
    const container = $("child-rows");
    container.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const card = document.createElement("div");
      card.className = "dynamic-card";
      const h3 = document.createElement("h3");
      h3.textContent = "Child " + (i + 1);
      const field = document.createElement("div");
      field.className = "field";
      const label = document.createElement("label");
      label.htmlFor = "child-band-" + i;
      label.textContent = "Age category";
      const select = document.createElement("select");
      select.id = "child-band-" + i;
      select.name = "child_band_" + i;
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "Select…";
      select.appendChild(empty);
      for (const band of CHILD_AGE_BANDS) {
        const opt = document.createElement("option");
        opt.value = band.value;
        opt.textContent = band.label;
        select.appendChild(opt);
      }
      field.appendChild(label);
      field.appendChild(select);
      card.appendChild(h3);
      card.appendChild(field);
      container.appendChild(card);
    }
  }

  function enforceHouseholdTotalCap() {
    const adultsEl = $("num-adults");
    const childrenEl = $("num-children");
    let adults = clampCount(adultsEl.value);
    let children = clampCount(childrenEl.value);
    if (adults > HOUSEHOLD_SIZE_MAX) adults = HOUSEHOLD_SIZE_MAX;
    if (adults + children > HOUSEHOLD_SIZE_MAX) {
      children = Math.max(0, HOUSEHOLD_SIZE_MAX - adults);
    }
    adultsEl.value = String(adults);
    childrenEl.value = String(children);
  }

  function syncCountInputs() {
    enforceHouseholdTotalCap();
  }

  function onHouseholdCountChange() {
    syncCountInputs();
    updateTotalPeople();
    renderAdultRows();
    renderChildRows();
    updateChildCareSubsidyOutputs();
    updateEitcOutputs();
    updateMarketplaceOutputs();
    updateMedicaidOutputs();
    updateHcvOutputs();
    updateSnapOutputs();
    updateTanfOutputs();
    updateWicOutputs();
    updateAggregateOutputs();
  }

  function updateUtilityFieldState() {
    const method = document.querySelector('input[name="utility_method"]:checked');
    const input = $("utility-expenses");
    const hint = $("utility-expenses-hint");
    if (!method || !input || !hint) return;
    const isSua = method.value === "sua";
    input.disabled = isSua;
    if (isSua) {
      hint.textContent =
        "Standard Utility Allowance (SUA) uses a standard amount in benefit rules; monthly utility expenses are not used the same way as actual costs.";
    } else {
      hint.textContent =
        "Enter your total actual monthly utility costs when using actual costs.";
    }
    updateHcvOutputs();
    updateSnapOutputs();
    updateAggregateOutputs();
  }

  function updateIncomeTotals() {
    const yc = parseNonNegativeNumber($("parent-yes-current").value);
    const yn = parseNonNegativeNumber($("parent-yes-new").value);
    const nc = parseNonNegativeNumber($("parent-no-current").value);
    const nn = parseNonNegativeNumber($("parent-no-new").value);
    const totalCurrent = Math.ceil(yc) + Math.ceil(nc);
    const totalNew = Math.ceil(yn) + Math.ceil(nn);
    $("output-total-current").textContent = formatCurrency(totalCurrent);
    $("output-total-new").textContent = formatCurrency(totalNew);
    updateChildCareSubsidyOutputs();
    updateEitcOutputs();
    updateMarketplaceOutputs();
    updateMedicaidOutputs();
    updateHcvOutputs();
    updateSnapOutputs();
    updateTanfOutputs();
    updateWicOutputs();
    updateAggregateOutputs();
  }

  function updateChildCareSubsidyOutputs() {
    try {
    const outCur = $("output-cc-subsidy-current");
    const outNew = $("output-cc-subsidy-new");
    const ccCb = getChildCareSubsidyCheckbox();
    if (
      typeof computeChildCareSubsidyMonthly !== "function" ||
      !ccCb
    ) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }

    if (!ccCb.checked) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }

    const locality = $("locality").value;
    const householdSize = clampCount($("num-adults").value) + clampCount($("num-children").value);
    const counts = getChildCareCountsFromForm();
    const tanfPath = getTanfPathLTForLinkage();

    const base = {
      childCareSelected: true,
      locality: locality,
      householdSize: householdSize,
      counts: counts,
      monthlySocialSecurity: getParentYesSocialSecurityMonthly(),
      tanfPathL: tanfPath.tanfL,
      tanfPathT: tanfPath.tanfT,
    };

    const cur = computeChildCareSubsidyMonthly(
      Object.assign({}, base, { monthlyEarned: monthlyEarnedCurrentDollars() })
    );
    const neu = computeChildCareSubsidyMonthly(
      Object.assign({}, base, { monthlyEarned: monthlyEarnedNewDollars() })
    );

    outCur.textContent = formatAggregateAmount(Math.max(0, cur));
    outNew.textContent = formatAggregateAmount(Math.max(0, neu));
    } finally {
      updateAggregateOutputs();
    }
  }

  function updateEitcOutputs() {
    try {
    const outCur = $("output-eitc-current");
    const outNew = $("output-eitc-new");
    const eitcCb = getEitcCheckbox();
    if (typeof computeEitcMonthlyFromMonthlyEarned !== "function" || !eitcCb) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }
    if (!eitcCb.checked) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }

    const numChildren = clampCount($("num-children").value);
    const mfj = filingIsMarriedJointly();
    const base = {
      numChildren: numChildren,
      filingMarriedJointly: mfj,
      eitcEnabled: true,
    };

    const cur = computeEitcMonthlyFromMonthlyEarned(
      Object.assign({}, base, { monthlyEarned: monthlyEarnedCurrentDollars() })
    );
    const neu = computeEitcMonthlyFromMonthlyEarned(
      Object.assign({}, base, { monthlyEarned: monthlyEarnedNewDollars() })
    );

    outCur.textContent = formatEitcMonthly(Math.max(0, cur));
    outNew.textContent = formatEitcMonthly(Math.max(0, neu));
    } finally {
      updateAggregateOutputs();
    }
  }

  function updateMarketplaceOutputs() {
    try {
    const outCur = $("output-marketplace-current");
    const outNew = $("output-marketplace-new");
    const mpCb = getMarketplaceCheckbox();
    if (typeof computeMarketplaceSubsidyMonthlyL !== "function" || !mpCb) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }
    if (!mpCb.checked) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }

    const locality = $("locality").value;
    const householdSize = clampCount($("num-adults").value) + clampCount($("num-children").value);
    const adultAges = getAdultAgesFromForm();
    const base = {
      marketplaceSelected: true,
      locality: locality,
      householdSize: householdSize,
      adultAges: adultAges,
    };

    const cur = computeMarketplaceSubsidyMonthlyL(
      Object.assign({}, base, { monthlyEarned: monthlyEarnedCurrentDollars() })
    );
    const neu = computeMarketplaceSubsidyMonthlyL(
      Object.assign({}, base, { monthlyEarned: monthlyEarnedNewDollars() })
    );

    outCur.textContent = formatCurrency(Math.max(0, cur));
    outNew.textContent = formatCurrency(Math.max(0, neu));
    } finally {
      updateAggregateOutputs();
    }
  }

  function updateMedicaidOutputs() {
    try {
    const outCur = $("output-medicaid-current");
    const outNew = $("output-medicaid-new");
    const mcCb = getMedicaidCheckbox();
    if (typeof computeMedicaidMonthlyN !== "function" || !mcCb) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }
    if (!mcCb.checked) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }

    const adults = clampCount($("num-adults").value);
    const children = clampCount($("num-children").value);
    const householdSize = adults + children;
    const base = {
      medicaidSelected: true,
      householdSize: householdSize,
      numAdults: adults,
      numChildren: children,
    };

    const cur = computeMedicaidMonthlyN(
      Object.assign({}, base, { monthlyEarned: monthlyEarnedCurrentDollars() })
    );
    const neu = computeMedicaidMonthlyN(
      Object.assign({}, base, { monthlyEarned: monthlyEarnedNewDollars() })
    );

    outCur.textContent = formatMedicaidMonthly(Math.max(0, cur));
    outNew.textContent = formatMedicaidMonthly(Math.max(0, neu));
    } finally {
      updateAggregateOutputs();
    }
  }

  function updateHcvOutputs() {
    try {
    const outCur = $("output-hcv-current");
    const outNew = $("output-hcv-new");
    const hcvCb = getHcvCheckbox();
    if (typeof computeHcvProgramMonthlyQ !== "function" || !hcvCb) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }
    if (!hcvCb.checked) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }

    const bedroomsEl = $("hcv-bedrooms");
    const bedrooms = bedroomsEl instanceof HTMLSelectElement ? bedroomsEl.value : "";
    if (!bedrooms) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }

    const locality = $("locality").value;
    const adults = clampCount($("num-adults").value);
    const children = clampCount($("num-children").value);
    const householdSize = adults + children;
    const tanfPath = getTanfPathLTForLinkage();
    const shelterMonthly = parseNonNegativeNumber($("shelter-expenses").value);
    const methodEl = document.querySelector('input[name="utility_method"]:checked');
    const isActualUtility =
      methodEl instanceof HTMLInputElement && methodEl.value === "actual";
    const utilityInput = $("utility-expenses");
    const utilityMonthly =
      isActualUtility && !utilityInput.disabled
        ? parseNonNegativeNumber(utilityInput.value)
        : 0;
    const base = {
      hcvSelected: true,
      locality: locality,
      householdSize: householdSize,
      numDependents: children,
      adultAges: getAdultAgesFromForm(),
      monthlySocialSecurity: getParentYesSocialSecurityMonthly(),
      monthlySsi: getAllSsiMonthlyTotal(),
      tanfL: tanfPath.tanfL,
      tanfT: tanfPath.tanfT,
      bedrooms: parseInt(bedrooms, 10),
      shelterMonthly: shelterMonthly,
      utilityMonthly: utilityMonthly,
      snapUtilityAllowanceMonthly: snapUtilityStandardMonthly(householdSize),
    };

    const cur = computeHcvProgramMonthlyQ(
      Object.assign({}, base, { monthlyEarned: monthlyEarnedCurrentDollars() })
    );
    const neu = computeHcvProgramMonthlyQ(
      Object.assign({}, base, { monthlyEarned: monthlyEarnedNewDollars() })
    );

    outCur.textContent = formatHcvMonthly(Math.max(0, cur));
    outNew.textContent = formatHcvMonthly(Math.max(0, neu));
    } finally {
      updateAggregateOutputs();
    }
  }

  function updateSnapOutputs() {
    try {
    const outCur = $("output-snap-current");
    const outNew = $("output-snap-new");
    const snapCb = getSnapCheckbox();
    if (typeof computeSnapV !== "function" || !snapCb) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }
    if (!snapCb.checked) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }

    const adults = clampCount($("num-adults").value);
    const children = clampCount($("num-children").value);
    const tanfBase = buildTanfParams(monthlyEarnedCurrentDollars());
    const methodEl = document.querySelector('input[name="utility_method"]:checked');
    const utilityMethod =
      methodEl instanceof HTMLInputElement && methodEl.value === "actual" ? "actual" : "sua";
    const elderlyAdults = getAdultAgesFromForm().filter(function (age) {
      return age >= 60;
    }).length;

    const base = {
      snapSelected: true,
      householdSizeSnap: adults + children,
      monthlyEarnedTanfB: monthlyEarnedCurrentDollars(),
      monthlySS: getParentYesSocialSecurityMonthly(),
      countableUnearnedOther: getParentNoSocialSecurityMonthly(),
      shelterMonthly: parseNonNegativeNumber($("shelter-expenses").value),
      utilityMethod: utilityMethod,
      utilityMonthly: parseNonNegativeNumber($("utility-expenses").value),
      elderlyAdultsSnapCount: elderlyAdults,
      disabilitySupportIncomeSnap: getAllSsiMonthlyTotal(),
      tanfAnnualForSnapC205: 99500,
      tanfCaretakerDisabledYesCount: tanfBase.tanfParentYesCount || 0,
      tanfParentYesCount: tanfBase.tanfParentYesCount || 0,
      tipD61: tanfBase.tipD61 || 0,
      tipD66ChildrenNotInTanfAu: tanfBase.tipD66ChildrenNotInTanfAu || 0,
      tipB31Children: children,
      tanfRegionGroupA3: tanfBase.tanfRegionGroupA3 || 1,
      tanfSelected: !!tanfBase.tanfSelected,
      tanfViewSelected: !!tanfBase.tanfViewSelected,
    };

    const cur = computeSnapV(Object.assign({}, base, { monthlyEarnedSnapD: monthlyEarnedCurrentDollars() }));
    const neu = computeSnapV(Object.assign({}, base, { monthlyEarnedSnapD: monthlyEarnedNewDollars() }));

    outCur.textContent = formatCurrency(Math.max(0, cur));
    outNew.textContent = formatCurrency(Math.max(0, neu));
    } finally {
      updateAggregateOutputs();
    }
  }

  function updateTanfOutputs() {
    try {
    const outMaxCur = $("output-tanf-max-current");
    const outMaxNew = $("output-tanf-max-new");
    const { tanf: tanfCb, tanfView: tanfViewCb } = getTanfCheckboxes();
    const tanfBenefitSelected =
      (tanfCb && tanfCb.checked) || (tanfViewCb && tanfViewCb.checked);

    if (typeof computeTanfMaxLT !== "function") {
      outMaxCur.textContent = "—";
      outMaxNew.textContent = "—";
      return;
    }

    const earnedCur = monthlyEarnedCurrentDollars();
    // Workbook B212 and B214 both use Total income package B90 (current earned), not B91.
    const pCur = buildTanfParams(earnedCur);
    const pNew = buildTanfParams(earnedCur);
    const maxCur = Math.max(0, computeTanfMaxLT(pCur));
    const maxNew = Math.max(0, computeTanfMaxLT(pNew));

    if (tanfBenefitSelected) {
      outMaxCur.textContent = formatTanfMonthly(Math.max(0, maxCur));
      outMaxNew.textContent = formatTanfMonthly(Math.max(0, maxNew));
    } else {
      outMaxCur.textContent = "—";
      outMaxNew.textContent = "—";
    }
    } finally {
      updateChildCareSubsidyOutputs();
      updateHcvOutputs();
      updateAggregateOutputs();
    }
  }

  function updateWicOutputs() {
    try {
    const outCur = $("output-wic-current");
    const outNew = $("output-wic-new");
    const wicCb = getWicCheckbox();
    if (
      typeof computeWicMonthlyF !== "function" ||
      typeof computeTanfMaxLT !== "function" ||
      !wicCb
    ) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }
    if (!wicCb.checked) {
      outCur.textContent = "—";
      outNew.textContent = "—";
      return;
    }

    const adults = clampCount($("num-adults").value);
    const children = clampCount($("num-children").value);
    const householdSize = adults + children;
    const tanfMax = Math.max(0, computeTanfMaxLT(buildTanfParamsForWic()));
    const wicH2 = getParentYesSocialSecurityMonthly();
    const wicG = getWicEligiblePersonCount();
    const earnedCur = monthlyEarnedCurrentDollars();
    const earnedNew = monthlyEarnedNewDollars();

    const wicCur = computeWicMonthlyF({
      wicSelected: true,
      householdSizeWic: householdSize,
      monthlyEarnedWicB: earnedCur,
      wicUnearnedH2: wicH2,
      tanfMaxLTForWicD: tanfMax,
      wicEligiblePersonCount: wicG,
    });
    const wicNeu = computeWicMonthlyF({
      wicSelected: true,
      householdSizeWic: householdSize,
      monthlyEarnedWicB: earnedNew,
      wicUnearnedH2: wicH2,
      tanfMaxLTForWicD: tanfMax,
      wicEligiblePersonCount: wicG,
    });

    outCur.textContent = formatMedicaidMonthly(Math.max(0, wicCur));
    outNew.textContent = formatMedicaidMonthly(Math.max(0, wicNeu));
    } finally {
      updateAggregateOutputs();
    }
  }

  function refreshCalculatorAfterInputChange() {
    updateDisabilityPanels();
    updateParentSsPanels();
    updateHcvPanel();
    syncCountInputs();
    onHouseholdCountChange();
    updateUtilityFieldState();
    updateIncomeTotals();
    updateEitcTaxWarning();
  }

  function resetFormToDefaults() {
    $("calculator-form").reset();
    $("benefits-checkboxes")
      .querySelectorAll('input[type="checkbox"]')
      .forEach(function (cb) {
        if (cb instanceof HTMLInputElement) cb.checked = false;
      });
    refreshCalculatorAfterInputChange();
  }

  function bindFormListeners() {
    const resetBtn = document.getElementById("reset-form");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetFormToDefaults);
    }

    $("num-adults").addEventListener("input", onHouseholdCountChange);
    $("num-adults").addEventListener("change", onHouseholdCountChange);
    $("num-children").addEventListener("input", onHouseholdCountChange);
    $("num-children").addEventListener("change", onHouseholdCountChange);

    $("benefits-checkboxes").addEventListener("change", onBenefitChange);

    document.querySelectorAll('input[name="utility_method"]').forEach(function (el) {
      el.addEventListener("change", updateUtilityFieldState);
    });

    document.querySelectorAll('input[name="tax_filing_status"]').forEach(function (el) {
      el.addEventListener("change", updateEitcTaxWarning);
      el.addEventListener("change", updateEitcOutputs);
    });

    document.querySelectorAll('input[name="adults_disabled"]').forEach(function (el) {
      el.addEventListener("change", updateDisabilityPanels);
    });
    document.querySelectorAll('input[name="children_disabled"]').forEach(function (el) {
      el.addEventListener("change", function () {
        updateDisabilityPanels();
        refreshBenefitIncomeFromForm();
      });
    });
    document.querySelectorAll('input[name="child_ssi_income"]').forEach(function (el) {
      el.addEventListener("change", function () {
        updateChildSsiPanel();
        refreshBenefitIncomeFromForm();
      });
    });
    document.querySelectorAll('input[name="adult_ssi_income"]').forEach(function (el) {
      el.addEventListener("change", function () {
        updateAdultSsiPanel();
        refreshBenefitIncomeFromForm();
      });
    });
    document.querySelectorAll('input[name="parent_yes_ss"]').forEach(function (el) {
      el.addEventListener("change", function () {
        updateParentSsPanels();
        refreshBenefitIncomeFromForm();
      });
    });
    document.querySelectorAll('input[name="parent_no_ss"]').forEach(function (el) {
      el.addEventListener("change", function () {
        updateParentSsPanels();
        refreshBenefitIncomeFromForm();
      });
    });

    [
      "disabled-adult-head-spouse",
      "disabled-adult-non-elderly-not-head",
      "disabled-adult-elderly",
      "disabled-children-count",
      "adult-ssi-parent-count",
      "adult-ssi-recipients",
      "adult-ssi-total-monthly",
      "child-ssi-recipients",
      "child-ssi-total-monthly",
      "parent-yes-ss-amount",
      "parent-no-ss-amount",
    ].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", refreshBenefitIncomeFromForm);
      el.addEventListener("change", refreshBenefitIncomeFromForm);
    });

    ["parent-yes-current", "parent-yes-new", "parent-no-current", "parent-no-new"].forEach(function (
      id
    ) {
      $(id).addEventListener("input", updateIncomeTotals);
      $(id).addEventListener("change", updateIncomeTotals);
    });

    $("locality").addEventListener("change", updateChildCareSubsidyOutputs);
    $("locality").addEventListener("change", updateMarketplaceOutputs);
    $("locality").addEventListener("change", updateHcvOutputs);
    $("locality").addEventListener("change", updateSnapOutputs);
    $("locality").addEventListener("change", updateTanfOutputs);
    $("locality").addEventListener("change", updateWicOutputs);
    $("hcv-bedrooms").addEventListener("change", updateHcvOutputs);

    $("shelter-expenses").addEventListener("input", updateHcvOutputs);
    $("shelter-expenses").addEventListener("change", updateHcvOutputs);
    $("shelter-expenses").addEventListener("input", updateSnapOutputs);
    $("shelter-expenses").addEventListener("change", updateSnapOutputs);
    $("utility-expenses").addEventListener("input", updateHcvOutputs);
    $("utility-expenses").addEventListener("change", updateHcvOutputs);
    $("utility-expenses").addEventListener("input", updateSnapOutputs);
    $("utility-expenses").addEventListener("change", updateSnapOutputs);

    $("child-rows").addEventListener("change", updateChildCareSubsidyOutputs);
    $("child-rows").addEventListener("change", updateMedicaidOutputs);
    $("child-rows").addEventListener("change", updateHcvOutputs);
    $("child-rows").addEventListener("change", updateTanfOutputs);
    $("child-rows").addEventListener("change", updateWicOutputs);

    $("adult-rows").addEventListener("input", function () {
      updateTanfOutputs();
    });
    $("adult-rows").addEventListener("input", updateMarketplaceOutputs);
    $("adult-rows").addEventListener("change", updateMarketplaceOutputs);
    $("adult-rows").addEventListener("input", updateMedicaidOutputs);
    $("adult-rows").addEventListener("change", updateMedicaidOutputs);
    $("adult-rows").addEventListener("input", updateHcvOutputs);
    $("adult-rows").addEventListener("change", updateHcvOutputs);
    $("adult-rows").addEventListener("input", updateSnapOutputs);
    $("adult-rows").addEventListener("change", updateSnapOutputs);
    $("adult-rows").addEventListener("change", updateTanfOutputs);
    $("adult-rows").addEventListener("change", updateWicOutputs);
    $("adult-rows").addEventListener("change", function (ev) {
      const target = ev.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!/^adult_parent_\d+$/.test(target.name)) return;
      refreshBenefitIncomeFromForm();
    });

    const form = $("calculator-form");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
    });
  }

  function init() {
    if (typeof LOCALITIES === "undefined" || typeof BENEFIT_PROGRAMS === "undefined") {
      console.error("data.js must load before app.js");
      return;
    }
    if (typeof CHILD_CARE_LOCALITY_BY_NAME === "undefined") {
      console.warn("childCareLookupData.js missing — child care subsidy outputs disabled.");
    }
    if (typeof EITC_RATES_MFJ === "undefined") {
      console.warn("eitcLookupData.js missing — EITC outputs disabled.");
    }
    if (typeof MARKETPLACE_MONTHLY_FPL_BY_HOUSEHOLD === "undefined") {
      console.warn("marketplaceLookupData.js missing — marketplace subsidy outputs disabled.");
    }
    if (typeof MEDICAID_ADULT_SPEND_MONTHLY === "undefined") {
      console.warn("medicaidLookupData.js missing — Medicaid outputs disabled.");
    }
    if (typeof HCV_BY_LOCALITY === "undefined") {
      console.warn("hcvLookupData.js missing — HCV outputs disabled.");
    }
    if (typeof computeSnapV !== "function") {
      console.warn("snap.js missing — SNAP outputs disabled.");
    }
    if (typeof WIC_INCOME_LIMIT_BY_HH === "undefined") {
      console.warn("snapTanfWicLookupData.js missing — WIC outputs disabled.");
    }
    if (typeof computeTanfMaxLT !== "function") {
      console.warn("tanfView.js missing — TANF outputs disabled.");
    }
    if (typeof computeWicMonthlyF !== "function") {
      console.warn("wic.js missing — WIC outputs disabled.");
    }
    initLocalitySelect();
    initBenefitCheckboxes();
    bindFormListeners();
    refreshCalculatorAfterInputChange();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
