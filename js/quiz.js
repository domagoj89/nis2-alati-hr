/* KSC/NIS2 Compliance Quiz v2 — quiz.js */

(function () {
  "use strict";

  const REPORT_ENDPOINT    = "/generate-report";
  const SUBSCRIBE_ENDPOINT = "/subscribe";

  // ── Affiliate + tool links ──────────────────────────────────────────────────
  const LINKS = {
    reglyze:      { name: "Reglyze",      url: "https://reglyze.com",         review: "narzedzia/reglyze.html" },
    secfix:       { name: "Secfix",       url: "https://secfix.com",          review: "narzedzia/secfix.html" },
    isms_online:  { name: "ISMS.online",  url: "https://isms.online",         review: "narzedzia/isms-online.html" },
    knowbe4:      { name: "KnowBe4",      url: "https://knowbe4.com",         review: "obuka-nis2.html" },
    hiscox:       { name: "Hiscox Cyber", url: "https://hiscox.com",          review: "cyber-osiguranje.html" },
    onepassword:  { name: "1Password",    url: "https://1password.com",       review: "narzedzia/1password.html" },
    nordlayer:    { name: "NordLayer",    url: "https://nordlayer.com",       review: "narzedzia/nordlayer.html" },
    cobalt:       { name: "Cobalt.io",    url: "https://cobalt.io",           review: "penetracijsko-testiranje.html" },
    bsi:          { name: "BSI ISO 27001",url: "https://bsigroup.com/hr-HR/", review: "certifikacija-iso-27001.html" },
  };

  // ── Tool recommendation by sector + budget ─────────────────────────────────
  const ISMS_RECS = {
    "annex1:free":  "reglyze",   "annex1:low":   "isms_online",
    "annex1:mid":   "secfix",    "annex1:high":  "secfix",
    "annex2:free":  "reglyze",   "annex2:low":   "reglyze",
    "annex2:mid":   "isms_online","annex2:high":  "secfix",
    "other:free":   "reglyze",   "other:low":    "reglyze",
    "other:mid":    "reglyze",   "other:high":   "isms_online",
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const state = {
    step: 0,
    answers: {},
    score: 0,
    missing: [],
    email: null,
  };

  // ── Questions ──────────────────────────────────────────────────────────────
  const questions = [
    {
      id: "sector",
      title: "U kojoj djelatnosti posluje Vaša tvrtka?",
      hint: "Odaberite sektor koji najbolje opisuje glavnu djelatnost.",
      options: [
        { value: "annex1", icon: "⚡", label: "Ključni sektor (Annexe I)",
          sub: "Energetika, promet, bankarstvo, financije, zdravstvo, voda, digitalna infrastruktura, javna uprava" },
        { value: "annex2", icon: "📦", label: "Važan sektor (Annexe II)",
          sub: "Pošta, gospodarenje otpadom, kemija, hrana, industrijska proizvodnja, pružatelji digitalnih usluga, MSP/IT" },
        { value: "other", icon: "🏗️", label: "Drugi sektor",
          sub: "Građevinarstvo, maloprodaja, ugostiteljstvo, privatno obrazovanje, ostalo" },
      ]
    },
    {
      id: "size",
      title: "Koliko zaposlenika ima Vaša tvrtka?",
      hint: "Uključujući sve zaposlenike i suradnike.",
      options: [
        { value: "micro",  icon: "👤", label: "Manje od 50 zaposlenika",  sub: "Mikro / malo poduzeće" },
        { value: "medium", icon: "👥", label: "50–249 zaposlenika",        sub: "Srednje poduzeće" },
        { value: "large",  icon: "🏢", label: "250 ili više zaposlenika",  sub: "Veliko poduzeće" },
      ]
    },
    {
      id: "revenue",
      title: "Koji je godišnji prihod Vaše tvrtke?",
      hint: "Godišnji prihodi ili ukupna bilančna suma.",
      options: [
        { value: "small",  icon: "💶", label: "Ispod 10 mil. EUR godišnje",  sub: "Mikro / malo poduzeće" },
        { value: "medium", icon: "💰", label: "10–50 mil. EUR godišnje",     sub: "Srednje poduzeće" },
        { value: "large",  icon: "💎", label: "Iznad 50 mil. EUR godišnje",  sub: "Veliko poduzeće" },
      ]
    },
    {
      id: "budget",
      title: "Koji godišnji proračun imate za usklađenost s NIS2?",
      hint: "Prilagodit ćemo alate Vašim financijskim mogućnostima.",
      options: [
        { value: "free", icon: "🆓", label: "Tražim besplatno rješenje",        sub: "Besplatni plan ili jednokratni trošak implementacije" },
        { value: "low",  icon: "💵", label: "Do 1 000 HRK godišnje (~€130)",    sub: "Osnovni SaaS alat" },
        { value: "mid",  icon: "💳", label: "1 000–6 000 HRK godišnje",         sub: "Potpuna platforma za usklađenost" },
        { value: "high", icon: "🏦", label: "Iznad 6 000 HRK godišnje",         sub: "Enterprise rješenje" },
      ]
    },
    {
      id: "registered",
      title: "Je li Vaša tvrtka već registrirana sukladno Zakonu o kibernetičkoj sigurnosti?",
      hint: "Rok registracije: sukladno hrvatskoj transpoziciji NIS2. To je prva obveza.",
      options: [
        { value: "yes",     icon: "✅", label: "Da, već smo se registrirali",        sub: "Samoidentifikacija je obavljena" },
        { value: "no",      icon: "❌", label: "Ne, još nismo to napravili",         sub: "Prioritet br. 1 — rok: sukladno hrvatskoj transpoziciji NIS2" },
        { value: "unknown", icon: "❓", label: "Ne znam / nisam siguran",            sub: "Provjerit ćemo to zajedno" },
      ]
    },
    {
      id: "has_isms",
      title: "Imate li implementiran sustav upravljanja sigurnošću informacija (ISMS)?",
      hint: "ISMS je skup politika, procedura i kontrola kibernetičke sigurnosti — zahtijeva se prema Art. 21 NIS2.",
      options: [
        { value: "yes",     icon: "✅", label: "Da, imamo funkcionalan ISMS",          sub: "Dokumentirane sigurnosne politike i procedure" },
        { value: "partial", icon: "🔄", label: "Radimo na implementaciji",             sub: "U tijeku je — ali još nije završeno" },
        { value: "no",      icon: "❌", label: "Ne, nemamo ništa u tom pogledu",       sub: "Nema sustava upravljanja sigurnošću" },
      ]
    },
    {
      id: "has_training",
      title: "Jesu li zaposlenici i uprava prošli obuku iz kibernetičke sigurnosti?",
      hint: "Obuka uprave zakonska je obveza prema Art. 20 NIS2.",
      options: [
        { value: "yes", icon: "✅", label: "Da, imamo redovite obuke",               sub: "Zaposlenici i uprava su educirani" },
        { value: "no",  icon: "❌", label: "Ne, nemamo obuke u tom području",         sub: "Obuka uprave zakonska je obveza prema Zakonu o kibernetičkoj sigurnosti" },
      ]
    },
    {
      id: "has_insurance",
      title: "Ima li Vaša tvrtka osiguranje od kibernetičkih prijetnji?",
      hint: "Cyber osiguranje prenosi rezidualni rizik i element je upravljanja rizicima prema NIS2.",
      options: [
        { value: "yes",     icon: "✅", label: "Da, imamo cyber osiguranje",          sub: "Rizik je pokriven" },
        { value: "no",      icon: "❌", label: "Ne, nemamo osiguranje",               sub: "Online procjena traje 20 minuta" },
        { value: "unknown", icon: "❓", label: "Ne znam / nisam čuo za to",           sub: "Objasnit ćemo što je i koliko košta" },
      ]
    },
    {
      id: "role",
      title: "Koju ulogu obavljate u tvrtki?",
      hint: "Prilagodit ćemo plan Vašim obvezama i ovlastima za donošenje odluka.",
      options: [
        { value: "ceo",        icon: "👔", label: "Vlasnik / CEO / Uprava",         sub: "Odgovarate za odluke i proračun" },
        { value: "it",         icon: "💻", label: "IT Manager / CTO / CISO",        sub: "Odgovarate za tehničku implementaciju" },
        { value: "compliance", icon: "📋", label: "Usklađenost / Pravnik",          sub: "Odgovarate za pravnu usklađenost" },
        { value: "cfo",        icon: "💰", label: "CFO / Financijski direktor",     sub: "Odgovarate za proračun i financijski rizik" },
      ]
    },
  ];

  const TOTAL = questions.length;

  // ── Score calculation ──────────────────────────────────────────────────────
  function computeScore() {
    const a = state.answers;
    let score = 2; // base: everyone has some basics
    const missing = [];

    if (a.registered === "yes")        { score += 2; }
    else                               { missing.push("registration"); }

    if (a.has_isms === "yes")          { score += 3; }
    else if (a.has_isms === "partial") { score += 1; missing.push("isms"); }
    else                               { missing.push("isms"); }

    if (a.has_training === "yes")      { score += 2; }
    else                               { missing.push("training"); }

    if (a.has_insurance === "yes")     { score += 1; }
    else                               { missing.push("insurance"); }

    score = Math.min(10, Math.max(1, score));
    state.score   = score;
    state.missing = missing;
    try { sessionStorage.setItem("nis2_quiz_gaps", JSON.stringify(missing)); } catch(e) {}
    return { score, missing };
  }

  function computeScope() {
    const { sector, size, revenue } = state.answers;
    if (sector === "other") return "out";
    const isLarge  = size === "large"  || revenue === "large";
    const isMedium = !isLarge && (size === "medium" || revenue === "medium");
    if (sector === "annex1" && isLarge)           return "essential";
    if (sector === "annex1" && isMedium)          return "important";
    if (sector === "annex2" && (isLarge||isMedium)) return "important";
    return "check"; // small companies in scope sectors
  }

  // ── Today actions (client-side, shown on result screen immediately) ────────
  function buildTodayActions() {
    const missing   = state.missing;
    const sector    = state.answers.sector  || "annex2";
    const budget    = state.answers.budget  || "low";
    const ismsTool  = LINKS[ISMS_RECS[sector+":"+budget] || "reglyze"];
    const actions   = [];

    if (missing.includes("registration")) {
      actions.push({
        step: actions.length + 1,
        time: "30 min · besplatno",
        title: "Registrirajte tvrtku sukladno Zakonu o kibernetičkoj sigurnosti",
        desc:  "Rok: sukladno hrvatskoj transpoziciji NIS2. Online obrazac samoidentifikacije. To je Vaš prioritet #1.",
        cta:   "Upute korak po korak →",
        url:   "registracija-nis2.html",
        affiliate: false,
      });
    }

    if (missing.includes("isms")) {
      actions.push({
        step: actions.length + 1,
        time: "20 min · besplatni plan",
        title: "Pokrenite ISMS sustav — " + ismsTool.name,
        desc:  "Besplatni plan pokriva potpunu NIS2 analizu nedostataka. Nakon registracije: ispunite ugrađeni upitnik — AI automatski generira politike.",
        cta:   "Počnite za €0 → " + ismsTool.name,
        url:   ismsTool.url,
        affiliate: true,
        badge: "Preporuka #1",
      });
    }

    if (missing.includes("insurance")) {
      actions.push({
        step: actions.length + 1,
        time: "20 min · online procjena",
        title: "Zatražite ponudu cyber osiguranja",
        desc:  "Prijenos rizika element je upravljanja rizicima prema NIS2. Hiscox procjena: 20 minuta online, bez razgovora s agentom.",
        cta:   "Pogledajte ponudu Hiscox →",
        url:   LINKS.hiscox.url,
        affiliate: true,
      });
    }

    if (missing.includes("training")) {
      actions.push({
        step: actions.length + 1,
        time: "30 min · 14-dnevni besplatni trial",
        title: "Pokrenite obuku kibernetičke sigurnosti — KnowBe4",
        desc:  "Obuka uprave zakonska je obveza (Art. 20 Zakona o kibernetičkoj sigurnosti). KnowBe4: online platforma, prvi modul poslan timu unutar 24h.",
        cta:   "Počnite besplatni trial →",
        url:   LINKS.knowbe4.url,
        affiliate: true,
      });
    }

    // Always suggest 1Password if no training (implies basics missing)
    if (missing.includes("isms") && actions.length < 5) {
      actions.push({
        step: actions.length + 1,
        time: "30 min · 14-dnevni besplatni trial",
        title: "Implementirajte upravitelj lozinki + MFA — 1Password",
        desc:  "Višefaktorska autentifikacija (MFA) zahtijeva se prema Art. 21(j) Zakona o kibernetičkoj sigurnosti. 1Password Business: postavljanje 30 minuta, uvođenje u tim istog dana.",
        cta:   "Počnite besplatni trial →",
        url:   LINKS.onepassword.url,
        affiliate: true,
      });
    }

    return actions.slice(0, 4); // max 4 today actions
  }

  // ── GA4 helper ─────────────────────────────────────────────────────────────
  function track(event, params) {
    if (typeof gtag === "function") gtag("event", event, params || {});
  }

  // ── Render: question step ──────────────────────────────────────────────────
  function renderStep() {
    const q   = questions[state.step];
    const el  = document.getElementById("quiz-container");
    if (!el) return;

    const pct    = Math.round((state.step / TOTAL) * 100);
    const isLast = state.step === TOTAL - 1;

    el.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-progress">
          <div class="quiz-progress__bar" style="width:${pct}%"></div>
        </div>
        <p class="text-sm text-gray" style="margin-bottom:.25rem;">Pitanje ${state.step + 1} od ${TOTAL}</p>
        <h3>${q.title}</h3>
        <p style="color:var(--gray-500);font-size:.9rem;margin-bottom:1rem;">${q.hint}</p>
        <div class="quiz-options">
          ${q.options.map(opt => `
            <button class="quiz-option${state.answers[q.id] === opt.value ? " selected" : ""}"
                    data-value="${opt.value}" type="button">
              <span class="quiz-option__icon">${opt.icon}</span>
              <span>
                <span class="quiz-option__text">${opt.label}</span>
                <span class="quiz-option__sub">${opt.sub}</span>
              </span>
            </button>
          `).join("")}
        </div>
        <div class="quiz-nav">
          ${state.step > 0
            ? `<button class="btn btn--outline btn--sm" id="quiz-back">← Natrag</button>`
            : `<span></span>`}
          <button class="btn btn--primary btn--sm" id="quiz-next"
                  ${state.answers[q.id] ? "" : "disabled"}>
            ${isLast ? "Izračunaj moj rezultat →" : "Dalje →"}
          </button>
        </div>
      </div>`;

    el.querySelectorAll(".quiz-option").forEach(btn => {
      btn.addEventListener("click", () => {
        state.answers[q.id] = btn.dataset.value;
        el.querySelectorAll(".quiz-option").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        el.querySelector("#quiz-next").removeAttribute("disabled");
        track("quiz_answer", { question: q.id, answer: btn.dataset.value });
        // Auto-advance on click for faster UX
        setTimeout(() => {
          if (isLast) { computeScore(); renderScoreGate(); }
          else { state.step++; renderStep(); }
        }, 280);
      });
    });

    el.querySelector("#quiz-back")?.addEventListener("click", () => {
      state.step--;
      renderStep();
    });

    el.querySelector("#quiz-next")?.addEventListener("click", () => {
      if (!state.answers[q.id]) return;
      if (isLast) { computeScore(); renderScoreGate(); }
      else { state.step++; renderStep(); }
    });
  }

  // ── Render: score + email gate ─────────────────────────────────────────────
  function renderScoreGate() {
    const el = document.getElementById("quiz-container");
    if (!el) return;

    const { score, missing } = state;
    const pct    = Math.round((score / 10) * 100);
    const scope  = computeScope();

    const scoreColor = score <= 3 ? "#dc2626"
                     : score <= 6 ? "#d97706"
                     : "#16a34a";

    const scopeMsg = {
      essential: "Vaša tvrtka je <strong>ključni subjekt prema Zakonu o kibernetičkoj sigurnosti</strong> — najviša razina zahtjeva.",
      important:  "Vaša tvrtka je <strong>važan subjekt prema Zakonu o kibernetičkoj sigurnosti</strong> — morate ispuniti zahtjeve NIS2.",
      check:      "Vaša tvrtka možda podliježe Zakonu o kibernetičkoj sigurnosti — provjerite iznimke za mala poduzeća.",
      out:        "Vaša tvrtka vjerojatno ne podliježe Zakonu o kibernetičkoj sigurnosti — ali vrijedi implementirati osnove.",
    }[scope] || "";

    const gapText = missing.length === 0
      ? "Čestitamo — implementirali ste sve ključne mjere!"
      : `Nedostaje Vam <strong>${missing.length}</strong> ključnih sigurnosnih mjera. Većinu možete implementirati u roku od 3 dana.`;

    el.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-progress">
          <div class="quiz-progress__bar" style="width:100%"></div>
        </div>

        <div style="text-align:center;padding:1rem 0 .5rem;">
          <div style="font-size:.8rem;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;">
            Vaš NIS2 rezultat usklađenosti
          </div>
          <div style="font-size:3.5rem;font-weight:800;color:${scoreColor};line-height:1;">
            ${score}<span style="font-size:1.5rem;color:var(--gray-400);font-weight:500;">/10</span>
          </div>
          <div style="margin:.75rem auto;max-width:280px;height:10px;background:#e5e7eb;border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${scoreColor};border-radius:99px;transition:width 1s;"></div>
          </div>
          <p style="font-size:.9rem;color:var(--gray-600);">${scopeMsg}</p>
          <p style="font-size:.92rem;">${gapText}</p>
        </div>

        <div style="background:#f0f7ff;border-radius:12px;padding:1.25rem;margin:1rem 0;">
          <p style="font-size:.95rem;font-weight:700;color:#1a1a2e;margin:0 0 .35rem;">
            📬 Primite svoj 3-dnevni akcijski plan
          </p>
          <p style="font-size:.82rem;color:#555;margin:0 0 .75rem;">
            Vaš personalizirani plan: što učiniti danas, sutra i ovaj tjedan.
            Gotove afiliativne poveznice na alate + AI prompt za Claude / ChatGPT / Gemini.
          </p>
          <form id="score-email-form" style="display:flex;gap:.5rem;flex-wrap:wrap;">
            <input type="email" name="email" placeholder="vas@email.hr" required
                   style="flex:1;min-width:180px;padding:.6rem .9rem;border:1px solid #d1d5db;border-radius:8px;font-size:.95rem;">
            <button type="submit" class="btn btn--primary">Pošaljite mi plan →</button>
          </form>
          <p style="font-size:.75rem;color:#9ca3af;margin:.5rem 0 0;">Bez spama. Jedna e-poruka s planom + opcionalni podsjetnici.</p>
        </div>

        <button id="quiz-skip-email" type="button"
                style="background:none;border:none;color:var(--gray-400);font-size:.8rem;cursor:pointer;width:100%;text-align:center;padding:.25rem 0;">
          Prikaži samo rezultat, bez plana →
        </button>
      </div>`;

    track("quiz_score_shown", { score, missing: missing.join(","), scope });

    document.getElementById("score-email-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const email = e.target.querySelector("input[type=email]").value.trim();
      if (!email) return;
      const btn = e.target.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Slanje...";
      state.email = email;
      _submitEmailAndReport(email, () => renderResult(true));
    });

    document.getElementById("quiz-skip-email")?.addEventListener("click", () => {
      track("quiz_email_skipped");
      renderResult(false);
    });
  }

  // ── Submit email to Beehiiv + trigger report ───────────────────────────────
  function _submitEmailAndReport(email, onDone) {
    const { score, missing, answers } = state;

    // Score tier tag
    const scoreTier = score <= 3 ? "score_low" : score <= 6 ? "score_mid" : "score_high";
    const tags = [scoreTier,
      "sector_" + (answers.sector || "unknown"),
      "role_"   + (answers.role   || "unknown"),
      ...(missing.includes("registration") ? ["missing_registration"] : []),
      ...(missing.includes("isms")         ? ["missing_isms"]         : []),
      ...(missing.includes("training")     ? ["missing_training"]     : []),
      ...(missing.includes("insurance")    ? ["missing_insurance"]    : []),
    ];

    // Call both endpoints in parallel
    const subscribeCall = fetch(SUBSCRIBE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        source: "quiz_score_gate",
        tags,
        quiz_answers: {
          sector: answers.sector, size: answers.size, revenue: answers.revenue,
          budget: answers.budget, registered: answers.registered,
          has_isms: answers.has_isms, has_training: answers.has_training,
          has_insurance: answers.has_insurance, role: answers.role,
          score,
        },
      }),
    }).catch(() => {});

    const reportCall = fetch(REPORT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sector:        answers.sector,
        size:          answers.size,
        revenue:       answers.revenue,
        budget:        answers.budget,
        registered:    answers.registered,
        has_isms:      answers.has_isms,
        has_training:  answers.has_training,
        has_insurance: answers.has_insurance,
        role:          answers.role,
        score,
        missing,
        email,
        lang:   document.documentElement.lang || "pl",
        domain: window.location.hostname,
      }),
    }).catch(() => {});

    Promise.allSettled([subscribeCall, reportCall]).then(() => {
      track("quiz_completed", { score, sector: answers.sector, email_captured: true });
      if (onDone) onDone();
    });
  }

  // ── Render: result with today-actions ──────────────────────────────────────
  function renderResult(emailCaptured) {
    const el = document.getElementById("quiz-container");
    if (!el) return;

    const { score, missing, answers } = state;
    const scope    = computeScope();
    const actions  = buildTodayActions();
    const pct      = Math.round((score / 10) * 100);
    const scoreColor = score <= 3 ? "#dc2626" : score <= 6 ? "#d97706" : "#16a34a";

    const scopeBadge = {
      essential: { text: "🚨 Ključni subjekt",         color: "#fee2e2", tc: "#991b1b" },
      important:  { text: "⚠️ Važan subjekt",           color: "#fefce8", tc: "#854d0e" },
      check:      { text: "🔍 Provjerite iznimke",      color: "#fefce8", tc: "#854d0e" },
      out:        { text: "✅ Vjerojatno izvan opsega Zakona o kibernetičkoj sigurnosti", color: "#dcfce7", tc: "#166534" },
    }[scope] || { text: "Zakon o kibernetičkoj sigurnosti", color: "#e5e7eb", tc: "#374151" };

    function actionCard(a) {
      const isAffiliate = a.affiliate;
      return `
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:1rem 1.1rem;margin-bottom:.75rem;${isAffiliate ? "border-left:3px solid var(--navy);" : ""}">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem;">
            <span style="background:var(--navy);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0;">${a.step}</span>
            <span style="font-size:.75rem;color:var(--gray-500);">${a.time}</span>
            ${isAffiliate && a.badge ? `<span style="background:#dcfce7;color:#166534;font-size:.68rem;font-weight:700;padding:.1rem .45rem;border-radius:4px;">${a.badge}</span>` : ""}
          </div>
          <div style="font-weight:700;font-size:.95rem;margin-bottom:.3rem;">${a.title}</div>
          <div style="font-size:.82rem;color:#555;margin-bottom:.6rem;">${a.desc}</div>
          <a href="${a.url}" ${isAffiliate ? 'target="_blank" rel="nofollow noopener"' : ''}
             style="display:inline-block;padding:.45rem .9rem;background:var(--navy);color:#fff;border-radius:6px;font-size:.82rem;font-weight:600;text-decoration:none;">
            ${a.cta}
          </a>
        </div>`;
    }

    const reskipBlock = missing.length === 0
      ? `<div style="background:#dcfce7;border-radius:10px;padding:1rem;text-align:center;margin-bottom:1rem;">
           <strong>🎉 Vaša tvrtka je u odličnom stanju!</strong><br>
           <span style="font-size:.85rem;">Implementirali ste sve ključne NIS2 mjere. Razmotrite certifikaciju ISO 27001 kao dokaz usklađenosti.</span>
           <br><a href="certifikacija-iso-27001.html" style="font-size:.82rem;color:var(--navy);font-weight:700;">Saznajte više o ISO 27001 →</a>
         </div>`
      : actions.map(actionCard).join("");

    el.innerHTML = `
      <div class="quiz-card">

        ${emailCaptured
          ? `<div style="background:#dcfce7;border-radius:8px;padding:.6rem 1rem;font-size:.82rem;color:#166534;font-weight:600;margin-bottom:1rem;text-align:center;">
               ✅ Plan poslan na ${state.email || "Vašu e-poštu"} — provjerite sandučić
             </div>`
          : ""}

        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;flex-wrap:wrap;">
          <div style="text-align:center;flex-shrink:0;">
            <div style="font-size:2.5rem;font-weight:800;color:${scoreColor};line-height:1;">
              ${score}<span style="font-size:1rem;color:var(--gray-400);font-weight:500;">/10</span>
            </div>
            <div style="font-size:.7rem;color:var(--gray-500);">NIS2 rezultat</div>
          </div>
          <div style="flex:1;min-width:140px;">
            <div style="height:8px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin-bottom:.35rem;">
              <div style="height:100%;width:${pct}%;background:${scoreColor};border-radius:99px;"></div>
            </div>
            <span style="display:inline-block;padding:.2rem .6rem;border-radius:12px;font-size:.75rem;font-weight:700;background:${scopeBadge.color};color:${scopeBadge.tc};">
              ${scopeBadge.text}
            </span>
          </div>
        </div>

        <h3 style="font-size:1.05rem;margin-bottom:.35rem;">
          ${missing.length > 0
            ? `🏃 Napravite DANAS — ukupno ~${Math.min(120, missing.length * 30)} minuta`
            : "Vaš NIS2 status"}
        </h3>
        <p style="font-size:.82rem;color:var(--gray-500);margin-bottom:1rem;">
          ${missing.length > 0
            ? `${missing.length} koraka koji nedostaju. Sljedeće možete završiti danas.`
            : "Sve ključne mjere su na mjestu."}
        </p>

        ${reskipBlock}

        ${missing.length > 0 ? `
          <div style="border-top:1px solid #e5e7eb;padding-top:1rem;margin-top:.5rem;">
            <p style="font-size:.78rem;color:var(--gray-500);margin-bottom:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">
              Sljedeći koraci (rezervirajte termine)
            </p>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
              <a href="penetracijsko-testiranje.html" style="font-size:.78rem;padding:.3rem .7rem;border:1px solid #e5e7eb;border-radius:6px;color:var(--gray-600);text-decoration:none;">
                🔍 Penetracijsko testiranje
              </a>
              <a href="certifikacija-iso-27001.html" style="font-size:.78rem;padding:.3rem .7rem;border:1px solid #e5e7eb;border-radius:6px;color:var(--gray-600);text-decoration:none;">
                🏅 Certifikacija ISO 27001
              </a>
              <a href="sigurnost-lanca-opskrbe.html" style="font-size:.78rem;padding:.3rem .7rem;border:1px solid #e5e7eb;border-radius:6px;color:var(--gray-600);text-decoration:none;">
                🔗 Sigurnost lanca opskrbe
              </a>
            </div>
          </div>` : ""}

        <div style="margin-top:1.25rem;display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn--outline btn--sm" id="quiz-restart">← Počni ispočetka</button>
          <a href="porownanie.html" class="btn btn--primary btn--sm">Usporedi NIS2 alate →</a>
        </div>

        ${!emailCaptured ? `
          <div style="margin-top:1rem;background:#f0f7ff;border-radius:8px;padding:.85rem;text-align:center;">
            <p style="font-size:.82rem;margin:0 0 .5rem;"><strong>Primite potpuni plan na e-poštu</strong> s AI promptom i poveznicama na alate</p>
            <form id="late-email-form" style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;">
              <input type="email" placeholder="vas@email.hr" required
                     style="flex:1;min-width:160px;padding:.45rem .75rem;border:1px solid #d1d5db;border-radius:6px;font-size:.85rem;">
              <button type="submit" class="btn btn--primary btn--sm">Pošalji →</button>
            </form>
          </div>` : ""}
      </div>`;

    document.getElementById("quiz-restart")?.addEventListener("click", () => {
      state.step = 0; state.answers = {}; state.score = 0;
      state.missing = []; state.email = null;
      try { history.replaceState(null, "", window.location.pathname); } catch (e) {}
      renderStep();
    });

    document.getElementById("late-email-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const email = e.target.querySelector("input[type=email]").value.trim();
      if (!email) return;
      const btn = e.target.querySelector("button");
      btn.disabled = true; btn.textContent = "Slanje...";
      state.email = email;
      _submitEmailAndReport(email, () => {
        e.target.parentElement.innerHTML =
          `<p style="font-size:.82rem;color:#166534;font-weight:700;">✅ Poslano na ${email}</p>`;
      });
    });

    track("quiz_result_shown", { score, scope, email_captured: emailCaptured });
  }

  // ── FAQ accordion ──────────────────────────────────────────────────────────
  function initFaq() {
    document.querySelectorAll(".faq-question").forEach(btn => {
      btn.addEventListener("click", () => {
        const item   = btn.closest(".faq-item");
        const isOpen = item.classList.contains("open");
        document.querySelectorAll(".faq-item.open").forEach(i => i.classList.remove("open"));
        if (!isOpen) item.classList.add("open");
      });
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("quiz-container");
    if (container) renderStep();
    initFaq();
  });

})();