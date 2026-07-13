(function () {
  "use strict";

  const COUNT_MAX = 8;
  const HOUSEHOLD_SIZE_MAX = 8;
  const AGE_MIN = 1;
  const AGE_MAX = 121;

  /** True after the user explicitly picks a tax filing status radio. */
  let taxFilingStatusUserSet = false;

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

  function clampAgeValue(raw) {
    const s = String(raw).trim();
    if (!s) return null;
    let n = Math.floor(parseFloat(s));
    if (Number.isNaN(n)) return null;
    if (n < AGE_MIN) n = AGE_MIN;
    if (n > AGE_MAX) n = AGE_MAX;
    return n;
  }

  /** @returns {number} 0 when age is empty or invalid */
  function parseAgeForCalc(value) {
    const clamped = clampAgeValue(value);
    return clamped != null ? clamped : 0;
  }

  function onAdultAgeFieldCommit(ev) {
    const target = ev.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!/^adult-age-\d+$/.test(target.id)) return;
    const clamped = clampAgeValue(target.value);
    if (clamped != null) target.value = String(clamped);
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

  function taxFilingStatusSelected() {
    return (
      document.querySelector('input[name="tax_filing_status"]:checked') instanceof
      HTMLInputElement
    );
  }

  function filingIsMarriedJointly() {
    const el = document.querySelector('input[name="tax_filing_status"]:checked');
    return el instanceof HTMLInputElement && el.value === "mfj";
  }

  /** Match workbook B72 defaults when household size implies a typical filing status. */
  function syncDefaultTaxFilingStatus() {
    if (taxFilingStatusUserSet) return;
    const adults = clampCount($("num-adults").value);
    const mfj = document.querySelector('input[name="tax_filing_status"][value="mfj"]');
    const single = document.querySelector(
      'input[name="tax_filing_status"][value="single_hoh"]'
    );
    if (!(mfj instanceof HTMLInputElement) || !(single instanceof HTMLInputElement)) return;
    mfj.checked = false;
    single.checked = false;
    if (adults >= 2) mfj.checked = true;
    else if (adults === 1) single.checked = true;
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
    return explicitYes;
  }

  /** SNAP D2 — COUNTIF(TIP adult ages, ">59"). */
  function getSnapElderlyAdultsCountFromForm() {
    return getAdultAgesFromForm().filter(function (age) {
      return age > 59;
    }).length;
  }

  /** SNAP E2 — TIP F59 + D59 + H59 + D64 (disabled member counts, not SSI dollars). */
  function getSnapDisabilityMemberCountFromForm() {
    let n = 0;
    if (isRadioYes("adults_disabled")) {
      const head = document.getElementById("disabled-adult-head-spouse");
      const nonHead = document.getElementById("disabled-adult-non-elderly-not-head");
      const elderly = document.getElementById("disabled-adult-elderly");
      if (head instanceof HTMLInputElement) n += clampCount(head.value);
      if (nonHead instanceof HTMLInputElement) n += clampCount(nonHead.value);
      if (elderly instanceof HTMLInputElement) n += clampCount(elderly.value);
    }
    if (isRadioYes("children_disabled")) {
      const children = clampCount($("num-children").value);
      const el = document.getElementById("disabled-children-count");
      const disabled = el instanceof HTMLInputElement ? clampCount(el.value) : 0;
      n += Math.min(disabled, children);
    }
    return n;
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
    for (let i = 0; i < numAdults; i++) {
      const parentEl = document.querySelector(
        'input[name="adult_parent_' + i + '"]:checked'
      );
      const isParent =
        parentEl instanceof HTMLInputElement && parentEl.value === "yes";
      if (isParent) continue;
      const ageEl = document.getElementById("adult-age-" + i);
      const age = ageEl ? parseAgeForCalc(ageEl.value) : 0;
      if (age > 0 && age < 62) nonParentUnder62 += 1;
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
        ages.push(el ? parseAgeForCalc(el.value) : 0);
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

  function setOutputDelta(deltaEl, currentAmount, newAmount, formatter) {
    if (!deltaEl) return;
    const delta = newAmount - currentAmount;
    deltaEl.classList.remove("output-delta--up", "output-delta--down", "output-delta--same");
    if (delta > 0) {
      deltaEl.textContent = "+" + formatter(delta);
      deltaEl.classList.add("output-delta--up");
    } else if (delta < 0) {
      deltaEl.textContent = "−" + formatter(Math.abs(delta));
      deltaEl.classList.add("output-delta--down");
    } else {
      deltaEl.textContent = formatter(0);
      deltaEl.classList.add("output-delta--same");
    }
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
    setOutputDelta(
      document.getElementById("output-benefits-total-delta"),
      benefitsCur,
      benefitsNew,
      formatAggregateAmount
    );
    setOutputDelta(
      document.getElementById("output-resources-delta"),
      benefitsCur + incomeCur,
      benefitsNew + incomeNew,
      formatAggregateAmount
    );
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
        '" min="' +
        AGE_MIN +
        '" max="' +
        AGE_MAX +
        '" step="1" required />' +
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
    syncDefaultTaxFilingStatus();
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
    if (!method || !input) return;
    input.disabled = method.value === "sua";
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
    setOutputDelta(
      document.getElementById("output-total-delta"),
      totalCurrent,
      totalNew,
      formatCurrency
    );
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
    if (!taxFilingStatusSelected()) {
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
    const base = {
      snapSelected: true,
      householdSizeSnap: adults + children,
      monthlyEarnedTanfB: monthlyEarnedCurrentDollars(),
      monthlySS: getParentYesSocialSecurityMonthly(),
      countableUnearnedOther: getParentNoSocialSecurityMonthly(),
      shelterMonthly: parseNonNegativeNumber($("shelter-expenses").value),
      utilityMethod: utilityMethod,
      utilityMonthly: parseNonNegativeNumber($("utility-expenses").value),
      elderlyAdultsSnapCount: getSnapElderlyAdultsCountFromForm(),
      snapDisabilityMemberCount: getSnapDisabilityMemberCountFromForm(),
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
    taxFilingStatusUserSet = false;
    $("calculator-form").reset();
    $("benefits-checkboxes")
      .querySelectorAll('input[type="checkbox"]')
      .forEach(function (cb) {
        if (cb instanceof HTMLInputElement) cb.checked = false;
      });
    refreshCalculatorAfterInputChange();
  }

  function getSelectedRadioValue(name) {
    const el = document.querySelector('input[name="' + name + '"]:checked');
    return el instanceof HTMLInputElement ? el.value : "";
  }

  function getSelectOptionText(selectId) {
    const sel = document.getElementById(selectId);
    if (!(sel instanceof HTMLSelectElement)) return "";
    const opt = sel.options[sel.selectedIndex];
    return opt ? String(opt.textContent).trim() : "";
  }

  function inputRow(field, value) {
    return ["Inputs", field, value == null ? "" : String(value), "", ""];
  }

  function collectExportInputs() {
    const rows = [];
    const localityText = getSelectOptionText("locality");
    rows.push(inputRow("Locality", localityText || $("locality").value || ""));

    const selectedBenefits = [];
    $("benefits-checkboxes")
      .querySelectorAll('input[type="checkbox"]')
      .forEach(function (cb) {
        if (!(cb instanceof HTMLInputElement) || !cb.checked) return;
        const label = cb.parentElement ? cb.parentElement.textContent : cb.value;
        selectedBenefits.push(String(label || cb.value).trim());
      });
    rows.push(inputRow("Selected benefits", selectedBenefits.join("; ")));

    const hcvCb = getHcvCheckbox();
    if (hcvCb && hcvCb.checked) {
      rows.push(inputRow("HCV bedrooms", getSelectOptionText("hcv-bedrooms") || $("hcv-bedrooms").value));
    }

    rows.push(inputRow("Number of adults", $("num-adults").value));
    rows.push(inputRow("Number of children", $("num-children").value));
    rows.push(inputRow("Total number of people", $("total-people").value));

    const numAdults = clampCount($("num-adults").value);
    for (let i = 0; i < numAdults; i++) {
      const ageEl = document.getElementById("adult-age-" + i);
      const parentVal = getSelectedRadioValue("adult_parent_" + i);
      rows.push(inputRow("Adult " + (i + 1) + " age", ageEl ? ageEl.value : ""));
      rows.push(
        inputRow(
          "Adult " + (i + 1) + " parent",
          parentVal === "yes" ? "Yes" : parentVal === "no" ? "No" : ""
        )
      );
    }

    const numChildren = clampCount($("num-children").value);
    for (let i = 0; i < numChildren; i++) {
      rows.push(
        inputRow("Child " + (i + 1) + " age category", getSelectOptionText("child-band-" + i))
      );
    }

    const adultsDisabled = getSelectedRadioValue("adults_disabled");
    rows.push(
      inputRow("Are any adults disabled?", adultsDisabled === "yes" ? "Yes" : adultsDisabled === "no" ? "No" : "")
    );
    if (adultsDisabled === "yes") {
      rows.push(inputRow("Disabled adults (head or spouse)", $("disabled-adult-head-spouse").value));
      rows.push(
        inputRow(
          "Disabled non-elderly adults (not head/spouse)",
          $("disabled-adult-non-elderly-not-head").value
        )
      );
      rows.push(inputRow("Disabled elderly adults", $("disabled-adult-elderly").value));
      const adultSsi = getSelectedRadioValue("adult_ssi_income");
      rows.push(
        inputRow("SSI income (adult)?", adultSsi === "yes" ? "Yes" : adultSsi === "no" ? "No" : "")
      );
      if (adultSsi === "yes") {
        rows.push(inputRow("Disabled adults on SSI who are parents", $("adult-ssi-parent-count").value));
        rows.push(inputRow("Adults receiving SSI", $("adult-ssi-recipients").value));
        rows.push(inputRow("Total adult SSI income", $("adult-ssi-total-monthly").value));
      }
    }

    const childrenDisabled = getSelectedRadioValue("children_disabled");
    rows.push(
      inputRow(
        "Are any children disabled?",
        childrenDisabled === "yes" ? "Yes" : childrenDisabled === "no" ? "No" : ""
      )
    );
    if (childrenDisabled === "yes") {
      rows.push(inputRow("Number of disabled children", $("disabled-children-count").value));
      const childSsi = getSelectedRadioValue("child_ssi_income");
      rows.push(
        inputRow("SSI income (child)?", childSsi === "yes" ? "Yes" : childSsi === "no" ? "No" : "")
      );
      if (childSsi === "yes") {
        rows.push(inputRow("Children receiving SSI", $("child-ssi-recipients").value));
        rows.push(inputRow("Total child SSI income", $("child-ssi-total-monthly").value));
      }
    }

    rows.push(inputRow("Shelter expenses", $("shelter-expenses").value));
    const utilityMethod = getSelectedRadioValue("utility_method");
    rows.push(
      inputRow(
        "Utility costs method",
        utilityMethod === "actual"
          ? "Actual monthly"
          : utilityMethod === "sua"
            ? "Standard Utility Allowance"
            : utilityMethod
      )
    );
    rows.push(inputRow("Utility expenses", $("utility-expenses").value));

    const taxStatus = getSelectedRadioValue("tax_filing_status");
    rows.push(
      inputRow(
        "Tax filing status",
        taxStatus === "mfj"
          ? "Married filing jointly"
          : taxStatus === "single_hoh"
            ? "Single, head of household, qualifying surviving spouse"
            : taxStatus
      )
    );

    rows.push(inputRow("Parent (yes) current monthly income", $("parent-yes-current").value));
    rows.push(inputRow("Parent (yes) new monthly income", $("parent-yes-new").value));
    const parentYesSs = getSelectedRadioValue("parent_yes_ss");
    rows.push(
      inputRow(
        "Parent (yes) Social Security?",
        parentYesSs === "yes" ? "Yes" : parentYesSs === "no" ? "No" : ""
      )
    );
    if (parentYesSs === "yes") {
      rows.push(inputRow("Parent (yes) Social Security amount", $("parent-yes-ss-amount").value));
    }

    rows.push(inputRow("Parent (no) current monthly income", $("parent-no-current").value));
    rows.push(inputRow("Parent (no) new monthly income", $("parent-no-new").value));
    const parentNoSs = getSelectedRadioValue("parent_no_ss");
    rows.push(
      inputRow(
        "Parent (no) Social Security?",
        parentNoSs === "yes" ? "Yes" : parentNoSs === "no" ? "No" : ""
      )
    );
    if (parentNoSs === "yes") {
      rows.push(inputRow("Parent (no) Social Security amount", $("parent-no-ss-amount").value));
    }

    return rows;
  }

  function textOf(id) {
    const el = document.getElementById(id);
    return el ? String(el.textContent).trim() : "";
  }

  function collectExportSummary() {
    const rows = [];
    rows.push([
      "Summary",
      "Total household income",
      textOf("output-total-current"),
      textOf("output-total-new"),
      textOf("output-total-delta"),
    ]);
    rows.push([
      "Summary",
      "Monthly selected benefits",
      textOf("output-benefits-total-current"),
      textOf("output-benefits-total-new"),
      textOf("output-benefits-total-delta"),
    ]);
    rows.push([
      "Summary",
      "Overall resources",
      textOf("output-resources-current"),
      textOf("output-resources-new"),
      textOf("output-resources-delta"),
    ]);

    const programs = [
      { label: "Child care subsidy", current: "output-cc-subsidy-current", neu: "output-cc-subsidy-new" },
      { label: "EITC + VA (monthly)", current: "output-eitc-current", neu: "output-eitc-new" },
      { label: "Marketplace subsidy", current: "output-marketplace-current", neu: "output-marketplace-new" },
      { label: "Medicaid", current: "output-medicaid-current", neu: "output-medicaid-new" },
      { label: "HCV program", current: "output-hcv-current", neu: "output-hcv-new" },
      { label: "SNAP", current: "output-snap-current", neu: "output-snap-new" },
      { label: "TANF", current: "output-tanf-max-current", neu: "output-tanf-max-new" },
      { label: "WIC", current: "output-wic-current", neu: "output-wic-new" },
    ];
    for (let i = 0; i < programs.length; i++) {
      const p = programs[i];
      rows.push(["Summary", p.label, textOf(p.current), textOf(p.neu), ""]);
    }
    return rows;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function exportBasenameForToday() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return "benefits-cliff-export-" + yyyy + "-" + mm + "-" + dd;
  }

  function formatExportDateLabel() {
    try {
      return new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return new Date().toDateString();
    }
  }

  function buildExportPdfHtml(inputRows, summaryRows) {
    const totals = [];
    const programs = [];
    for (let i = 0; i < summaryRows.length; i++) {
      const row = summaryRows[i];
      if (row[4] !== "") totals.push(row);
      else programs.push(row);
    }

    let inputsBody = "";
    for (let i = 0; i < inputRows.length; i++) {
      const value = inputRows[i][2];
      inputsBody +=
        "<tr><th scope=\"row\">" +
        escapeHtml(inputRows[i][1]) +
        "</th><td>" +
        escapeHtml(value === "" ? "—" : value) +
        "</td></tr>";
    }

    let totalsBody = "";
    for (let i = 0; i < totals.length; i++) {
      const row = totals[i];
      const highlight = row[1] === "Overall resources" ? " class=\"row-highlight\"" : "";
      totalsBody +=
        "<tr" +
        highlight +
        "><th scope=\"row\">" +
        escapeHtml(row[1]) +
        "</th><td class=\"num\">" +
        escapeHtml(row[2]) +
        "</td><td class=\"num\">" +
        escapeHtml(row[3]) +
        "</td><td class=\"num\">" +
        escapeHtml(row[4]) +
        "</td></tr>";
    }

    let programsBody = "";
    for (let i = 0; i < programs.length; i++) {
      const row = programs[i];
      programsBody +=
        "<tr><th scope=\"row\">" +
        escapeHtml(row[1]) +
        "</th><td class=\"num\">" +
        escapeHtml(row[2]) +
        "</td><td class=\"num\">" +
        escapeHtml(row[3]) +
        "</td></tr>";
    }

    const title = exportBasenameForToday();
    return (
      "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\" />" +
      "<title>" +
      escapeHtml(title) +
      "</title><style>" +
      "*,*::before,*::after{box-sizing:border-box}" +
      "body{margin:0;padding:32px;font-family:'Segoe UI',system-ui,-apple-system,Arial,sans-serif;" +
      "color:#1c1c1a;background:#fff;line-height:1.45;font-size:12.5px}" +
      ".report{max-width:760px;margin:0 auto}" +
      ".masthead{border-bottom:3px solid #0057a1;padding-bottom:16px;margin-bottom:28px}" +
      ".masthead h1{margin:0 0 6px;font-size:22px;font-weight:650;letter-spacing:-0.02em;color:#0057a1}" +
      ".masthead p{margin:0;color:#5c5d5f;font-size:12px}" +
      "h2{margin:0 0 12px;font-size:14px;font-weight:650;letter-spacing:0.02em;" +
      "text-transform:uppercase;color:#004480}" +
      "section{margin-bottom:28px}" +
      "table{width:100%;border-collapse:collapse}" +
      "th,td{padding:8px 10px;border-bottom:1px solid #e8e9e5;text-align:left;vertical-align:top}" +
      "thead th{background:#eef5fb;color:#004480;font-weight:600;border-bottom:1px solid #c2c3be}" +
      "tbody th{font-weight:500;color:#5c5d5f;width:42%}" +
      "td{font-variant-numeric:tabular-nums}" +
      ".row-highlight th,.row-highlight td{background:#f3f7fb;font-weight:600;color:#1c1c1a}" +
      ".num{text-align:right;white-space:nowrap}" +
      "@media print{body{padding:0} section{break-inside:avoid}}" +
      "</style></head><body><div class=\"report\">" +
      "<header class=\"masthead\">" +
      "<h1>Benefits Cliff Calculator</h1>" +
      "<p>Export dated " +
      escapeHtml(formatExportDateLabel()) +
      "</p></header>" +
      "<section><h2>Household inputs</h2>" +
      "<table><thead><tr><th scope=\"col\">Field</th><th scope=\"col\">Value</th></tr></thead>" +
      "<tbody>" +
      inputsBody +
      "</tbody></table></section>" +
      "<section><h2>Monthly household totals</h2>" +
      "<table><thead><tr><th scope=\"col\">Metric</th>" +
      "<th class=\"num\" scope=\"col\">Current</th>" +
      "<th class=\"num\" scope=\"col\">New</th>" +
      "<th class=\"num\" scope=\"col\">Change</th></tr></thead>" +
      "<tbody>" +
      totalsBody +
      "</tbody></table></section>" +
      "<section><h2>Benefits by program</h2>" +
      "<table><thead><tr><th scope=\"col\">Program</th>" +
      "<th class=\"num\" scope=\"col\">Current</th>" +
      "<th class=\"num\" scope=\"col\">New</th></tr></thead>" +
      "<tbody>" +
      programsBody +
      "</tbody></table></section>" +
      "</div></body></html>"
    );
  }

  function exportSummaryToPdf() {
    const html = buildExportPdfHtml(collectExportInputs(), collectExportSummary());
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      window.alert("Please allow pop-ups to export the PDF report.");
      return;
    }
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(function () {
      reportWindow.print();
    }, 250);
  }

  function bindFormListeners() {
    const resetBtn = document.getElementById("reset-form");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetFormToDefaults);
    }

    const exportBtn = document.getElementById("export-summary");
    if (exportBtn) {
      exportBtn.addEventListener("click", exportSummaryToPdf);
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
      el.addEventListener("change", function () {
        taxFilingStatusUserSet = true;
        updateEitcTaxWarning();
        updateEitcOutputs();
      });
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
    $("adult-rows").addEventListener("change", onAdultAgeFieldCommit);
    $("adult-rows").addEventListener("blur", onAdultAgeFieldCommit, true);
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
      console.warn("Child care lookup data missing — child care subsidy outputs disabled.");
    }
    if (typeof EITC_RATES_MFJ === "undefined") {
      console.warn("EITC lookup data missing — EITC outputs disabled.");
    }
    if (typeof MARKETPLACE_MONTHLY_FPL_BY_HOUSEHOLD === "undefined") {
      console.warn("Marketplace lookup data missing — marketplace subsidy outputs disabled.");
    }
    if (typeof MEDICAID_ADULT_SPEND_MONTHLY === "undefined") {
      console.warn("Medicaid lookup data missing — Medicaid outputs disabled.");
    }
    if (typeof HCV_BY_LOCALITY === "undefined") {
      console.warn("HCV lookup data missing — HCV outputs disabled.");
    }
    if (typeof computeSnapV !== "function") {
      console.warn("snap.js missing — SNAP outputs disabled.");
    }
    if (typeof WIC_INCOME_LIMIT_BY_HH === "undefined") {
      console.warn("WIC lookup data missing — WIC outputs disabled.");
    }
    if (typeof computeTanfMaxLT !== "function") {
      console.warn("TANF calculator missing — TANF outputs disabled.");
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
