---
schema_version: 2
kind: feedback_clusters
run_id: '2026-11-14'
sources:
- input/raw_feedback/slack.md
- input/raw_feedback/emails.md
- input/raw_feedback/customer_interviews.md
- input/raw_feedback/internal_docs.md
clusters:
- id: manual-onboarding
  title: Manuelles Nutzer-Onboarding beim Kunden ist die größte Hürde
  summary: Kunden müssen ihre Kollegen selbst in den Agenten einweisen; das kostet Stunden, bindet Führungskräfte
    und führt trotzdem zu Rückfragen. Gewünscht wird eine Einführung, die der Agent selbst übernimmt (interaktiv,
    Schritt für Schritt, mit branchenspezifischen Begriffen).
  mentions:
  - id: financeplus-berg
    label: Thomas Berg · FinancePlus
  - id: logitrans-hartmann
    label: Peter Hartmann · LogiTrans
  - id: pharmacare-roth
    label: Dr. Sabine Roth · PharmaCare
  - id: baulogik-pfeiffer
    label: Sandra Pfeiffer · BauLogik
  evidence:
  - mention_id: financeplus-berg
    source: input/raw_feedback/customer_interviews.md
    locator: Interview 3
    speaker: Thomas Berg
    quote: Ich habe meinen Kollegen Markus selbst eingewiesen — das hat vier Stunden gedauert. Dann hat
      er drei Mal nachgefragt, weil er Details vergessen hatte.
  - mention_id: logitrans-hartmann
    source: input/raw_feedback/emails.md
    locator: Thread 1
    speaker: Peter Hartmann
    quote: Wir mussten beim Go-Live vier Kollegen manuell in die Bedienung einweisen. Das hat jeweils
      45-60 Minuten gedauert.
  - mention_id: pharmacare-roth
    source: input/raw_feedback/customer_interviews.md
    locator: Interview 2
    speaker: Dr. Sabine Roth
    quote: Das letzte Mal haben wir vier Stunden Schulung gemacht, und trotzdem habe ich danach wochenlang
      Fragen gekriegt.
  - mention_id: baulogik-pfeiffer
    source: input/raw_feedback/customer_interviews.md
    locator: Interview 4
    speaker: Sandra Pfeiffer
    quote: Beide sind gescheitert weil das Onboarding zu kompliziert war.
  contradictions:
  - text: 'Zahlungsbereitschaft: Felix Braun schreibt, Kunden sähen Reporting und Onboarding "eher als
      ''nice to have''" und "würden es nur nehmen wenns günstig ist" (slack.md, #allgemein). Dem stehen
      die Kundenaussagen gegenüber: Hartmann "Das zahle ich extra dafür", Roth "Kaufargument", Berg "erstmal
      möchte ich sehen dass das Onboarding-Problem gelöst ist, bevor ich mehr investiere" (alle customer_interviews.md).'
    sources:
    - input/raw_feedback/slack.md
    - input/raw_feedback/customer_interviews.md
  - text: 'Zeitaufwand: Retro 3 nennt "2-8 Stunden pro Nutzer" (internal_docs.md); LogiTrans berichtet
      45–60 Minuten pro Kollege (emails.md, Thread 1), FinancePlus 4 Stunden bzw. "fast einen halben Tag"
      (customer_interviews.md, emails.md Thread 4).'
    sources:
    - input/raw_feedback/emails.md
    - input/raw_feedback/customer_interviews.md
    - input/raw_feedback/internal_docs.md
  - text: 'Zählweise: Kai Schmidt zählt "4 Kunden" und rechnet dabei "das interne Feedback von Sarah"
      mit (emails.md, Thread 3); Retro 3 zählt "4 von 5 analysierten Projekten" und rechnet das BauLogik-Gespräch
      mit (internal_docs.md).'
    sources:
    - input/raw_feedback/emails.md
    - input/raw_feedback/internal_docs.md
- id: compliance-checking
  title: Compliance-Checking als nächster Anwendungsfall mit Budget
  summary: Drei Kunden beschreiben manuelle Compliance-Arbeit als konkreten, bezifferbaren Aufwand und
    signalisieren Budget. Am weitesten ist PharmaCare (SOPs gegen FDA/EMA-Richtlinien), LogiTrans nennt
    Lieferketten-/CO2-Reports, FinancePlus MiFID II und interne Revisionen.
  mentions:
  - id: pharmacare-roth
    label: Dr. Sabine Roth · PharmaCare
  - id: logitrans-hartmann
    label: Peter Hartmann · LogiTrans
  - id: financeplus-berg
    label: Thomas Berg · FinancePlus
  evidence:
  - mention_id: pharmacare-roth
    source: input/raw_feedback/customer_interviews.md
    locator: Interview 2
    speaker: Dr. Sabine Roth
    quote: Wir prüfen unsere SOPs manuell gegen FDA und EMA-Richtlinien. Das ist stupide Arbeit. Meine
      Regulatory-Spezialisten verbringen dafür etwa 30% ihrer Zeit.
  - mention_id: logitrans-hartmann
    source: input/raw_feedback/customer_interviews.md
    locator: Interview 1
    speaker: Peter Hartmann
    quote: Das kostet uns momentan pro Quartal zwei Vollzeit-Arbeitstage. Wenn Sie das automatisieren
      können, ist das ein klares Budget-Gespräch.
  - mention_id: financeplus-berg
    source: input/raw_feedback/customer_interviews.md
    locator: Interview 3
    speaker: Thomas Berg
    quote: Wir haben viele Compliance-Anforderungen im Finanzbereich — MiFID II, interne Revisionen. Wenn
      da ein Agent helfen kann, bin ich sofort dabei.
  contradictions:
  - text: 'Verbreitung: Julia Meyer schreibt, alle drei Muster tauchten "bei >3 kunden" auf (slack.md,
      #allgemein). Retro 3 schreibt zu Compliance "Nur bei 2 Kunden bisher", zählt in derselben Zeile
      aber drei auf ("PharmaCare, FinancePlus implizit, LogiTrans erwähnt für Lieferkette") (internal_docs.md).'
    sources:
    - input/raw_feedback/slack.md
    - input/raw_feedback/internal_docs.md
  - text: 'Zitat-Zuordnung: Retro 3 führt "LogiTrans: ''zahle ich extra dafür''" als Beleg für Compliance-Zahlungsbereitschaft
      an (internal_docs.md). Im Interview fällt dieser Satz zum Onboarding; zu Compliance sagt Hartmann
      "ein klares Budget-Gespräch" (customer_interviews.md).'
    sources:
    - input/raw_feedback/customer_interviews.md
    - input/raw_feedback/internal_docs.md
  - text: 'FinancePlus – Reihenfolge: Marc Hoffmann meldet, FinancePlus wolle "jetzt auch was für compliance"
      (slack.md, 11. März). Im Interview vom selben Tag macht Berg das Onboarding zur Vorbedingung: "Aber
      erstmal möchte ich sehen dass das Onboarding-Problem gelöst ist, bevor ich mehr investiere" (customer_interviews.md).'
    sources:
    - input/raw_feedback/slack.md
    - input/raw_feedback/customer_interviews.md
  - text: 'Zuschnitt: Retro 2 will Compliance-Checking "als Zusatzmodul" anbieten (internal_docs.md);
      Anna Wagner zu FinancePlus: "wäre ein neues projekt, kein add-on" (slack.md, #projektteam).'
    sources:
    - input/raw_feedback/slack.md
    - input/raw_feedback/internal_docs.md
- id: manual-status-reporting
  title: Status-Reporting wird von Hand erstellt
  summary: Status-Updates an Kunden bzw. an die Geschäftsleitung werden wiederholt manuell zusammengestellt.
    Die Betroffenen schlagen selbst vor, das einem Agenten zu überlassen.
  mentions:
  - id: sarah-klein
    label: Sarah Klein · NeoEmployee
  - id: marc-hoffmann
    label: Marc Hoffmann · NeoEmployee
  - id: tom-bauer
    label: Tom Bauer · NeoEmployee
  - id: baulogik-pfeiffer
    label: Sandra Pfeiffer · BauLogik
  evidence:
  - mention_id: sarah-klein
    source: input/raw_feedback/slack.md
    locator: '#projektteam · 14. März'
    speaker: Sarah Klein
    quote: drei kunden haben diese woche nach status gefragt und ich musste jedes mal manuell zusammenstellen
      was wir gemacht haben. das kostet mich jedes mal 20-30 min.
  - mention_id: marc-hoffmann
    source: input/raw_feedback/slack.md
    locator: '#projektteam · 14. März'
    speaker: Marc Hoffmann
    quote: 100% agree. ich hab das gleiche problem. und der tone muss ja auch immer auf den kunden angepasst
      werden.
  - mention_id: tom-bauer
    source: input/raw_feedback/emails.md
    locator: Thread 5
    speaker: Tom Bauer
    quote: Ich schreibe jede Woche den gleichen Status-E-Mail von Hand. Wäre das nicht ein Fall für einen
      eigenen Agenten?
  - mention_id: baulogik-pfeiffer
    source: input/raw_feedback/customer_interviews.md
    locator: Interview 4
    speaker: Sandra Pfeiffer
    quote: Jede Woche erstellt jeder Projektleiter seinen eigenen Statusbericht, verschickt ihn, dann
      konsolidiere ich das manuell für die Geschäftsleitung. Allein das kostet mich 6-8 Stunden pro Woche.
  contradictions:
  - text: 'Externe Nachfrage nicht im Rohmaterial belegt: Retro 3 schreibt, FinancePlus (Thomas Berg)
      und LogiTrans (Peter Hartmann) hätten Status-Reporting "als ''nice to have'' erwähnt" (internal_docs.md).
      In deren Interviews und E-Mails findet sich keine solche Aussage; einzige externe Nennung ist BauLogik.'
    sources:
    - input/raw_feedback/internal_docs.md
  - text: 'Internes Tool oder Kundenprodukt: Retro 3 empfiehlt "für internen Gebrauch automatisieren (Team-Effizienz,
      kein Kundenprodukt)" (internal_docs.md); Julia Meyer führt Status-Reporting als eines von "3 potenzielle[n]
      produktmuster[n]" (slack.md), und BauLogik beschreibt es als ihren Hauptbedarf (customer_interviews.md).'
    sources:
    - input/raw_feedback/slack.md
    - input/raw_feedback/customer_interviews.md
    - input/raw_feedback/internal_docs.md
- id: reusable-delivery-components
  title: Projektabwicklung ohne wiederverwendbare Bausteine
  summary: Aus Sicht des eigenen Teams wird Onboarding-Material und sogar das Onboarding-Modul selbst
    in jedem Projekt neu gebaut. Es fehlen Templates, Playbooks und eine wiederverwendbare Komponente;
    der Aufwand ist nicht budgetiert.
  mentions:
  - id: sarah-klein
    label: Sarah Klein · NeoEmployee
  - id: felix-braun
    label: Felix Braun · NeoEmployee
  - id: tom-bauer
    label: Tom Bauer · NeoEmployee
  - id: marc-hoffmann
    label: Marc Hoffmann · NeoEmployee
  evidence:
  - mention_id: sarah-klein
    source: input/raw_feedback/emails.md
    locator: Thread 5
    speaker: Sarah Klein
    quote: Die Art wie wir Kunden onboarden. Jedes Projekt fängt bei null an. Kein Template, kein Playbook.
      Das ist ineffizient und fehleranfällig.
  - mention_id: felix-braun
    source: input/raw_feedback/internal_docs.md
    locator: Retro 2
    speaker: Felix Braun
    quote: Wir haben bei diesem Projekt zum dritten Mal dasselbe Onboarding-Modul fast identisch gebaut.
      Irgendwann muss das eine wiederverwendbare Komponente werden.
  - mention_id: tom-bauer
    source: input/raw_feedback/slack.md
    locator: '#projektteam · 10. März'
    speaker: Tom Bauer
    quote: ich glaub das macht noch keiner systematisch. beim pharma-kunden letzten monat hab ich das
      auch händisch zusammengesucht
  - mention_id: marc-hoffmann
    source: input/raw_feedback/internal_docs.md
    locator: Retro 1
    speaker: Marc Hoffmann
    quote: Das Onboarding hat uns bei diesem Projekt zwei volle Arbeitstage gekostet, die ich nicht budgetiert
      hatte.
  contradictions:
  - text: 'Wo der Engpass liegt: Julia Meyer und Felix Braun beschreiben ein Komponenten-Problem ("Onboarding-Modul
      als wiederverwendbare Komponente", internal_docs.md). Marc Hoffmann: "Der Engpass bei Onboarding
      ist nicht die Technik sondern der Content — wer schreibt die Einweisungstexte?" (emails.md, Thread
      3).'
    sources:
    - input/raw_feedback/emails.md
    - input/raw_feedback/internal_docs.md
- id: reporting-value
  title: Reporting-Agent liefert messbaren Nutzen, Kunden sind zufrieden
  summary: Alle drei Bestandskunden bewerten den Reporting-Agenten positiv, teils mit Zahlen. Die Kritik
    richtet sich durchgehend auf die Einführung, nicht auf die Technik.
  mentions:
  - id: logitrans-hartmann
    label: Peter Hartmann · LogiTrans
  - id: financeplus-berg
    label: Thomas Berg · FinancePlus
  - id: pharmacare-roth
    label: Dr. Sabine Roth · PharmaCare
  evidence:
  - mention_id: logitrans-hartmann
    source: input/raw_feedback/emails.md
    locator: Thread 1
    speaker: Peter Hartmann
    quote: Der Reporting-Agent funktioniert technisch einwandfrei — die Berichte kommen pünktlich, das
      Format passt.
  - mention_id: financeplus-berg
    source: input/raw_feedback/customer_interviews.md
    locator: Interview 3
    speaker: Thomas Berg
    quote: Drei Stunden pro Woche weniger manuelle Reporting-Arbeit. Bei sechs Nutzern über ein Jahr sind
      das 150+ Arbeitsstunden.
  - mention_id: pharmacare-roth
    source: input/raw_feedback/customer_interviews.md
    locator: Interview 2
    speaker: Dr. Sabine Roth
    quote: Früher hat jeder seinen eigenen Excel geführt. Jetzt kommt alles aus einer Quelle. Das allein
      hat unsere internen Abstimmungen halbiert.
  contradictions:
  - text: 'Bezugsgröße der Zeitersparnis unklar: Im Interview nennt Berg 3 Stunden pro Woche und rechnet
      "bei sechs Nutzern über ein Jahr" auf "150+ Arbeitsstunden" (customer_interviews.md); in der E-Mail
      "3 Stunden pro Woche weniger manuelle Arbeit, das sind bei unserem Team fast 150 Stunden pro Jahr"
      (emails.md, Thread 4). Ob die 3 Stunden pro Person oder fürs gesamte Team gelten, geht aus dem Material
      nicht hervor. Berg selbst: "keine wissenschaftliche Studie".'
    sources:
    - input/raw_feedback/emails.md
    - input/raw_feedback/customer_interviews.md
- id: team-capacity
  title: Kapazitätsengpass und offene Priorisierung
  summary: Das Team beschreibt sich als ausgelastet, und die Reihenfolge zwischen Compliance-Checking
    und Onboarding-Automatisierung ist nicht entschieden. Zwei Lager sind erkennbar; ein Beschluss liegt
    nicht vor.
  mentions:
  - id: kai-schmidt
    label: Kai Schmidt · NeoEmployee
  - id: anna-wagner
    label: Anna Wagner · NeoEmployee
  - id: julia-meyer
    label: Julia Meyer · NeoEmployee
  evidence:
  - mention_id: kai-schmidt
    source: input/raw_feedback/slack.md
    locator: '#strategie · 11. März'
    speaker: Kai Schmidt
    quote: revenue ist ok aber wir haben 4 projekte parallel und das team ist gestreckt. müssen überlegen
      ob wir den nächsten kunden noch annehmen oder erst mal liefern
  - mention_id: anna-wagner
    source: input/raw_feedback/slack.md
    locator: '#strategie · 11. März'
    speaker: Anna Wagner
    quote: lieber weniger projekte die wirklich gut werden als viele die so la la sind
  - mention_id: julia-meyer
    source: input/raw_feedback/internal_docs.md
    locator: Pattern-Team Weekly · TOP 3
    speaker: Julia Meyer
    quote: Wir zwei reichen nicht. Für eine solide Analyse bräuchten wir mindestens eine dritte Person,
      zumindest part-time.
  contradictions:
  - text: 'Onboarding zuerst vs. Compliance zuerst: Julia Meyer: "Wenn wir 2 Engineering-Wochen bekommen:
      Onboarding-Modul als wiederverwendbare Komponente. Das würde alle unsere zukünftigen Projekte günstiger
      machen." Felix Braun: "Ich würde Compliance-Checking vorziehen weil da konkret Geld liegt. PharmaCare
      wartet auf ein Angebot." (beide internal_docs.md, Pattern-Team Weekly)'
    sources:
    - input/raw_feedback/internal_docs.md
  - text: 'Entweder/oder vs. parallel: Anna Wagner: "Müssen wir nicht entweder/oder entscheiden." Marc
      Hoffmann: "Compliance-Checking als nächstes bezahltes Projekt (PharmaCare), Onboarding-Automatisierung
      als internes Experiment parallel dazu. Ergebnisse in 8 Wochen zusammenführen." (emails.md, Thread
      3, 12. März). Einen Tag später endet das Pattern-Team-Meeting dennoch ohne Beschluss (internal_docs.md,
      13. März).'
    sources:
    - input/raw_feedback/emails.md
    - input/raw_feedback/internal_docs.md
  - text: 'Parallel vs. Auslastung: Der Vorschlag, beides parallel zu machen (emails.md, Thread 3), steht
      neben der Aussage, das Team sei mit 4 parallelen Projekten "gestreckt" (slack.md, #strategie). Im
      Material wird dieser Konflikt nicht aufgelöst.'
    sources:
    - input/raw_feedback/slack.md
    - input/raw_feedback/emails.md
  - text: 'Produkt vs. Modul: Kai Schmidt fragt, ob man Onboarding-Automatisierung "als Produkt testen"
      solle; Anna Wagner will es "als ''Modul'' framen, nicht als eigenes Produkt. Produkt hat bei uns
      intern immer Erwartungen geweckt die wir dann nicht erfüllt haben." (emails.md, Thread 3)'
    sources:
    - input/raw_feedback/emails.md
outliers:
- text: 'Kunden wollen den Agenten selbst weiterentwickeln: David Müller beschreibt nicht eingeplante
    Unterstützung für Dr. Roth. Bisher nur eine Nennung.'
  sources:
  - input/raw_feedback/internal_docs.md
- text: 'Interne Mitarbeiter-Einführung: David Müller berichtet einerseits von einem guten Start für Lars,
    andererseits von fehlender Systematik. Nicht mit dem Kunden-Onboarding gleichsetzen.'
  sources:
  - input/raw_feedback/slack.md
  - input/raw_feedback/emails.md
- text: Interview-Aufzeichnungen sind für Lisa Chen im Drive nicht auffindbar. Einzelfall zur internen
    Ablage.
  sources:
  - input/raw_feedback/slack.md
---

# Feedback-Cluster

V2-Demo: auf Basis der vorhandenen Analyse; Stimmenzählung und Zitate für das strukturierte Schema präzisiert. Keine neuen Kundenbefragungen.

## Manuelles Nutzer-Onboarding beim Kunden ist die größte Hürde

**Unabhängige Stimmen:** 4

Kunden müssen ihre Kollegen selbst in den Agenten einweisen; das kostet Stunden, bindet Führungskräfte und führt trotzdem zu Rückfragen. Gewünscht wird eine Einführung, die der Agent selbst übernimmt (interaktiv, Schritt für Schritt, mit branchenspezifischen Begriffen).

### Belege

- „Ich habe meinen Kollegen Markus selbst eingewiesen — das hat vier Stunden gedauert. Dann hat er drei Mal nachgefragt, weil er Details vergessen hatte.“ — Thomas Berg, `input/raw_feedback/customer_interviews.md`, Interview 3
- „Wir mussten beim Go-Live vier Kollegen manuell in die Bedienung einweisen. Das hat jeweils 45-60 Minuten gedauert.“ — Peter Hartmann, `input/raw_feedback/emails.md`, Thread 1
- „Das letzte Mal haben wir vier Stunden Schulung gemacht, und trotzdem habe ich danach wochenlang Fragen gekriegt.“ — Dr. Sabine Roth, `input/raw_feedback/customer_interviews.md`, Interview 2
- „Beide sind gescheitert weil das Onboarding zu kompliziert war.“ — Sandra Pfeiffer, `input/raw_feedback/customer_interviews.md`, Interview 4

### Widersprüche

- Zahlungsbereitschaft: Felix Braun schreibt, Kunden sähen Reporting und Onboarding "eher als 'nice to have'" und "würden es nur nehmen wenns günstig ist" (slack.md, #allgemein). Dem stehen die Kundenaussagen gegenüber: Hartmann "Das zahle ich extra dafür", Roth "Kaufargument", Berg "erstmal möchte ich sehen dass das Onboarding-Problem gelöst ist, bevor ich mehr investiere" (alle customer_interviews.md).
- Zeitaufwand: Retro 3 nennt "2-8 Stunden pro Nutzer" (internal_docs.md); LogiTrans berichtet 45–60 Minuten pro Kollege (emails.md, Thread 1), FinancePlus 4 Stunden bzw. "fast einen halben Tag" (customer_interviews.md, emails.md Thread 4).
- Zählweise: Kai Schmidt zählt "4 Kunden" und rechnet dabei "das interne Feedback von Sarah" mit (emails.md, Thread 3); Retro 3 zählt "4 von 5 analysierten Projekten" und rechnet das BauLogik-Gespräch mit (internal_docs.md).

## Compliance-Checking als nächster Anwendungsfall mit Budget

**Unabhängige Stimmen:** 3

Drei Kunden beschreiben manuelle Compliance-Arbeit als konkreten, bezifferbaren Aufwand und signalisieren Budget. Am weitesten ist PharmaCare (SOPs gegen FDA/EMA-Richtlinien), LogiTrans nennt Lieferketten-/CO2-Reports, FinancePlus MiFID II und interne Revisionen.

### Belege

- „Wir prüfen unsere SOPs manuell gegen FDA und EMA-Richtlinien. Das ist stupide Arbeit. Meine Regulatory-Spezialisten verbringen dafür etwa 30% ihrer Zeit.“ — Dr. Sabine Roth, `input/raw_feedback/customer_interviews.md`, Interview 2
- „Das kostet uns momentan pro Quartal zwei Vollzeit-Arbeitstage. Wenn Sie das automatisieren können, ist das ein klares Budget-Gespräch.“ — Peter Hartmann, `input/raw_feedback/customer_interviews.md`, Interview 1
- „Wir haben viele Compliance-Anforderungen im Finanzbereich — MiFID II, interne Revisionen. Wenn da ein Agent helfen kann, bin ich sofort dabei.“ — Thomas Berg, `input/raw_feedback/customer_interviews.md`, Interview 3

### Widersprüche

- Verbreitung: Julia Meyer schreibt, alle drei Muster tauchten "bei >3 kunden" auf (slack.md, #allgemein). Retro 3 schreibt zu Compliance "Nur bei 2 Kunden bisher", zählt in derselben Zeile aber drei auf ("PharmaCare, FinancePlus implizit, LogiTrans erwähnt für Lieferkette") (internal_docs.md).
- Zitat-Zuordnung: Retro 3 führt "LogiTrans: 'zahle ich extra dafür'" als Beleg für Compliance-Zahlungsbereitschaft an (internal_docs.md). Im Interview fällt dieser Satz zum Onboarding; zu Compliance sagt Hartmann "ein klares Budget-Gespräch" (customer_interviews.md).
- FinancePlus – Reihenfolge: Marc Hoffmann meldet, FinancePlus wolle "jetzt auch was für compliance" (slack.md, 11. März). Im Interview vom selben Tag macht Berg das Onboarding zur Vorbedingung: "Aber erstmal möchte ich sehen dass das Onboarding-Problem gelöst ist, bevor ich mehr investiere" (customer_interviews.md).
- Zuschnitt: Retro 2 will Compliance-Checking "als Zusatzmodul" anbieten (internal_docs.md); Anna Wagner zu FinancePlus: "wäre ein neues projekt, kein add-on" (slack.md, #projektteam).

## Status-Reporting wird von Hand erstellt

**Unabhängige Stimmen:** 4

Status-Updates an Kunden bzw. an die Geschäftsleitung werden wiederholt manuell zusammengestellt. Die Betroffenen schlagen selbst vor, das einem Agenten zu überlassen.

### Belege

- „drei kunden haben diese woche nach status gefragt und ich musste jedes mal manuell zusammenstellen was wir gemacht haben. das kostet mich jedes mal 20-30 min.“ — Sarah Klein, `input/raw_feedback/slack.md`, #projektteam · 14. März
- „100% agree. ich hab das gleiche problem. und der tone muss ja auch immer auf den kunden angepasst werden.“ — Marc Hoffmann, `input/raw_feedback/slack.md`, #projektteam · 14. März
- „Ich schreibe jede Woche den gleichen Status-E-Mail von Hand. Wäre das nicht ein Fall für einen eigenen Agenten?“ — Tom Bauer, `input/raw_feedback/emails.md`, Thread 5
- „Jede Woche erstellt jeder Projektleiter seinen eigenen Statusbericht, verschickt ihn, dann konsolidiere ich das manuell für die Geschäftsleitung. Allein das kostet mich 6-8 Stunden pro Woche.“ — Sandra Pfeiffer, `input/raw_feedback/customer_interviews.md`, Interview 4

### Widersprüche

- Externe Nachfrage nicht im Rohmaterial belegt: Retro 3 schreibt, FinancePlus (Thomas Berg) und LogiTrans (Peter Hartmann) hätten Status-Reporting "als 'nice to have' erwähnt" (internal_docs.md). In deren Interviews und E-Mails findet sich keine solche Aussage; einzige externe Nennung ist BauLogik.
- Internes Tool oder Kundenprodukt: Retro 3 empfiehlt "für internen Gebrauch automatisieren (Team-Effizienz, kein Kundenprodukt)" (internal_docs.md); Julia Meyer führt Status-Reporting als eines von "3 potenzielle[n] produktmuster[n]" (slack.md), und BauLogik beschreibt es als ihren Hauptbedarf (customer_interviews.md).

## Projektabwicklung ohne wiederverwendbare Bausteine

**Unabhängige Stimmen:** 4

Aus Sicht des eigenen Teams wird Onboarding-Material und sogar das Onboarding-Modul selbst in jedem Projekt neu gebaut. Es fehlen Templates, Playbooks und eine wiederverwendbare Komponente; der Aufwand ist nicht budgetiert.

### Belege

- „Die Art wie wir Kunden onboarden. Jedes Projekt fängt bei null an. Kein Template, kein Playbook. Das ist ineffizient und fehleranfällig.“ — Sarah Klein, `input/raw_feedback/emails.md`, Thread 5
- „Wir haben bei diesem Projekt zum dritten Mal dasselbe Onboarding-Modul fast identisch gebaut. Irgendwann muss das eine wiederverwendbare Komponente werden.“ — Felix Braun, `input/raw_feedback/internal_docs.md`, Retro 2
- „ich glaub das macht noch keiner systematisch. beim pharma-kunden letzten monat hab ich das auch händisch zusammengesucht“ — Tom Bauer, `input/raw_feedback/slack.md`, #projektteam · 10. März
- „Das Onboarding hat uns bei diesem Projekt zwei volle Arbeitstage gekostet, die ich nicht budgetiert hatte.“ — Marc Hoffmann, `input/raw_feedback/internal_docs.md`, Retro 1

### Widersprüche

- Wo der Engpass liegt: Julia Meyer und Felix Braun beschreiben ein Komponenten-Problem ("Onboarding-Modul als wiederverwendbare Komponente", internal_docs.md). Marc Hoffmann: "Der Engpass bei Onboarding ist nicht die Technik sondern der Content — wer schreibt die Einweisungstexte?" (emails.md, Thread 3).

## Reporting-Agent liefert messbaren Nutzen, Kunden sind zufrieden

**Unabhängige Stimmen:** 3

Alle drei Bestandskunden bewerten den Reporting-Agenten positiv, teils mit Zahlen. Die Kritik richtet sich durchgehend auf die Einführung, nicht auf die Technik.

### Belege

- „Der Reporting-Agent funktioniert technisch einwandfrei — die Berichte kommen pünktlich, das Format passt.“ — Peter Hartmann, `input/raw_feedback/emails.md`, Thread 1
- „Drei Stunden pro Woche weniger manuelle Reporting-Arbeit. Bei sechs Nutzern über ein Jahr sind das 150+ Arbeitsstunden.“ — Thomas Berg, `input/raw_feedback/customer_interviews.md`, Interview 3
- „Früher hat jeder seinen eigenen Excel geführt. Jetzt kommt alles aus einer Quelle. Das allein hat unsere internen Abstimmungen halbiert.“ — Dr. Sabine Roth, `input/raw_feedback/customer_interviews.md`, Interview 2

### Widersprüche

- Bezugsgröße der Zeitersparnis unklar: Im Interview nennt Berg 3 Stunden pro Woche und rechnet "bei sechs Nutzern über ein Jahr" auf "150+ Arbeitsstunden" (customer_interviews.md); in der E-Mail "3 Stunden pro Woche weniger manuelle Arbeit, das sind bei unserem Team fast 150 Stunden pro Jahr" (emails.md, Thread 4). Ob die 3 Stunden pro Person oder fürs gesamte Team gelten, geht aus dem Material nicht hervor. Berg selbst: "keine wissenschaftliche Studie".

## Kapazitätsengpass und offene Priorisierung

**Unabhängige Stimmen:** 3

Das Team beschreibt sich als ausgelastet, und die Reihenfolge zwischen Compliance-Checking und Onboarding-Automatisierung ist nicht entschieden. Zwei Lager sind erkennbar; ein Beschluss liegt nicht vor.

### Belege

- „revenue ist ok aber wir haben 4 projekte parallel und das team ist gestreckt. müssen überlegen ob wir den nächsten kunden noch annehmen oder erst mal liefern“ — Kai Schmidt, `input/raw_feedback/slack.md`, #strategie · 11. März
- „lieber weniger projekte die wirklich gut werden als viele die so la la sind“ — Anna Wagner, `input/raw_feedback/slack.md`, #strategie · 11. März
- „Wir zwei reichen nicht. Für eine solide Analyse bräuchten wir mindestens eine dritte Person, zumindest part-time.“ — Julia Meyer, `input/raw_feedback/internal_docs.md`, Pattern-Team Weekly · TOP 3

### Widersprüche

- Onboarding zuerst vs. Compliance zuerst: Julia Meyer: "Wenn wir 2 Engineering-Wochen bekommen: Onboarding-Modul als wiederverwendbare Komponente. Das würde alle unsere zukünftigen Projekte günstiger machen." Felix Braun: "Ich würde Compliance-Checking vorziehen weil da konkret Geld liegt. PharmaCare wartet auf ein Angebot." (beide internal_docs.md, Pattern-Team Weekly)
- Entweder/oder vs. parallel: Anna Wagner: "Müssen wir nicht entweder/oder entscheiden." Marc Hoffmann: "Compliance-Checking als nächstes bezahltes Projekt (PharmaCare), Onboarding-Automatisierung als internes Experiment parallel dazu. Ergebnisse in 8 Wochen zusammenführen." (emails.md, Thread 3, 12. März). Einen Tag später endet das Pattern-Team-Meeting dennoch ohne Beschluss (internal_docs.md, 13. März).
- Parallel vs. Auslastung: Der Vorschlag, beides parallel zu machen (emails.md, Thread 3), steht neben der Aussage, das Team sei mit 4 parallelen Projekten "gestreckt" (slack.md, #strategie). Im Material wird dieser Konflikt nicht aufgelöst.
- Produkt vs. Modul: Kai Schmidt fragt, ob man Onboarding-Automatisierung "als Produkt testen" solle; Anna Wagner will es "als 'Modul' framen, nicht als eigenes Produkt. Produkt hat bei uns intern immer Erwartungen geweckt die wir dann nicht erfüllt haben." (emails.md, Thread 3)

## Sonstiges / Einzelfälle

- Kunden wollen den Agenten selbst weiterentwickeln: David Müller beschreibt nicht eingeplante Unterstützung für Dr. Roth. Bisher nur eine Nennung. — input/raw_feedback/internal_docs.md
- Interne Mitarbeiter-Einführung: David Müller berichtet einerseits von einem guten Start für Lars, andererseits von fehlender Systematik. Nicht mit dem Kunden-Onboarding gleichsetzen. — input/raw_feedback/slack.md, input/raw_feedback/emails.md
- Interview-Aufzeichnungen sind für Lisa Chen im Drive nicht auffindbar. Einzelfall zur internen Ablage. — input/raw_feedback/slack.md

