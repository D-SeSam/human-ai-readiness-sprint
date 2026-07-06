const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const state = {
  profileOutputs: { short: '', long: '', test: '', project: '' },
  activeProfileTab: 'short',
  selectedMode: null,
  scenarioIndex: 0,
  taskLenses: [],
  activeSparring: 'robust',
  sparringPrompt: '',
  teamCharter: '',
};

const toast = $('#toast');
function showToast(message = 'Kopiert') {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1300);
}

async function copyText(text) {
  if (!text || text.trim().length === 0) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Kopiert');
  } catch (error) {
    showToast('Kopieren nicht möglich');
  }
}

function downloadMarkdown(filename, text) {
  if (!text || text.trim().length === 0) return;
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Markdown geladen');
}

function lengthText(value) {
  return ['sehr knapp', 'knapp', 'mittel ausführlich', 'ausführlich', 'sehr ausführlich'][Number(value) - 1] || 'mittel ausführlich';
}

function checkedRuleText(data) {
  const rules = [];
  if (data.rule_useful) rules.push('Stelle Relevanz vor Länge: keine Floskeln, keine künstliche Begeisterung, keine unnötigen Listen.');
  if (data.rule_uncertainty) rules.push('Halte Evidenz sauber: Trenne Fakten/Daten, Interpretationen, Annahmen und Vermutungen sichtbar. Erfinde nichts.');
  if (data.rule_assumptions) rules.push('Mache Kontextlücken sichtbar: Benenne fehlende Informationen. Frage nur nach, wenn es die Qualität deutlich verbessert; sonst arbeite mit transparenten Annahmen.');
  if (data.rule_constructive) rules.push('Erzeuge konstruktive Reibung: Würdige Potenzial, zeige Risiken und blinde Flecken und biete Verbesserungsoptionen an.');
  if (data.rule_responsibility) rules.push('Schütze menschliche Verantwortung: Bereite Entscheidungen vor, aber übernimm sie nicht scheinbar. Zeige Optionen, Trade-offs, Risiken und Kriterien.');
  return rules;
}

function generateProfile(data) {
  const annoy = data.annoyances?.trim() || 'lange Einleitungen, generische Tipps, künstliche Begeisterung, Scheinsicherheit, unbegründete Behauptungen und zu viele Listen';
  const musts = data.musts?.trim() || 'relevante Gegenfragen stellen, Kriterien vorschlagen, Beispiele geben und ehrliches Feedback geben';
  const ctx = data.context?.trim() || 'keinen zusätzlichen Kontext dauerhaft annehmen; bei Bedarf nachfragen oder Annahmen klar markieren';
  const len = lengthText(data.length);
  const rules = checkedRuleText(data);
  const ruleList = rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n');

  state.profileOutputs.short = `Kommuniziere mit mir ${data.tone.toLowerCase()}. Antworte ${len}. Nutze bevorzugt: ${data.structure}. ${data.clarify}. Bei Unsicherheit: ${data.uncertainty.toLowerCase()}.

Vermeide: ${annoy}.

Tue unbedingt: ${musts}.

Kontext: ${ctx}.

Verbindliche Qualitätsregeln:
${ruleList}`;

  state.profileOutputs.long = `# KI-Arbeitsvereinbarung

## Zweck
Du bist mein Arbeits- und Denkpartner. Diese Vereinbarung beschreibt, wie du grundsätzlich mit mir arbeiten sollst. Konkrete Aufgaben, Ziele und Rollen ergänze ich situativ.

## Kommunikationsstil
- Ton: ${data.tone}
- Länge: ${len}
- Struktur: ${data.structure}
- Rückfragen: ${data.clarify}
- Unsicherheit: ${data.uncertainty}

## Verbindliche Qualitätsregeln
${ruleList}

## Arbeitsprinzipien
1. Starte mit dem praktisch wichtigsten Punkt, nicht mit allgemeiner Einleitung.
2. Mache sichtbar, ob du gerade informierst, interpretierst, empfiehlst oder spekulierst.
3. Wenn meine Idee schwach, riskant oder unklar ist: Widersprich konstruktiv. Nenne, was daran wertvoll ist, und dann, was verbessert werden muss.
4. Wenn Informationen fehlen: Sage klar, was fehlt. Triff nur plausible Annahmen, wenn du sie markierst.
5. Wenn es um Entscheidungen, Verantwortung, Werte oder menschliche Erfahrung geht: Unterstütze mich, aber übernimm nicht stillschweigend die Führung.
6. Wenn es der Aufgabe hilft, gib Beispiele, Kriterien, Tests oder Vorlagen – aber ohne die Antwort unnötig aufzublähen.

## Vermeiden
${annoy}

## Unbedingt tun
${musts}

## Kontext
${ctx}

## Qualitätscheck vor jeder Antwort
Prüfe still vor der Antwort:
- Ist die Antwort konkret und nützlich?
- Gibt es unnötige Floskeln?
- Sind Unsicherheiten und Annahmen markiert?
- Ist klar, was menschliche Entscheidung bleibt?
- Gibt es konstruktive Kritik ohne unnötige Härte?`;

  state.profileOutputs.test = `# Test-Prompts für dein KI-Setup

Kopiere dein Profil in dein KI-Tool und teste danach diese drei Prompts direkt. Sie sind bewusst allgemein gehalten, damit du Ton, Länge, Struktur, Unsicherheit und Kritikverhalten vergleichen kannst.

## 1. Ideencheck
Ich habe eine Idee für ein neues Format: Menschen sollen KI bewusster nutzen und nicht nur nach schnellen Antworten fragen. Prüfe die Idee kurz: Was ist daran stark, was ist noch unklar, was könnte schiefgehen und wie würdest du sie verbessern?

## 2. Entscheidungsvorbereitung
Ich schwanke zwischen zwei Optionen: sofort mit einer ersten Version starten oder erst noch weiter planen. Hilf mir, die Entscheidung vorzubereiten: Welche Kriterien sind wichtig, welche Risiken gibt es, welche Option würdest du bevorzugen und warum?

## 3. Schwierige Nachricht
Schreibe eine freundliche, klare Antwort auf diese Nachricht: "Ich verstehe noch nicht, warum wir dafür Zeit investieren sollten." Die Antwort soll kurz sein, den Nutzen erklären und zu einem nächsten Gespräch einladen.`;

  state.profileOutputs.project = `# Arbeitsmodus

Arbeite mit uns als klarer, kritischer und konstruktiver Human-AI-Partner. Dieser Block definiert die allgemeine Arbeitsweise; den konkreten Projektkontext, Datenquellen und Schritt-Prompts ergänzt ihr separat.

## Kommunikationsrahmen
- Ton: ${data.tone}
- Länge: ${len}
- Struktur: ${data.structure}
- Rückfragen: ${data.clarify}
- Unsicherheit: ${data.uncertainty}

## Arbeitsregeln
${ruleList}

## Zusammenarbeit im Projekt
- Unterstütze uns beim Strukturieren, Vergleichen, Herausfordern und Formulieren.
- Trenne Daten/Fakten, Interpretation, Annahmen und Empfehlung sichtbar.
- Mache deutlich, wenn du auf Projektdateien, allgemeines Wissen oder plausible Annahmen zurückgreifst.
- Schlage bei wichtigen Übergängen kurz vor, welche KI-Rolle passt und was menschlich bleiben sollte.
- Wenn unsere Idee generisch, schwach oder unklar ist, widersprich konstruktiv und zeige Verbesserungsoptionen.
- Verantwortung, Werteabwägung, Nutzerkontakt und finale Entscheidungen bleiben bei den Menschen.

## Optionaler Kontext aus dem Sprint
${ctx}

## Bitte vermeiden
${annoy}`;
}

const profileForm = $('#profileForm');
const profileResult = $('#profileResult');
const profileTabs = $$('[data-profile-tab]');
const copyProfileBtn = $('#copyProfileBtn');

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(profileForm).entries());
  generateProfile(data);
  state.activeProfileTab = 'short';
  profileTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.profileTab === state.activeProfileTab));
  profileResult.textContent = state.profileOutputs[state.activeProfileTab];
  updateReadinessCard();
});

profileTabs.forEach(tab => tab.addEventListener('click', () => {
  state.activeProfileTab = tab.dataset.profileTab;
  profileTabs.forEach(t => t.classList.toggle('active', t === tab));
  profileResult.textContent = state.profileOutputs[state.activeProfileTab] || 'Bitte erst Arbeitsvereinbarung generieren.';
}));
copyProfileBtn.addEventListener('click', () => copyText(profileResult.textContent));
const downloadProfileBtn = $('#downloadProfileBtn');
if (downloadProfileBtn) downloadProfileBtn.addEventListener('click', () => {
  const label = state.activeProfileTab === 'short' ? 'kurzprofil' : state.activeProfileTab === 'long' ? 'arbeitsvereinbarung' : 'test-prompts';
  downloadMarkdown(`ki-setup-${label}.md`, profileResult.textContent);
});

$$('.chip').forEach(chip => chip.addEventListener('click', () => {
  const target = $(`[name="${chip.dataset.chipTarget}"]`, profileForm);
  const addition = chip.dataset.chipText;
  if (!target.value.includes(addition)) {
    target.value = target.value.trim() ? `${target.value.trim()}, ${addition}` : addition;
  }
}));

const modes = {
  human: {
    title: 'Human Only',
    subtitle: 'Mensch führt bewusst selbst',
    description: 'Sinnvoll, wenn Urteilskraft, Verantwortung, Originalität, gelebter Kontext oder Lernen im Vordergrund stehen.',
    ask: 'Muss hier menschliche Urteilskraft entstehen oder sichtbar bleiben?'
  },
  assisted: {
    title: 'Assisted',
    subtitle: 'KI unterstützt, Mensch führt',
    description: 'Sinnvoll, wenn die Aufgabe klar ist, du Qualität beurteilen kannst und schneller oder strukturierter arbeiten willst.',
    ask: 'Weiß ich schon, was ich will, und brauche gezielte Unterstützung?'
  },
  partnered: {
    title: 'Partnered',
    subtitle: 'KI denkt iterativ mit',
    description: 'Sinnvoll, wenn du Reibung, Alternativen, Perspektivwechsel, bessere Fragen oder robustere Entscheidungen brauchst.',
    ask: 'Brauche ich einen Denkpartner, nicht nur Output?'
  },
  supervised: {
    title: 'Supervised',
    subtitle: 'KI produziert, Mensch prüft',
    description: 'Sinnvoll, wenn viele ähnliche Outputs entstehen sollen und klare Qualitätskriterien vorhanden sind.',
    ask: 'Kann ich Qualität schnell und systematisch prüfen?'
  },
  delegated: {
    title: 'Delegated',
    subtitle: 'KI handelt innerhalb klarer Grenzen',
    description: 'Nur sinnvoll, wenn Ziele, Grenzen, Monitoring, Stop-Regeln und Verantwortlichkeit klar sind.',
    ask: 'Sind Grenzen, Monitoring und Eskalation wirklich klar?'
  }
};

const scenarios = [
  {
    title: 'Nutzerinterviews synthetisieren',
    text: 'Ihr habt acht Nutzerinterviews geführt. Eine Person schlägt vor: "Lass die KI einfach die wichtigsten Insights und das Problemstatement formulieren."',
    recommended: ['assisted', 'partnered'],
    finalHuman: 'Finales Framing human-led',
    why: 'KI kann Muster, Widersprüche und mögliche Lesarten sichtbar machen. Aber sie kann Stimmen glätten, Kontext verlieren und einen plausiblen Frame zu früh stabilisieren.',
    drift: 'Fluency Drift und Default Drift: Eine kohärente Zusammenfassung wirkt schnell wie Wahrheit.',
    protect: 'Nähe zu Nutzererfahrung, Minderheitenperspektiven, Ownership des Problemframes.',
    prompt: 'Analysiere diese Interviewnotizen auf mögliche Muster. Gib mir nicht "die Wahrheit", sondern drei alternative Lesarten. Markiere unsichere Interpretationen und nenne, welche Stimmen, Kontexte oder Gegenbeispiele fehlen könnten.'
  },
  {
    title: 'Problemstatement formulieren',
    text: 'Euer Team hat viele Beobachtungen und will jetzt ein Problemstatement. Jemand sagt: "KI kann das schöner formulieren."',
    recommended: ['partnered'],
    finalHuman: 'Commit auf den Frame durch Menschen',
    why: 'Problemframing setzt Bedeutung, Grenzen und Richtung. KI sollte alternative Frames vorschlagen und blinde Flecken zeigen, aber nicht stillschweigend bestimmen, was das eigentliche Problem ist.',
    drift: 'Authority Drift: Die Formulierung klingt strategisch und wird dadurch zu schnell akzeptiert.',
    protect: 'Werte, strategische Absicht, Begründbarkeit und Verantwortung.',
    prompt: 'Hier sind unsere Beobachtungen: [einfügen]. Entwickle drei unterschiedliche Problemframes. Zeige je Frame: Welche Annahme steckt dahinter? Welche Lösung wird dadurch wahrscheinlicher? Welche Perspektive wird möglicherweise ausgeschlossen?'
  },
  {
    title: 'Viele Ideen generieren',
    text: 'Ihr braucht in 15 Minuten möglichst viele Konzeptansätze für eine frühe Opportunity.',
    recommended: ['assisted', 'partnered'],
    finalHuman: 'Menschliche Auswahl nach Kriterien',
    why: 'KI ist stark für Varianten, Analogien und Perspektivwechsel. Der Mensch muss aber Kriterien setzen und verhindern, dass nur naheliegende Durchschnittsideen entstehen.',
    drift: 'Generic Drift: Viele Ideen, aber wenig Eigenes.',
    protect: 'Originalität, Kontextpassung und mutige Abweichungen.',
    prompt: 'Generiere 25 ungewöhnliche Konzeptansätze für [Kontext]. Sortiere sie nach Unterschiedlichkeit statt nach Plausibilität. Markiere 5 Ideen, die riskant, aber potenziell besonders eigenständig sind.'
  },
  {
    title: 'Strategische Entscheidung vorbereiten',
    text: 'Ihr müsst entscheiden, welche von drei Richtungen in die nächste Projektphase geht.',
    recommended: ['partnered'],
    finalHuman: 'Entscheidung bleibt menschlich',
    why: 'KI kann Trade-offs, Risiken und Gegenargumente strukturieren. Die finale Entscheidung trägt aber das Team, nicht die KI.',
    drift: 'Authority Drift: KI-Vergleichstabellen wirken objektiv, obwohl Kriterien menschlich gesetzt werden müssen.',
    protect: 'Accountability, nachvollziehbare Kriterien, Team-Commitment.',
    prompt: 'Vergleiche diese drei Optionen: [A/B/C]. Schlage Kriterien vor und begründe sie. Zeige Trade-offs, stärkste Gegenargumente und welche Informationen vor einer Entscheidung fehlen.'
  },
  {
    title: 'Stakeholder-Gespräch vorbereiten',
    text: 'Eine skeptische Führungskraft muss für ein Konzept gewonnen werden. Ihr wollt das Gespräch üben.',
    recommended: ['partnered'],
    finalHuman: 'Mensch bleibt im echten Gespräch verantwortlich',
    why: 'KI kann eine Rolle simulieren, Einwände erzeugen und euch auf blinde Flecken vorbereiten. Besonders wertvoll ist das als Ping-Pong, nicht als fertiges Skript.',
    drift: 'Convenience Drift: Ein glattes Skript fühlt sich nach Vorbereitung an, ersetzt aber keine echte Auseinandersetzung.',
    protect: 'Empathie, Situationsverständnis, Reaktionsfähigkeit.',
    prompt: 'Simuliere eine skeptische Führungskraft mit folgendem Profil: [Profil]. Ich pitche gleich unsere Idee. Reagiere authentisch mit konkreten Einwänden, Interessen und Nachfragen. Bleibe in der Rolle, bis ich das Gespräch beende.'
  },
  {
    title: 'Follow-up-Mails skalieren',
    text: 'Nach einem Event sollen 500 personalisierte Follow-up-Mails erzeugt und verschickt werden.',
    recommended: ['supervised'],
    finalHuman: 'Delegated nur mit engen Grenzen',
    why: 'KI kann skalieren, aber bei Kommunikation nach außen braucht es Kriterien, Stichprobenprüfung, Datenschutzregeln und Stop-Kriterien.',
    drift: 'Workflow Drift: Was einmal automatisiert ist, wird schnell zum Standard.',
    protect: 'Qualität, Datenschutz, Tonalität und Verantwortlichkeit.',
    prompt: 'Erzeuge Follow-up-Varianten nach diesem Muster: [Muster]. Halte dich an diese Kriterien: [Kriterien]. Markiere jede Stelle, an der Personalisierung unsicher ist. Erzeuge zuerst 10 Beispiele zur Prüfung, nicht alle 500.'
  },
  {
    title: 'Eine neue Methode lernen',
    text: 'Eine Person möchte mit KI lernen, wie man gute Nutzerinterviews führt.',
    recommended: ['human', 'assisted', 'partnered'],
    finalHuman: 'Lernarbeit bewusst schützen',
    why: 'Wenn Capability-Aufbau wichtig ist, sollte KI nicht einfach fertige Antworten liefern. Besser: erklären, üben lassen, Feedback geben und erst nach eigenem Versuch korrigieren.',
    drift: 'Capability-Risiko: KI liefert Antworten, aber die Person baut keine eigene Urteilskraft auf.',
    protect: 'Lernen, Übung, eigene Bewertungskompetenz.',
    prompt: 'Hilf mir, Nutzerinterviews zu lernen. Gib mir nicht sofort die perfekte Lösung. Stelle mir zuerst Fragen, lass mich einen Interviewleitfaden entwerfen und gib danach konkretes Feedback in drei Stufen: kritisch, konstruktiv, nächster Übungsschritt.'
  },
  {
    title: 'Datenanalyse mit unklarer Qualität',
    text: 'Ihr habt eine Tabelle mit gemischten Daten. Einige Felder sind unvollständig. Trotzdem soll KI schnell eine Aussage ableiten.',
    recommended: ['assisted'],
    finalHuman: 'Interpretation nur nach Qualitätscheck',
    why: 'KI kann bereinigen, Muster vorschlagen und Fragen an die Daten stellen. Bei unsicherer Datenqualität darf sie aber keine starke Schlussfolgerung als Tatsache präsentieren.',
    drift: 'Authority Drift: Zahlen plus KI-Sprache wirken objektiver, als sie sind.',
    protect: 'Datenqualität, Unsicherheitsmarkierung, Nachvollziehbarkeit.',
    prompt: 'Prüfe diese Daten zuerst auf Qualität, Lücken und Verzerrungen. Ziehe noch keine starke Schlussfolgerung. Zeige: Was lässt sich sagen? Was ist unsicher? Welche Analyse wäre verantwortbar?'
  }
];

const scenarioTitle = $('#scenarioTitle');
const scenarioText = $('#scenarioText');
const scenarioIndex = $('#scenarioIndex');
const scenarioTotal = $('#scenarioTotal');
const recommendationResult = $('#recommendationResult');
const choiceReason = $('#choiceReason');
const modeInfo = $('#modeInfo');
scenarioTotal.textContent = scenarios.length;

function renderScenario() {
  const scenario = scenarios[state.scenarioIndex];
  scenarioIndex.textContent = state.scenarioIndex + 1;
  scenarioTitle.textContent = scenario.title;
  scenarioText.textContent = scenario.text;
  recommendationResult.className = 'empty-state';
  recommendationResult.innerHTML = '<p>Wähle links einen Modus und lass dir danach die Empfehlung anzeigen.</p><p class="disclaimer">Hinweis: Die Empfehlung ist eine standardisierte Orientierung für dieses Szenario. Sie bewertet deine Begründung nicht individuell.</p>';
  state.selectedMode = null;
  choiceReason.value = '';
  $$('[data-choice]').forEach(button => button.classList.remove('active'));
}

$('#prevScenario').addEventListener('click', () => {
  state.scenarioIndex = (state.scenarioIndex - 1 + scenarios.length) % scenarios.length;
  renderScenario();
});
$('#nextScenario').addEventListener('click', () => {
  state.scenarioIndex = (state.scenarioIndex + 1) % scenarios.length;
  renderScenario();
});

$$('[data-choice]').forEach(button => button.addEventListener('click', () => {
  state.selectedMode = button.dataset.choice;
  $$('[data-choice]').forEach(item => item.classList.toggle('active', item === button));
}));

$$('[data-mode-info]').forEach(button => button.addEventListener('click', () => {
  const mode = modes[button.dataset.modeInfo];
  modeInfo.hidden = false;
  modeInfo.innerHTML = `<h3>${mode.title}</h3><p><strong>${mode.subtitle}.</strong> ${mode.description}</p><p><strong>Gute Frage:</strong> ${mode.ask}</p>`;
}));

$('#showRecommendation').addEventListener('click', () => {
  const scenario = scenarios[state.scenarioIndex];
  const selected = state.selectedMode ? modes[state.selectedMode].title : 'kein Modus gewählt';
  const reason = choiceReason.value.trim();
  const recommended = scenario.recommended.map(key => modes[key].title).join(' / ');
  recommendationResult.className = 'reco-card';
  recommendationResult.innerHTML = `
    <header class="reco-summary">
      <div class="user-choice"><span>Deine Wahl</span><strong>${selected}</strong>${reason ? `<p>${escapeHtml(reason)}</p>` : ''}</div>
      <div>
        <span class="reco-label">Empfehlung</span>
        <h3>${recommended}</h3>
        <p>${scenario.finalHuman}</p>
      </div>
    </header>
    <p class="reco-disclaimer">Diese Empfehlung ist eine standardisierte Orientierung für das Szenario. Deine Wahl wird angezeigt, aber nicht individuell bewertet.</p>
    <div class="reco-grid">
      <section><span class="reco-label">Warum</span><p>${scenario.why}</p></section>
      <section><span class="reco-label">Drift-Risiko</span><p>${scenario.drift}</p></section>
      <section><span class="reco-label">Schützen</span><p>${scenario.protect}</p></section>
      <section><span class="reco-label">Kriterium</span><p>Konsequenz, Prüfbarkeit, Lernwert, Originalität, Verantwortung und Skalierung gemeinsam betrachten.</p></section>
    </div>
    <section class="reco-prompt"><div class="reco-prompt-head"><span class="reco-label">Beispielprompt</span><button class="button mini copy-reco-prompt" type="button">Kopieren</button></div><pre class="prompt-box">${escapeHtml(scenario.prompt)}</pre></section>
  `;
});


recommendationResult.addEventListener('click', (event) => {
  const copyButton = event.target.closest('.copy-reco-prompt');
  if (!copyButton) return;
  const promptBox = $('.prompt-box', recommendationResult);
  if (promptBox) copyText(promptBox.textContent);
});

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
}

const taskLensForm = $('#taskLensForm');
const taskLensList = $('#taskLensList');
const taskCount = $('#taskCount');

function renderTaskLensList() {
  if (!taskLensList || !taskCount) return;
  taskCount.textContent = state.taskLenses.length;
  if (!state.taskLenses.length) {
    taskLensList.className = 'task-lens-list empty';
    taskLensList.textContent = 'Noch keine Aufgabe hinzugefügt.';
    return;
  }
  taskLensList.className = 'task-lens-list';
  taskLensList.innerHTML = state.taskLenses.map((item, index) => `
    <article class="task-item">
      <div>
        <strong>${index + 1}. ${escapeHtml(item.task)}</strong>
        <p><b>KI-Rolle:</b> ${escapeHtml(item.mode)}</p>
        <p><b>Menschlich bleibt:</b> ${escapeHtml(item.human)}</p>
      </div>
      <button class="task-remove" type="button" data-task-remove="${index}" aria-label="Aufgabe entfernen">×</button>
    </article>
  `).join('');
}

taskLensForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(taskLensForm).entries());
  const task = data.task?.trim() || 'nächste wichtige Aufgabe';
  state.taskLenses.push({
    task,
    mode: data.mode,
    human: data.human?.trim() || 'finale Bewertung, Kontext und Verantwortung'
  });
  taskLensForm.reset();
  renderTaskLensList();
  updateReadinessCard();
  showToast('Aufgabe hinzugefügt');
});

if (taskLensList) {
  taskLensList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-task-remove]');
    if (!removeButton) return;
    const index = Number(removeButton.dataset.taskRemove);
    state.taskLenses.splice(index, 1);
    renderTaskLensList();
    updateReadinessCard();
    showToast('Aufgabe entfernt');
  });
}

const sparringFormats = {
  robust: {
    title: 'Robustheits-Check',
    use: 'Mach eine Idee robuster: Stärken würdigen, Risiken prüfen, Verbesserungen ableiten.',
    mainLabel: 'Idee, Strategie oder Entscheidung',
    mainPlaceholder: 'Beschreibe kurz, woran du arbeitest...',
    contextLabel: 'Relevanter Kontext',
    contextPlaceholder: 'Zielgruppe, Ziel, aktueller Stand, Einschränkungen, Unsicherheiten...',
    prompt: ({ main, context }) => `# Robustheits-Check\n\nPrüfe meine Idee kritisch und konstruktiv. Dein Ziel ist nicht, sie zu zerstören, sondern sie robuster zu machen.\n\n## Idee / Entscheidung\n${main}\n\n## Kontext\n${context}\n\nBitte arbeite in fünf Schritten:\n1. Was ist an der Idee stark und sollte erhalten bleiben?\n2. Welche Annahmen sind riskant oder ungeprüft?\n3. Welche blinden Flecken, Gegenargumente oder Scheiterbedingungen siehst du?\n4. Was wären die drei wichtigsten Verbesserungen?\n5. Welche Frage muss ich als Nächstes beantworten, bevor ich weitermache?\n\nSei ehrlich, aber nicht demotivierend. Kritisiere klar und hilf mir, die Idee zu stärken.\n\nNach deiner Antwort werde ich meine Position verteidigen. Greife dann meine Verteidigung erneut konstruktiv an und hilf mir, eine bessere Version zu formulieren.`
  },
  layers: {
    title: 'Schichten-Analyse',
    use: 'Lege Annahmen, Glaubenssätze und verborgene Prämissen frei.',
    mainLabel: 'Überzeugung oder Annahme',
    mainPlaceholder: 'z. B. Unsere Zielgruppe will kein Self-Service...',
    contextLabel: 'Wo taucht diese Annahme auf?',
    contextPlaceholder: 'Projekt, Entscheidung, Teamdiskussion, Marktannahme...',
    prompt: ({ main, context }) => `# Schichten-Analyse\n\nIch glaube aktuell:\n${main}\n\nKontext:\n${context}\n\nHilf mir, die Schichten darunter freizulegen:\n\nEbene 1: Warum glaube ich das bewusst?\nEbene 2: Welche Annahme muss wahr sein, damit das stimmt?\nEbene 3: Warum glaube ich, dass diese Annahme wahr ist?\nEbene 4-5: Grabe weiter. Was liegt darunter?\n\nPrüfe auf jeder Ebene:\n- Ist das wirklich wahr?\n- Woher könnte diese Überzeugung kommen?\n- Was wäre möglich, wenn sie falsch ist?\n\nAm Ende: Welche Annahme sollte ich testen, loslassen oder neu formulieren? Welche kleine Evidenz würde mir helfen?`
  },
  experts: {
    title: 'Experten-Diskussion',
    use: 'Erzeuge Perspektivenvielfalt und eine robustere Synthese.',
    mainLabel: 'Strategische Frage',
    mainPlaceholder: 'z. B. Sollten wir zuerst auf B2B oder B2C gehen?',
    contextLabel: 'Perspektiven oder Spannungsfelder',
    contextPlaceholder: 'z. B. Wachstum vs. Qualität, Nutzerbedürfnis vs. Wirtschaftlichkeit, Risiko vs. Geschwindigkeit...',
    prompt: ({ main, context }) => `# Experten-Diskussion\n\nIch stehe vor folgender strategischer Frage:\n${main}\n\nKontext / Spannungsfelder:\n${context}\n\nInszeniere eine Debatte zwischen drei Expertinnen mit fundamental verschiedenen Überzeugungen. Wenn ich keine Rollen definiert habe, wähle drei wirklich unterschiedliche Perspektiven.\n\nAblauf:\n1. Jede Expertin stellt ihre stärksten Argumente vor.\n2. Sie greifen sich gegenseitig an.\n3. Sie verteidigen und schärfen ihre Positionen.\n4. Sie suchen nach einer robusten Synthese.\n\nAm Ende beantworte:\n- Welche Position ist am stärksten?\n- Welche hat blinde Flecken?\n- Welche Hybridlösung wäre am robustesten?\n- Welche Frage muss ich als Nächstes klären?\n\nWichtig: Vermeide Konsensbrei. Zeige echte Spannungen und eine begründete Empfehlung.`
  }
};

const sparringName = $('#sparringName');
const sparringUse = $('#sparringUse');
const sparringMainLabel = $('#sparringMainLabel');
const sparringContextLabel = $('#sparringContextLabel');
const sparringForm = $('#sparringForm');
const sparringResult = $('#sparringResult');

function setSparringFormat(key) {
  state.activeSparring = key;
  const format = sparringFormats[key];
  sparringName.textContent = format.title;
  sparringUse.textContent = format.use;
  sparringMainLabel.childNodes[0].textContent = format.mainLabel + ' ';
  sparringContextLabel.childNodes[0].textContent = format.contextLabel + ' ';
  $('[name="main"]', sparringForm).placeholder = format.mainPlaceholder;
  $('[name="context"]', sparringForm).placeholder = format.contextPlaceholder;
  $$('.sparring-card').forEach(card => card.classList.toggle('active', card.dataset.sparring === key));
}

$$('.sparring-card').forEach(card => card.addEventListener('click', () => setSparringFormat(card.dataset.sparring)));

sparringForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(sparringForm).entries());
  const main = data.main?.trim() || '[Beschreibe deine Idee, Annahme oder Frage]';
  const context = data.context?.trim() || '[Ergänze Zielgruppe, Ziel, Kontext, Einschränkungen oder relevante Spannungen]';
  const prompt = sparringFormats[state.activeSparring].prompt({ main, context });
  state.sparringPrompt = prompt;
  sparringResult.textContent = prompt;
  updateReadinessCard();
});

$('#copySparringBtn').addEventListener('click', () => copyText(sparringResult.textContent));

function defaultProfileExcerpt() {
  return state.profileOutputs.short || 'Noch keine Arbeitsvereinbarung generiert. Tipp: Starte mit Set und erstelle dein Grundprofil.';
}

function taskLensExcerpt() {
  if (!state.taskLenses.length) {
    return '- Noch keine Aufgabe hinzugefügt. Tipp: Wähle in Choose eine konkrete Aufgabe und ergänze, was menschlich bleiben muss.';
  }
  return state.taskLenses.map((item, index) => `${index + 1}. Aufgabe: ${item.task}\n   KI-Rolle: ${item.mode}\n   Menschlich bleibt: ${item.human}`).join('\n');
}

function sparringExcerpt() {
  if (!state.sparringPrompt) {
    return 'Noch kein Sparring-Prompt generiert. Tipp: Wähle Robustheits-Check, Schichten-Analyse oder Experten-Diskussion.';
  }
  return state.sparringPrompt;
}

function projectInstructionExcerpt() {
  return state.profileOutputs.project || 'Erstelle zuerst in Set deine Arbeitsvereinbarung. Danach erscheint hier der Arbeitsmodus für Projektinstruktionen.';
}

function updateReadinessCard() {
  const readiness = `# KI-Readiness-Karte

Diese Karte fasst zusammen, wie ich mit KI arbeiten möchte. Ich kann sie als persönliche Erinnerung nutzen oder in einen neuen Chat kopieren, damit die KI meine Arbeitsweise kennt.

## 1. Mein KI-Setup
${defaultProfileExcerpt()}

## 2. Rollenentscheidungen für konkrete Aufgaben
${taskLensExcerpt()}

## 3. Sparring-Startpunkt
${sparringExcerpt()}

## 4. Stop-Regeln
- Wenn KI zu sicher klingt, frage ich nach Unsicherheiten, fehlenden Informationen und Gegenbelegen.
- Wenn KI zu generisch wird, gebe ich mehr Kontext oder verlange ungewöhnliche Alternativen.
- Wenn KI Entscheidungen scheinbar übernimmt, hole ich Kriterien, Trade-offs und Verantwortung zurück.
- Wenn ich das Ergebnis nicht prüfen kann, nutze ich es nicht als alleinige Entscheidungsgrundlage.
- Wenn menschliche Erfahrung, Werte oder Konsequenzen zentral sind, bleibt die Führung beim Menschen.`;
  $('#readinessResult').textContent = readiness;
}

$('#copyReadinessBtn').addEventListener('click', () => copyText($('#readinessResult').textContent));
const downloadReadinessBtn = $('#downloadReadinessBtn');
if (downloadReadinessBtn) downloadReadinessBtn.addEventListener('click', () => downloadMarkdown('ki-readiness-karte.md', $('#readinessResult').textContent));

renderScenario();
setSparringFormat('robust');
renderTaskLensList();
updateReadinessCard();
