/* NIS2 Compliance Progress Tracker — tracker.js */
/* Renders a 10-item Art. 21 checklist with localStorage persistence.
   Quiz score auto-marks gaps if quiz was completed this session.        */

(function () {
  var STORAGE_KEY = "nis2_tracker_v1";
  var QUIZ_KEY    = "nis2_quiz_gaps"; // written by quiz.js after score gate

  /* ── Strings (Croatian — translated per site by deploy script) ─────────── */
  var S = {
    heading:        "Vaš napredak usklađenosti s NIS2",
    subheading:     "Označite mjere koje ste već implementirali. Vaš napredak pohranjuje se lokalno.",
    done_label:     "Implementirano",
    todo_label:     "Za napraviti",
    cta_default:    "Saznajte više →",
    progress_text:  function(done, total) { return done + " od " + total + " mjera implementirano"; },
    complete_msg:   "🎉 Sve mjere implementirane — čestitamo! Razmotrite certifikaciju ISO 27001.",
    iso_link_text:  "Saznajte o certifikaciji ISO 27001 →",
    reset_label:    "Resetiraj napredak",
    last_updated:   "Posljednje ažuriranje: ",
    art_badge:      "Čl. 21",
    free_badge:     "besplatno",
    trial_badge:    "probno",
  };

  /* ── Measures (10 Art. 21 NIS2 requirements) ─────────────────────────── */
  var MEASURES = [
    {
      id:       "registration",
      art:      "Registracija",
      title:    "Registracija u registru subjekata prema Zakonu o kibernetičkoj sigurnosti",
      detail:   "Obveza registracije u registru ključnih i važnih subjekata koji vodi ZSIS. Rok: sukladno hrvatskoj transpoziciji NIS2.",
      tool:     "Uputa za registraciju korak po korak",
      tool_url: "registracija-nis2.html",
      cost:     "besplatno",
      quiz_gap: "registration",
    },
    {
      id:       "risk_policy",
      art:      "Čl. 21(2)(a)",
      title:    "Analiza rizika i politike sigurnosti",
      detail:   "Dokumentirana politika informacijske sigurnosti i formalni proces upravljanja IT rizicima.",
      tool:     "ISMS.online — besplatni plan do 25 zaposlenika",
      tool_url: "https://isms.online/",
      cost:     "besplatni plan",
      quiz_gap: "isms",
    },
    {
      id:       "incident",
      art:      "Čl. 21(2)(b)",
      title:    "Postupci upravljanja incidentima",
      detail:   "Dokumentirani postupci za otkrivanje, klasifikaciju i prijavu incidenata ZSIS-u u roku 24/72h.",
      tool:     "ISMS.online — predlošci postupaka za incidente",
      tool_url: "https://isms.online/",
      cost:     "besplatni plan",
      quiz_gap: "isms",
    },
    {
      id:       "continuity",
      art:      "Čl. 21(2)(c)",
      title:    "Kontinuitet poslovanja i krizno upravljanje",
      detail:   "Plan kontinuiteta poslovanja (BCP) i oporavka od katastrofe (DR). Sigurnosna pohrana podataka, testovi obnove.",
      tool:     "Acronis Cyber Protect — backup + DR za mala i srednja poduzeća",
      tool_url: "https://www.acronis.com/",
      cost:     "od €59/god",
      quiz_gap: null,
    },
    {
      id:       "supply_chain",
      art:      "Čl. 21(2)(d)",
      title:    "Sigurnost lanca opskrbe",
      detail:   "Procjena rizika dobavljača, sigurnosne klauzule u ugovorima, registar dobavljača s pristupom sustavima.",
      tool:     "Vodič za sigurnost dobavljača NIS2",
      tool_url: "sigurnost-lanca-opskrbe.html",
      cost:     "besplatno",
      quiz_gap: null,
    },
    {
      id:       "network_security",
      art:      "Čl. 21(2)(e)",
      title:    "Sigurnost mreže i sustava",
      detail:   "Segmentacija mreže, vatrozid, zaštita krajnjih točaka, upravljanje ranjivostima i zakrpama.",
      tool:     "NordLayer — segmentacija mreže za tvrtke",
      tool_url: "https://nordlayer.com/",
      cost:     "od €8/korisnik",
      quiz_gap: null,
    },
    {
      id:       "pentest",
      art:      "Čl. 21(2)(f)",
      title:    "Ocjena učinkovitosti mjera — penetracijski testovi",
      detail:   "Redovito testiranje i revizija implementiranih sigurnosnih mjera, uključujući penetracijske testove.",
      tool:     "Cobalt.io — penetracijski testovi na zahtjev",
      tool_url: "https://cobalt.io/",
      cost:     "individualna ponuda",
      quiz_gap: null,
    },
    {
      id:       "training",
      art:      "Čl. 21(2)(g)",
      title:    "Osposobljavanje iz kibernetičke sigurnosti",
      detail:   "Redovita osposobljavanja zaposlenika iz kiberhigijene. Osposobljavanje uprave zakonska je obveza (Čl. 20).",
      tool:     "KnowBe4 — 14-dnevno besplatno probno razdoblje",
      tool_url: "https://www.knowbe4.com/",
      cost:     "probno 14 dana",
      quiz_gap: "training",
    },
    {
      id:       "crypto_mfa",
      art:      "Čl. 21(2)(h)(i)",
      title:    "Enkripcija, MFA i kontrola pristupa",
      detail:   "Enkripcija podataka u mirovanju i prijenosu. Višefaktorska autentifikacija (MFA) za sve privilegirane račune.",
      tool:     "1Password Business — MFA + upravitelj lozinkama",
      tool_url: "https://1password.com/",
      cost:     "od $7,99/korisnik",
      quiz_gap: "mfa",
    },
    {
      id:       "insurance",
      art:      "Prijenos rizika",
      title:    "Kibernetičko osiguranje (prijenos rizika)",
      detail:   "Nije zahtjev Čl. 21, ali pokriva novčane kazne prema Zakonu o kibernetičkoj sigurnosti, troškove incidenta i prekide poslovanja. Preporučuje se za važne i ključne subjekte.",
      tool:     "Hiscox Cyber — online ponuda za 10 minuta",
      tool_url: "https://hiscox.com/",
      cost:     "online ponuda",
      quiz_gap: "insurance",
    },
  ];

  /* ── State helpers ───────────────────────────────────────────────────── */
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch (e) { return {}; }
  }

  function saveState(state) {
    state._updated = new Date().toLocaleDateString("hr-HR");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /* Read gaps that quiz wrote (array of gap ids like ["isms","training","mfa"]) */
  function getQuizGaps() {
    try { return JSON.parse(sessionStorage.getItem(QUIZ_KEY) || "[]"); }
    catch (e) { return []; }
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  function render() {
    var el = document.getElementById("nis2-tracker");
    if (!el) return;

    var state    = loadState();
    var quizGaps = getQuizGaps();
    var total    = MEASURES.length;
    var done     = MEASURES.filter(function(m) { return state[m.id]; }).length;
    var pct      = Math.round((done / total) * 100);

    var progressColor = pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";

    var html = '<section style="background:#f8fafc;padding:3rem 0;" id="tracker-section">';
    html += '<div class="container">';

    /* Header */
    html += '<div class="section-header" style="margin-bottom:1.5rem;">';
    html += '<h2 style="font-size:1.6rem;font-weight:800;color:var(--navy);">' + S.heading + '</h2>';
    html += '<p style="color:var(--gray-600);margin-top:.4rem;">' + S.subheading + '</p>';
    html += '</div>';

    /* Progress bar */
    html += '<div style="background:#e2e8f0;border-radius:99px;height:12px;margin-bottom:.75rem;overflow:hidden;">';
    html += '<div style="background:' + progressColor + ';width:' + pct + '%;height:100%;border-radius:99px;transition:width .4s ease;"></div>';
    html += '</div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;">';
    html += '<span style="font-weight:700;color:' + progressColor + ';font-size:.95rem;">' + S.progress_text(done, total) + ' (' + pct + '%)</span>';
    if (state._updated) {
      html += '<span style="font-size:.78rem;color:var(--gray-500);">' + S.last_updated + state._updated + '</span>';
    }
    html += '</div>';

    /* Complete banner */
    if (done === total) {
      html += '<div style="background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:1rem 1.25rem;margin-bottom:1.5rem;display:flex;gap:.75rem;align-items:center;">';
      html += '<span style="font-size:1.1rem;">' + S.complete_msg + '</span>';
      html += '<a href="certifikacija-iso-27001.html" style="white-space:nowrap;font-size:.82rem;font-weight:700;color:#166534;">' + S.iso_link_text + '</a>';
      html += '</div>';
    }

    /* Measure cards */
    html += '<div style="display:grid;gap:1rem;">';

    MEASURES.forEach(function(m) {
      var checked    = !!state[m.id];
      var isGap      = quizGaps.length > 0 && m.quiz_gap && quizGaps.indexOf(m.quiz_gap) !== -1;
      var borderColor = checked ? "#86efac" : isGap ? "#fca5a5" : "#e2e8f0";
      var bgColor     = checked ? "#f0fdf4" : isGap ? "#fff5f5" : "#ffffff";

      html += '<div style="background:' + bgColor + ';border:1.5px solid ' + borderColor + ';border-radius:10px;padding:1rem 1.25rem;display:flex;gap:1rem;align-items:flex-start;">';

      /* Checkbox */
      html += '<label style="display:flex;align-items:flex-start;gap:.75rem;cursor:pointer;flex:1;min-width:0;">';
      html += '<input type="checkbox" data-id="' + m.id + '" ';
      html += checked ? 'checked ' : '';
      html += 'style="width:20px;height:20px;flex-shrink:0;margin-top:2px;accent-color:#1e3a5f;cursor:pointer;">';
      html += '<div style="min-width:0;">';

      /* Title row */
      html += '<div style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin-bottom:.25rem;">';
      html += '<span style="font-weight:700;color:var(--navy);font-size:.95rem;">' + m.title + '</span>';
      html += '<span style="font-size:.7rem;background:#e0e7ff;color:#3730a3;padding:.15rem .4rem;border-radius:4px;font-weight:600;">' + m.art + '</span>';
      if (checked) {
        html += '<span style="font-size:.7rem;background:#dcfce7;color:#166534;padding:.15rem .4rem;border-radius:4px;font-weight:700;">✓ ' + S.done_label + '</span>';
      } else if (isGap) {
        html += '<span style="font-size:.7rem;background:#fee2e2;color:#991b1b;padding:.15rem .4rem;border-radius:4px;font-weight:700;">⚠ ' + S.todo_label + '</span>';
      }
      html += '</div>';

      /* Detail */
      html += '<p style="font-size:.82rem;color:var(--gray-600);margin:0 0 .5rem;line-height:1.5;">' + m.detail + '</p>';

      /* CTA (only when not done) */
      if (!checked) {
        var isExternal = m.tool_url.startsWith("http");
        var costBadge  = m.cost === "besplatni plan" || m.cost === "besplatno" || m.cost === "besplatno"
          ? '<span style="font-size:.68rem;background:#dcfce7;color:#166534;padding:.1rem .35rem;border-radius:4px;font-weight:700;margin-left:.35rem;">' + S.free_badge + '</span>'
          : m.cost.indexOf("probno") !== -1
          ? '<span style="font-size:.68rem;background:#dbeafe;color:#1e40af;padding:.1rem .35rem;border-radius:4px;font-weight:700;margin-left:.35rem;">' + S.trial_badge + '</span>'
          : '';
        html += '<a href="' + m.tool_url + '" ';
        html += isExternal ? 'target="_blank" rel="noopener" ' : '';
        html += 'style="display:inline-flex;align-items:center;gap:.3rem;font-size:.8rem;font-weight:700;color:var(--navy);text-decoration:none;border:1px solid var(--navy);border-radius:6px;padding:.3rem .65rem;transition:all .15s;">';
        html += m.tool + costBadge;
        html += '</a>';
      }

      html += '</div></label>';
      html += '</div>';
    });

    html += '</div>'; /* grid */

    /* Reset */
    html += '<div style="margin-top:1.25rem;text-align:right;">';
    html += '<button id="tracker-reset" style="font-size:.75rem;color:var(--gray-500);background:none;border:none;cursor:pointer;text-decoration:underline;">' + S.reset_label + '</button>';
    html += '</div>';

    html += '</div></section>'; /* container, section */

    el.innerHTML = html;

    /* Bind events */
    el.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
      cb.addEventListener("change", function() {
        var s = loadState();
        s[cb.dataset.id] = cb.checked;
        saveState(s);
        render();
      });
    });

    var resetBtn = document.getElementById("tracker-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", function() {
        if (confirm(S.reset_label + "?")) {
          localStorage.removeItem(STORAGE_KEY);
          render();
        }
      });
    }
  }

  /* ── Init ────────────────────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }

})();