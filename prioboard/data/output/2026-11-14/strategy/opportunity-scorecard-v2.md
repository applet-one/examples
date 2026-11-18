---
schema_version: 2
kind: opportunity_scorecard
run_id: '2026-11-14'
clusters_file: output/2026-11-14/discovery/feedback-clusters-v2.md
context_files:
- context/company.md
- context/strategy.md
opportunities:
- cluster_id: manual-onboarding
  dimensions:
    vision_fit:
      score: 4
      rationale: 'context/strategy.md definiert Horizon 2 als Agents, die "ohne Custom-Development bei
        vielen Unternehmen ausrollbar sind". Ein Agent, der sich selbst einführt, ist dafür Voraussetzung:
        Heute weist der Kunde jeden Nutzer von Hand ein (Berg: 4 Stunden, Hartmann: 45–60 Minuten pro
        Kollege). Abzug, weil es den Vision-Filter "AI Agents die Mitarbeiterfähigkeiten ersetzen" nur
        indirekt trifft: Es ersetzt die Einweisung durch Führungskräfte, ist aber ein Modul an einem Agenten
        und kein eigener Agent.'
      references:
      - source: context/strategy.md
        quote: AI Agents die Mitarbeiterfähigkeiten ersetzen
    repeatability:
      score: 5
      rationale: 'In allen 4 Interviews genannt, über vier Branchen (Logistik, Pharma, Finanzen, Bau),
        darunter ein Nicht-Kunde (BauLogik: zwei frühere Lösungen "gescheitert weil das Onboarding zu
        kompliziert war"). Das ist genau das Muster, das context/strategy.md als "Die Brücke" beschreibt:
        "Agent-Typen die branchenübergreifend wiederkehren, werden zu skalierbaren Produkten."'
      references:
      - source: context/strategy.md
        quote: |-
          Agent-Typen die
          branchenübergreifend wiederkehren, werden zu skalierbaren Produkten.
    buildability:
      score: 4
      rationale: 'Technisch niedriges Risiko: Laut Retro 2 wurde das Onboarding-Modul bereits "zum dritten
        Mal […] fast identisch gebaut", der geschätzte Aufwand liegt bei 2 Engineering-Wochen, und es
        passt in den Stack aus context/company.md (N8n, Claude API). Abzug wegen zweier Punkte: Der Constraint
        "jedes Engagement muss positiven Cashflow generieren" (context/strategy.md) ist nicht erfüllt,
        solange es laut Retro 3 "kein klares Zahlungsmodell" gibt; und Marc Hoffmann sieht den Engpass
        im Content ("wer schreibt die Einweisungstexte?"), nicht in der Technik.'
      references:
      - source: context/company.md
        quote: '**Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python.'
      - source: context/strategy.md
        quote: Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren
  conclusion: 'Stärkster Produkt-Kandidat, weil er als einziger Cluster in jeder Branche auftaucht und
    die Custom-Arbeit pro Rollout senkt. Offen ist die Zahlungsbereitschaft: Intern gilt es als "nice
    to have", die Kunden sagen "Das zahle ich extra dafür" (Hartmann) und machen es zur Vorbedingung für
    Folgeaufträge (Berg). Das sollte vor dem Bau mit einem konkreten Preis getestet werden.'
- cluster_id: compliance-checking
  dimensions:
    vision_fit:
      score: 5
      rationale: 'Trifft den Vision-Filter aus context/strategy.md wörtlich: Bei PharmaCare bindet die
        manuelle SOP-Prüfung "etwa 30%" der Zeit der Regulatory-Spezialisten, ein Agent würde "zwei Vollzeit-Stellen
        freischaufeln". Passt auch zu Horizon 1 ("Wir bauen was zahlt und zur Vision passt"): PharmaCare
        ist bereit für ein "ernsthaftes Gespräch über Budget", LogiTrans nennt es "ein klares Budget-Gespräch".'
      references:
      - source: context/strategy.md
        quote: AI Agents die Mitarbeiterfähigkeiten ersetzen
    repeatability:
      score: 3
      rationale: 'Drei Kunden nennen Compliance, aber jeder meint ein anderes Regelwerk: FDA/EMA-Richtlinien
        gegen SOPs (PharmaCare), Lieferkettentransparenz und CO2-Nachweise (LogiTrans), MiFID II und interne
        Revisionen (FinancePlus). Das Bedürfnis kehrt wieder, die Fachlogik nicht. Gemessen an Horizon
        2 ("ohne Custom-Development […] ausrollbar", context/strategy.md) ist das bisher ein Thema für
        regulierte Branchen, kein branchenübergreifender Agent-Typ. Konkret ausformuliert ist der Bedarf
        nur bei PharmaCare.'
      references:
      - source: context/strategy.md
        quote: |-
          Agent-Typen die
          branchenübergreifend wiederkehren, werden zu skalierbaren Produkten.
    buildability:
      score: 3
      rationale: 'Als T&M-Projekt für einen Bestandskunden erfüllt es "Revenue ist Runway" (context/strategy.md)
        und umgeht den Constraint "Kein reines Enterprise Sales", weil das Vertrauen bei PharmaCare schon
        besteht. Abzug aus drei Gründen: Es braucht regulatorisches Fachwissen, das das Team laut context/company.md
        nicht als Stärke führt (in Retro 2 war die Expertise von Dr. Roth "Gold wert"); Fehlurteile in
        einem regulierten Umfeld wiegen schwerer als bei Reporting; und das Team ist mit 4 parallelen
        Projekten "gestreckt" (Cluster 6).'
      references:
      - source: context/company.md
        quote: '**Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python.'
      - source: context/strategy.md
        quote: Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren
  conclusion: 'Das klarste bezahlte Projekt für Horizon 1, aber noch kein Produktmuster: Jede Umsetzung
    wäre fachlich custom. Sinnvoll als T&M-Auftrag für PharmaCare, bei dem bewusst getrennt wird, was
    regelwerksunabhängig ist (Dokumente gegen Richtlinien prüfen, Änderungen verfolgen) und was Pharma-spezifisch
    bleibt.'
- cluster_id: manual-status-reporting
  dimensions:
    vision_fit:
      score: 3
      rationale: 'Statusberichte zu schreiben ist eine Mitarbeiterfähigkeit im Sinne des Vision-Filters
        (context/strategy.md); bei BauLogik kostet die Konsolidierung 6–8 Stunden pro Woche. Die meisten
        Nennungen betreffen aber das eigene Team, und dort bringt eine Lösung Effizienz, keinen Umsatz.
        Für "Wir bauen was zahlt" (context/strategy.md) fehlt ein zahlender Kunde: BauLogik ist noch keiner.'
      references:
      - source: context/strategy.md
        quote: AI Agents die Mitarbeiterfähigkeiten ersetzen
    repeatability:
      score: 3
      rationale: Drei interne Stimmen und eine externe (BauLogik). Die in Retro 3 behauptete Nachfrage
        von FinancePlus und LogiTrans ist im Rohmaterial nicht belegt. Ein branchenübergreifendes Muster
        nach context/strategy.md lässt sich aus einem Nicht-Kunden und dem eigenen Team nicht ableiten.
      references:
      - source: context/strategy.md
        quote: |-
          Agent-Typen die
          branchenübergreifend wiederkehren, werden zu skalierbaren Produkten.
    buildability:
      score: 5
      rationale: 'Nächster Verwandter dessen, was das Team bereits dreimal geliefert hat: Reporting-Agenten
        bei LogiTrans, PharmaCare und FinancePlus. context/company.md nennt "Operative AI-Agent-Implementierung
        in echten Unternehmen" als Stärke, der Stack ist vorhanden, und Marc Hoffmann löst es bereits
        behelfsmäßig mit Claude.'
      references:
      - source: context/company.md
        quote: '**Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python.'
      - source: context/strategy.md
        quote: Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren
  conclusion: Leicht zu bauen, aber als Kundenprodukt bisher nicht belegt. Als internes Tool sinnvoll,
    weil es Zeit freisetzt, die an anderer Stelle fehlt; für eine Produktentscheidung bräuchte es zuerst
    weitere externe Nennungen oder einen Auftrag von BauLogik.
- cluster_id: reusable-delivery-components
  dimensions:
    vision_fit:
      score: 4
      rationale: Wiederverwendbare Komponenten sind der Weg von "Vollständig custom pro Kunde" (context/company.md)
        zu Horizon 2 (context/strategy.md). Abzug, weil es interne Liefer-Infrastruktur ist und selbst
        kein Agent, der eine Mitarbeiterfähigkeit ersetzt; es bringt keinen direkten Umsatz.
      references:
      - source: context/strategy.md
        quote: AI Agents die Mitarbeiterfähigkeiten ersetzen
    repeatability:
      score: 4
      rationale: 'Tritt in jedem eigenen Projekt auf: Onboarding-Modul dreimal fast identisch gebaut (Retro
        2), Onboarding-Dokument "zum dritten mal in zwei monaten" von Hand erstellt (Sarah Klein), in
        Logistik- wie Pharma-Projekt. Abzug, weil alle fünf Stimmen aus dem eigenen Haus kommen.'
      references:
      - source: context/strategy.md
        quote: |-
          Agent-Typen die
          branchenübergreifend wiederkehren, werden zu skalierbaren Produkten.
    buildability:
      score: 4
      rationale: 'Die Bausteine existieren bereits dreifach und müssen konsolidiert, nicht erfunden werden.
        Abzug wegen "Revenue ist Runway" (context/strategy.md): Die Arbeit ist nicht abrechenbar, und
        laut context/company.md arbeiten nur 2 von 14 Leuten an Pattern Recognition, die selbst sagen
        "Wir zwei reichen nicht".'
      references:
      - source: context/company.md
        quote: '**Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python.'
      - source: context/strategy.md
        quote: Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren
  conclusion: 'Keine eigenständige Opportunity, sondern dieselbe Lösung wie Cluster 1 aus Sicht des Lieferteams.
    Die beiden sollten als ein Vorhaben behandelt werden: Ein wiederverwendbares Onboarding-Modul spart
    intern unbudgetierte Tage (Marc Hoffmann: zwei pro Projekt) und ist zugleich das, was Kunden verlangen.'
- cluster_id: reporting-value
  dimensions:
    vision_fit:
      score: 5
      rationale: 'Der Agent ersetzt nachweislich manuelle Arbeit: bei FinancePlus rund 150 Stunden pro
        Jahr, bei PharmaCare haben sich die internen Abstimmungen halbiert. Das ist der Vision-Filter
        aus context/strategy.md in der Praxis und das Kerngeschäft laut context/company.md.'
      references:
      - source: context/strategy.md
        quote: AI Agents die Mitarbeiterfähigkeiten ersetzen
    repeatability:
      score: 4
      rationale: Bei drei Kunden aus drei Branchen im Einsatz, BauLogik beschreibt denselben Bedarf. Nach
        context/strategy.md ist das ein wiederkehrender Agent-Typ. Abzug, weil jede Instanz bisher einzeln
        gebaut wurde und das Material nicht zeigt, wie viel davon gleich ist.
      references:
      - source: context/strategy.md
        quote: |-
          Agent-Typen die
          branchenübergreifend wiederkehren, werden zu skalierbaren Produkten.
    buildability:
      score: 4
      rationale: 'Dreimal geliefert, technisch laut Kunden "einwandfrei". Für Horizon 2 ("ohne Custom-Development",
        context/strategy.md) fehlt aber genau das, was Cluster 1 beschreibt: branchenspezifische Begriffe
        und die Einweisung werden heute von Hand erledigt.'
      references:
      - source: context/company.md
        quote: '**Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python.'
      - source: context/strategy.md
        quote: Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren
  conclusion: Der hohe Score beschreibt ein vorhandenes Asset, keine neue Opportunity. Der Reporting-Agent
    ist der naheliegende erste Produktkandidat, sobald das Onboarding gelöst ist; die Kundenkritik zielt
    ausschließlich darauf.
- cluster_id: team-capacity
  dimensions:
    vision_fit:
      score: 1
      rationale: Kein Agent und keine Mitarbeiterfähigkeit, die ersetzt wird; fällt nicht unter den Vision-Filter
        aus context/strategy.md. Es ist eine Führungsentscheidung.
      references:
      - source: context/strategy.md
        quote: AI Agents die Mitarbeiterfähigkeiten ersetzen
    repeatability:
      score: 2
      rationale: Sechs Stimmen, alle intern. Kein Kunde beschreibt das als eigenes Problem, also kein
        Muster im Sinne der "Brücke" aus context/strategy.md.
      references:
      - source: context/strategy.md
        quote: |-
          Agent-Typen die
          branchenübergreifend wiederkehren, werden zu skalierbaren Produkten.
    buildability:
      score: 2
      rationale: 'Lässt sich nicht bauen, nur entscheiden. Die Constraints aus context/strategy.md schließen
        den einfachen Ausweg aus: ohne externe Finanzierung und mit "Revenue ist Runway" kann das 14-köpfige
        Team (context/company.md) nicht auf Vorrat einstellen.'
      references:
      - source: context/company.md
        quote: '**Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python.'
      - source: context/strategy.md
        quote: Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren
  conclusion: Keine Produktmöglichkeit, sondern die Randbedingung für alle anderen. Sie begrenzt, wie
    viel von Cluster 1 bis 4 parallel möglich ist, und spricht dagegen, Compliance-Projekt und Onboarding-Modul
    gleichzeitig ohne Abstriche zu starten.
---

# Opportunity Scorecard

V2-Demo: Bewertungen aus der vorhandenen Scorecard, mit strukturierten Referenzen. Die Rangfolge misst Produktpotenzial, nicht kurzfristigen Umsatz. Der HR-Fokus der Strategie ist im Rohfeedback nicht abgedeckt; die Stichprobe enthält nur drei Bestandskunden und einen Interessenten.

## Manuelles Nutzer-Onboarding beim Kunden ist die größte Hürde — 13/15

### Fit mit Vision: 4/5

context/strategy.md definiert Horizon 2 als Agents, die "ohne Custom-Development bei vielen Unternehmen ausrollbar sind". Ein Agent, der sich selbst einführt, ist dafür Voraussetzung: Heute weist der Kunde jeden Nutzer von Hand ein (Berg: 4 Stunden, Hartmann: 45–60 Minuten pro Kollege). Abzug, weil es den Vision-Filter "AI Agents die Mitarbeiterfähigkeiten ersetzen" nur indirekt trifft: Es ersetzt die Einweisung durch Führungskräfte, ist aber ein Modul an einem Agenten und kein eigener Agent.

> AI Agents die Mitarbeiterfähigkeiten ersetzen — `context/strategy.md`

### Wiederholbarkeit: 5/5

In allen 4 Interviews genannt, über vier Branchen (Logistik, Pharma, Finanzen, Bau), darunter ein Nicht-Kunde (BauLogik: zwei frühere Lösungen "gescheitert weil das Onboarding zu kompliziert war"). Das ist genau das Muster, das context/strategy.md als "Die Brücke" beschreibt: "Agent-Typen die branchenübergreifend wiederkehren, werden zu skalierbaren Produkten."

> Agent-Typen die
branchenübergreifend wiederkehren, werden zu skalierbaren Produkten. — `context/strategy.md`

### Baubarkeit: 4/5

Technisch niedriges Risiko: Laut Retro 2 wurde das Onboarding-Modul bereits "zum dritten Mal […] fast identisch gebaut", der geschätzte Aufwand liegt bei 2 Engineering-Wochen, und es passt in den Stack aus context/company.md (N8n, Claude API). Abzug wegen zweier Punkte: Der Constraint "jedes Engagement muss positiven Cashflow generieren" (context/strategy.md) ist nicht erfüllt, solange es laut Retro 3 "kein klares Zahlungsmodell" gibt; und Marc Hoffmann sieht den Engpass im Content ("wer schreibt die Einweisungstexte?"), nicht in der Technik.

> **Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python. — `context/company.md`

> Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren — `context/strategy.md`

**Fazit:** Stärkster Produkt-Kandidat, weil er als einziger Cluster in jeder Branche auftaucht und die Custom-Arbeit pro Rollout senkt. Offen ist die Zahlungsbereitschaft: Intern gilt es als "nice to have", die Kunden sagen "Das zahle ich extra dafür" (Hartmann) und machen es zur Vorbedingung für Folgeaufträge (Berg). Das sollte vor dem Bau mit einem konkreten Preis getestet werden.

## Compliance-Checking als nächster Anwendungsfall mit Budget — 11/15

### Fit mit Vision: 5/5

Trifft den Vision-Filter aus context/strategy.md wörtlich: Bei PharmaCare bindet die manuelle SOP-Prüfung "etwa 30%" der Zeit der Regulatory-Spezialisten, ein Agent würde "zwei Vollzeit-Stellen freischaufeln". Passt auch zu Horizon 1 ("Wir bauen was zahlt und zur Vision passt"): PharmaCare ist bereit für ein "ernsthaftes Gespräch über Budget", LogiTrans nennt es "ein klares Budget-Gespräch".

> AI Agents die Mitarbeiterfähigkeiten ersetzen — `context/strategy.md`

### Wiederholbarkeit: 3/5

Drei Kunden nennen Compliance, aber jeder meint ein anderes Regelwerk: FDA/EMA-Richtlinien gegen SOPs (PharmaCare), Lieferkettentransparenz und CO2-Nachweise (LogiTrans), MiFID II und interne Revisionen (FinancePlus). Das Bedürfnis kehrt wieder, die Fachlogik nicht. Gemessen an Horizon 2 ("ohne Custom-Development […] ausrollbar", context/strategy.md) ist das bisher ein Thema für regulierte Branchen, kein branchenübergreifender Agent-Typ. Konkret ausformuliert ist der Bedarf nur bei PharmaCare.

> Agent-Typen die
branchenübergreifend wiederkehren, werden zu skalierbaren Produkten. — `context/strategy.md`

### Baubarkeit: 3/5

Als T&M-Projekt für einen Bestandskunden erfüllt es "Revenue ist Runway" (context/strategy.md) und umgeht den Constraint "Kein reines Enterprise Sales", weil das Vertrauen bei PharmaCare schon besteht. Abzug aus drei Gründen: Es braucht regulatorisches Fachwissen, das das Team laut context/company.md nicht als Stärke führt (in Retro 2 war die Expertise von Dr. Roth "Gold wert"); Fehlurteile in einem regulierten Umfeld wiegen schwerer als bei Reporting; und das Team ist mit 4 parallelen Projekten "gestreckt" (Cluster 6).

> **Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python. — `context/company.md`

> Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren — `context/strategy.md`

**Fazit:** Das klarste bezahlte Projekt für Horizon 1, aber noch kein Produktmuster: Jede Umsetzung wäre fachlich custom. Sinnvoll als T&M-Auftrag für PharmaCare, bei dem bewusst getrennt wird, was regelwerksunabhängig ist (Dokumente gegen Richtlinien prüfen, Änderungen verfolgen) und was Pharma-spezifisch bleibt.

## Status-Reporting wird von Hand erstellt — 11/15

### Fit mit Vision: 3/5

Statusberichte zu schreiben ist eine Mitarbeiterfähigkeit im Sinne des Vision-Filters (context/strategy.md); bei BauLogik kostet die Konsolidierung 6–8 Stunden pro Woche. Die meisten Nennungen betreffen aber das eigene Team, und dort bringt eine Lösung Effizienz, keinen Umsatz. Für "Wir bauen was zahlt" (context/strategy.md) fehlt ein zahlender Kunde: BauLogik ist noch keiner.

> AI Agents die Mitarbeiterfähigkeiten ersetzen — `context/strategy.md`

### Wiederholbarkeit: 3/5

Drei interne Stimmen und eine externe (BauLogik). Die in Retro 3 behauptete Nachfrage von FinancePlus und LogiTrans ist im Rohmaterial nicht belegt. Ein branchenübergreifendes Muster nach context/strategy.md lässt sich aus einem Nicht-Kunden und dem eigenen Team nicht ableiten.

> Agent-Typen die
branchenübergreifend wiederkehren, werden zu skalierbaren Produkten. — `context/strategy.md`

### Baubarkeit: 5/5

Nächster Verwandter dessen, was das Team bereits dreimal geliefert hat: Reporting-Agenten bei LogiTrans, PharmaCare und FinancePlus. context/company.md nennt "Operative AI-Agent-Implementierung in echten Unternehmen" als Stärke, der Stack ist vorhanden, und Marc Hoffmann löst es bereits behelfsmäßig mit Claude.

> **Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python. — `context/company.md`

> Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren — `context/strategy.md`

**Fazit:** Leicht zu bauen, aber als Kundenprodukt bisher nicht belegt. Als internes Tool sinnvoll, weil es Zeit freisetzt, die an anderer Stelle fehlt; für eine Produktentscheidung bräuchte es zuerst weitere externe Nennungen oder einen Auftrag von BauLogik.

## Projektabwicklung ohne wiederverwendbare Bausteine — 12/15

### Fit mit Vision: 4/5

Wiederverwendbare Komponenten sind der Weg von "Vollständig custom pro Kunde" (context/company.md) zu Horizon 2 (context/strategy.md). Abzug, weil es interne Liefer-Infrastruktur ist und selbst kein Agent, der eine Mitarbeiterfähigkeit ersetzt; es bringt keinen direkten Umsatz.

> AI Agents die Mitarbeiterfähigkeiten ersetzen — `context/strategy.md`

### Wiederholbarkeit: 4/5

Tritt in jedem eigenen Projekt auf: Onboarding-Modul dreimal fast identisch gebaut (Retro 2), Onboarding-Dokument "zum dritten mal in zwei monaten" von Hand erstellt (Sarah Klein), in Logistik- wie Pharma-Projekt. Abzug, weil alle fünf Stimmen aus dem eigenen Haus kommen.

> Agent-Typen die
branchenübergreifend wiederkehren, werden zu skalierbaren Produkten. — `context/strategy.md`

### Baubarkeit: 4/5

Die Bausteine existieren bereits dreifach und müssen konsolidiert, nicht erfunden werden. Abzug wegen "Revenue ist Runway" (context/strategy.md): Die Arbeit ist nicht abrechenbar, und laut context/company.md arbeiten nur 2 von 14 Leuten an Pattern Recognition, die selbst sagen "Wir zwei reichen nicht".

> **Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python. — `context/company.md`

> Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren — `context/strategy.md`

**Fazit:** Keine eigenständige Opportunity, sondern dieselbe Lösung wie Cluster 1 aus Sicht des Lieferteams. Die beiden sollten als ein Vorhaben behandelt werden: Ein wiederverwendbares Onboarding-Modul spart intern unbudgetierte Tage (Marc Hoffmann: zwei pro Projekt) und ist zugleich das, was Kunden verlangen.

## Reporting-Agent liefert messbaren Nutzen, Kunden sind zufrieden — 13/15

### Fit mit Vision: 5/5

Der Agent ersetzt nachweislich manuelle Arbeit: bei FinancePlus rund 150 Stunden pro Jahr, bei PharmaCare haben sich die internen Abstimmungen halbiert. Das ist der Vision-Filter aus context/strategy.md in der Praxis und das Kerngeschäft laut context/company.md.

> AI Agents die Mitarbeiterfähigkeiten ersetzen — `context/strategy.md`

### Wiederholbarkeit: 4/5

Bei drei Kunden aus drei Branchen im Einsatz, BauLogik beschreibt denselben Bedarf. Nach context/strategy.md ist das ein wiederkehrender Agent-Typ. Abzug, weil jede Instanz bisher einzeln gebaut wurde und das Material nicht zeigt, wie viel davon gleich ist.

> Agent-Typen die
branchenübergreifend wiederkehren, werden zu skalierbaren Produkten. — `context/strategy.md`

### Baubarkeit: 4/5

Dreimal geliefert, technisch laut Kunden "einwandfrei". Für Horizon 2 ("ohne Custom-Development", context/strategy.md) fehlt aber genau das, was Cluster 1 beschreibt: branchenspezifische Begriffe und die Einweisung werden heute von Hand erledigt.

> **Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python. — `context/company.md`

> Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren — `context/strategy.md`

**Fazit:** Der hohe Score beschreibt ein vorhandenes Asset, keine neue Opportunity. Der Reporting-Agent ist der naheliegende erste Produktkandidat, sobald das Onboarding gelöst ist; die Kundenkritik zielt ausschließlich darauf.

## Kapazitätsengpass und offene Priorisierung — 5/15

### Fit mit Vision: 1/5

Kein Agent und keine Mitarbeiterfähigkeit, die ersetzt wird; fällt nicht unter den Vision-Filter aus context/strategy.md. Es ist eine Führungsentscheidung.

> AI Agents die Mitarbeiterfähigkeiten ersetzen — `context/strategy.md`

### Wiederholbarkeit: 2/5

Sechs Stimmen, alle intern. Kein Kunde beschreibt das als eigenes Problem, also kein Muster im Sinne der "Brücke" aus context/strategy.md.

> Agent-Typen die
branchenübergreifend wiederkehren, werden zu skalierbaren Produkten. — `context/strategy.md`

### Baubarkeit: 2/5

Lässt sich nicht bauen, nur entscheiden. Die Constraints aus context/strategy.md schließen den einfachen Ausweg aus: ohne externe Finanzierung und mit "Revenue ist Runway" kann das 14-köpfige Team (context/company.md) nicht auf Vorrat einstellen.

> **Tech Stack:** N8n (Agent-Orchestrierung), Claude API, OpenAI API, Python. — `context/company.md`

> Revenue ist Runway — jedes Engagement muss positiven Cashflow generieren — `context/strategy.md`

**Fazit:** Keine Produktmöglichkeit, sondern die Randbedingung für alle anderen. Sie begrenzt, wie viel von Cluster 1 bis 4 parallel möglich ist, und spricht dagegen, Compliance-Projekt und Onboarding-Modul gleichzeitig ohne Abstriche zu starten.


