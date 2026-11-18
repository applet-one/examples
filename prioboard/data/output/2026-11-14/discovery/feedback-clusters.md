# Feedback-Cluster

**Datenbasis:** 4 Dateien aus `input/raw_feedback/` (`customer_interviews.md`, `emails.md`, `internal_docs.md`, `slack.md`), Zeitraum KW 8–12, 2025
**Stand der Analyse:** 2026-11-14

---

## Cluster 1: Manuelles Nutzer-Onboarding beim Kunden ist die größte Hürde

**Häufigkeit:** 4 externe Stimmen (LogiTrans, PharmaCare, FinancePlus, BauLogik als Nicht-Kunde), in allen 4 Interviews genannt; zusätzlich 2 Kunden-E-Mails, 1 Sales-Call-Summary, 2 Retros. Quellen: `customer_interviews.md`, `emails.md`, `internal_docs.md`

**Zusammenfassung:** Kunden müssen ihre Kollegen selbst in den Agenten einweisen; das kostet Stunden, bindet Führungskräfte und führt trotzdem zu Rückfragen. Gewünscht wird eine Einführung, die der Agent selbst übernimmt (interaktiv, Schritt für Schritt, mit branchenspezifischen Begriffen).

**Belege:**
- "Ich habe meinen Kollegen Markus selbst eingewiesen — das hat vier Stunden gedauert. Dann hat er drei Mal nachgefragt, weil er Details vergessen hatte. Ich bin CFO, ich bin nicht Schulungsleiter." — `customer_interviews.md`, Thomas Berg (FinancePlus)
- "Wir mussten beim Go-Live vier Kollegen manuell in die Bedienung einweisen. Das hat jeweils 45-60 Minuten gedauert." — `emails.md`, Thread 1, Peter Hartmann (LogiTrans)
- "Geben Sie mir etwas, das mein Team selbst onboarden kann. Interaktiv, Schritt für Schritt. Das zahle ich extra dafür." — `customer_interviews.md`, Peter Hartmann (LogiTrans)
- "Das letzte Mal haben wir vier Stunden Schulung gemacht, und trotzdem habe ich danach wochenlang Fragen gekriegt. Wenn das Ding sich selbst erklären kann, ist das für mich ein Kaufargument." — `customer_interviews.md`, Dr. Sabine Roth (PharmaCare)
- "Wenn wir wieder vier Stunden Schulungen machen müssen, holen wir uns lieber einen Freelancer" — `emails.md`, Thread 2, Dr. Roth zitiert von Anna Wagner
- "Ja, zwei. Beide sind gescheitert weil das Onboarding zu kompliziert war. […] Wenn es nicht in 15 Minuten klar ist wie es geht, nutzen sie es nicht." — `customer_interviews.md`, Sandra Pfeiffer (BauLogik)
- "Muss ich die wieder manuell einweisen oder gibt es da schon etwas?" — `emails.md`, Thread 4, Thomas Berg (FinancePlus)

**Teilaspekt Fachsprache (2 Nennungen):**
- "Die Dokumentation war okay, aber zu allgemein. Wir haben Logistik-spezifische Felder, Abkürzungen, interne Prozesse. Jemand musste das übersetzen." — `customer_interviews.md`, Peter Hartmann (LogiTrans)
- STOP: "Annahme dass Kunden aus anderen Branchen dieselben Begriffe verwenden wie wir" — `internal_docs.md`, Retro 2 (PharmaCare)

**Widersprüche:**
- **Zahlungsbereitschaft:** Felix Braun schreibt, Kunden sähen Reporting und Onboarding "eher als 'nice to have'" und "würden es nur nehmen wenns günstig ist" (`slack.md`, #allgemein). Dem stehen die Kundenaussagen gegenüber: Hartmann "Das zahle ich extra dafür", Roth "Kaufargument", Berg "erstmal möchte ich sehen dass das Onboarding-Problem gelöst ist, bevor ich mehr investiere" (alle `customer_interviews.md`).
- **Zeitaufwand:** Retro 3 nennt "2-8 Stunden pro Nutzer" (`internal_docs.md`); LogiTrans berichtet 45–60 Minuten pro Kollege (`emails.md`, Thread 1), FinancePlus 4 Stunden bzw. "fast einen halben Tag" (`customer_interviews.md`, `emails.md` Thread 4).
- **Zählweise:** Kai Schmidt zählt "4 Kunden" und rechnet dabei "das interne Feedback von Sarah" mit (`emails.md`, Thread 3); Retro 3 zählt "4 von 5 analysierten Projekten" und rechnet das BauLogik-Gespräch mit (`internal_docs.md`).

---

## Cluster 2: Compliance-Checking als nächster Anwendungsfall mit Budget

**Häufigkeit:** 3 Kunden (PharmaCare, LogiTrans, FinancePlus); genannt in 3 Interviews, 1 Sales-Call-Summary, 2 Slack-Nachrichten, 2 Retros, 1 Meeting-Protokoll. Quellen: alle 4 Dateien

**Zusammenfassung:** Drei Kunden beschreiben manuelle Compliance-Arbeit als konkreten, bezifferbaren Aufwand und signalisieren Budget. Am weitesten ist PharmaCare (SOPs gegen FDA/EMA-Richtlinien), LogiTrans nennt Lieferketten-/CO2-Reports, FinancePlus MiFID II und interne Revisionen.

**Belege:**
- "Wir prüfen unsere SOPs manuell gegen FDA und EMA-Richtlinien. Das ist stupide Arbeit. Meine Regulatory-Spezialisten verbringen dafür etwa 30% ihrer Zeit." — `customer_interviews.md`, Dr. Sabine Roth (PharmaCare)
- "Ein Agent der das automatisch macht würde mir zwei Vollzeit-Stellen freischaufeln." — `customer_interviews.md`, Dr. Sabine Roth (PharmaCare)
- "Das kostet uns momentan pro Quartal zwei Vollzeit-Arbeitstage. Wenn Sie das automatisieren können, ist das ein klares Budget-Gespräch." — `customer_interviews.md`, Peter Hartmann (LogiTrans)
- "Wir haben viele Compliance-Anforderungen im Finanzbereich — MiFID II, interne Revisionen. Wenn da ein Agent helfen kann, bin ich sofort dabei." — `customer_interviews.md`, Thomas Berg (FinancePlus)
- "Dr. Roth hat das als 'game changer' bezeichnet […] Bereit für ein 'ernsthaftes Gespräch über Budget'" — `emails.md`, Thread 2, Anna Wagner
- "compliance-checking ist der interessanteste fall weil die kunden bereit sind dafür zu zahlen." — `slack.md`, #allgemein, Felix Braun

**Widersprüche:**
- **Verbreitung:** Julia Meyer schreibt, alle drei Muster tauchten "bei >3 kunden" auf (`slack.md`, #allgemein). Retro 3 schreibt zu Compliance "Nur bei 2 Kunden bisher", zählt in derselben Zeile aber drei auf ("PharmaCare, FinancePlus implizit, LogiTrans erwähnt für Lieferkette") (`internal_docs.md`).
- **Zitat-Zuordnung:** Retro 3 führt "LogiTrans: 'zahle ich extra dafür'" als Beleg für Compliance-Zahlungsbereitschaft an (`internal_docs.md`). Im Interview fällt dieser Satz zum Onboarding; zu Compliance sagt Hartmann "ein klares Budget-Gespräch" (`customer_interviews.md`).
- **FinancePlus – Reihenfolge:** Marc Hoffmann meldet, FinancePlus wolle "jetzt auch was für compliance" (`slack.md`, 11. März). Im Interview vom selben Tag macht Berg das Onboarding zur Vorbedingung: "Aber erstmal möchte ich sehen dass das Onboarding-Problem gelöst ist, bevor ich mehr investiere" (`customer_interviews.md`).
- **Zuschnitt:** Retro 2 will Compliance-Checking "als Zusatzmodul" anbieten (`internal_docs.md`); Anna Wagner zu FinancePlus: "wäre ein neues projekt, kein add-on" (`slack.md`, #projektteam).

---

## Cluster 3: Status-Reporting wird von Hand erstellt

**Häufigkeit:** 3 interne Stimmen (Sarah Klein, Tom Bauer, Marc Hoffmann) und 1 externe (Sandra Pfeiffer, BauLogik); genannt in 2 Slack-Nachrichten, 1 E-Mail, 1 Retro (2 Stellen), 1 Interview. Quellen: alle 4 Dateien

**Zusammenfassung:** Status-Updates an Kunden bzw. an die Geschäftsleitung werden wiederholt manuell zusammengestellt. Die Betroffenen schlagen selbst vor, das einem Agenten zu überlassen.

**Belege:**
- "drei kunden haben diese woche nach status gefragt und ich musste jedes mal manuell zusammenstellen was wir gemacht haben. das kostet mich jedes mal 20-30 min." — `slack.md`, #projektteam, Sarah Klein
- "100% agree. ich hab das gleiche problem. und der tone muss ja auch immer auf den kunden angepasst werden." — `slack.md`, #projektteam, Marc Hoffmann
- "Ich schreibe jede Woche den gleichen Status-E-Mail von Hand. Wäre das nicht ein Fall für einen eigenen Agenten?" — `emails.md`, Thread 5, Tom Bauer
- "Ich hab den gleichen Bericht für LogiTrans jetzt viermal in leicht abgewandelter Form geschrieben. Das ist doch Unsinn." — `internal_docs.md`, Retro 1, Sarah Klein
- "Jede Woche erstellt jeder Projektleiter seinen eigenen Statusbericht, verschickt ihn, dann konsolidiere ich das manuell für die Geschäftsleitung. Allein das kostet mich 6-8 Stunden pro Woche." — `customer_interviews.md`, Sandra Pfeiffer (BauLogik)

**Widersprüche:**
- **Externe Nachfrage nicht im Rohmaterial belegt:** Retro 3 schreibt, FinancePlus (Thomas Berg) und LogiTrans (Peter Hartmann) hätten Status-Reporting "als 'nice to have' erwähnt" (`internal_docs.md`). In deren Interviews und E-Mails findet sich keine solche Aussage; einzige externe Nennung ist BauLogik.
- **Internes Tool oder Kundenprodukt:** Retro 3 empfiehlt "für internen Gebrauch automatisieren (Team-Effizienz, kein Kundenprodukt)" (`internal_docs.md`); Julia Meyer führt Status-Reporting als eines von "3 potenzielle[n] produktmuster[n]" (`slack.md`), und BauLogik beschreibt es als ihren Hauptbedarf (`customer_interviews.md`).

---

## Cluster 4: Projektabwicklung ohne wiederverwendbare Bausteine

**Häufigkeit:** 5 interne Stimmen (Sarah Klein, Tom Bauer, Felix Braun, Marc Hoffmann, Julia Meyer); genannt in 3 Slack-Nachrichten, 1 E-Mail, 2 Retros, 1 Meeting-Protokoll. Quellen: `slack.md`, `emails.md`, `internal_docs.md`

**Zusammenfassung:** Aus Sicht des eigenen Teams wird Onboarding-Material und sogar das Onboarding-Modul selbst in jedem Projekt neu gebaut. Es fehlen Templates, Playbooks und eine wiederverwendbare Komponente; der Aufwand ist nicht budgetiert.

**Belege:**
- "Die Art wie wir Kunden onboarden. Jedes Projekt fängt bei null an. Kein Template, kein Playbook. Das ist ineffizient und fehleranfällig." — `emails.md`, Thread 5, Sarah Klein
- "Wir haben bei diesem Projekt zum dritten Mal dasselbe Onboarding-Modul fast identisch gebaut. Irgendwann muss das eine wiederverwendbare Komponente werden." — `internal_docs.md`, Retro 2, Felix Braun
- "aber irgendwie sollte das automatisiert werden. wir machen das jetzt zum dritten mal in zwei monaten" — `slack.md`, #projektteam, Sarah Klein
- "ich glaub das macht noch keiner systematisch. beim pharma-kunden letzten monat hab ich das auch händisch zusammengesucht" — `slack.md`, #projektteam, Tom Bauer
- "Das Onboarding hat uns bei diesem Projekt zwei volle Arbeitstage gekostet, die ich nicht budgetiert hatte." — `internal_docs.md`, Retro 1, Marc Hoffmann
- START: "Onboarding-Checkliste pro Projekt erstellen, nicht jedes Mal neu erfinden" / STOP: "Jede Kundeneinweisung komplett von Hand machen — zu zeitaufwändig, zu fehleranfällig" — `internal_docs.md`, Retro 1

**Widersprüche:**
- **Wo der Engpass liegt:** Julia Meyer und Felix Braun beschreiben ein Komponenten-Problem ("Onboarding-Modul als wiederverwendbare Komponente", `internal_docs.md`). Marc Hoffmann: "Der Engpass bei Onboarding ist nicht die Technik sondern der Content — wer schreibt die Einweisungstexte?" (`emails.md`, Thread 3).

---

## Cluster 5: Reporting-Agent liefert messbaren Nutzen, Kunden sind zufrieden

**Häufigkeit:** 3 Bestandskunden (LogiTrans, PharmaCare, FinancePlus) plus 2 interne Bestätigungen; genannt in 3 Interviews, 3 E-Mails, 1 Slack-Nachricht. Quellen: `customer_interviews.md`, `emails.md`, `slack.md`

**Zusammenfassung:** Alle drei Bestandskunden bewerten den Reporting-Agenten positiv, teils mit Zahlen. Die Kritik richtet sich durchgehend auf die Einführung, nicht auf die Technik.

**Belege:**
- "Der Reporting-Agent funktioniert technisch einwandfrei […] wir hatten mit 3-4 Berichten pro Woche gerechnet, tatsächlich laufen jetzt täglich 8-10 durch." — `emails.md`, Thread 1, Peter Hartmann (LogiTrans)
- "Drei Stunden pro Woche weniger manuelle Reporting-Arbeit. Bei sechs Nutzern über ein Jahr sind das 150+ Arbeitsstunden." — `customer_interviews.md`, Thomas Berg (FinancePlus)
- "Früher hat jeder seinen eigenen Excel geführt. Jetzt kommt alles aus einer Quelle. Das allein hat unsere internen Abstimmungen halbiert." — `customer_interviews.md`, Dr. Sabine Roth (PharmaCare)
- "Dass die Technologie funktioniert. Mein einziger Vorbehalt wäre das Onboarding" — `customer_interviews.md`, Thomas Berg (FinancePlus)
- "Gut: Die technische Qualität unserer Agenten. Kunden sind fast immer zufrieden." — `emails.md`, Thread 5, Sarah Klein

**Widersprüche:**
- **Bezugsgröße der Zeitersparnis unklar:** Im Interview nennt Berg 3 Stunden pro Woche und rechnet "bei sechs Nutzern über ein Jahr" auf "150+ Arbeitsstunden" (`customer_interviews.md`); in der E-Mail "3 Stunden pro Woche weniger manuelle Arbeit, das sind bei unserem Team fast 150 Stunden pro Jahr" (`emails.md`, Thread 4). Ob die 3 Stunden pro Person oder fürs gesamte Team gelten, geht aus dem Material nicht hervor. Berg selbst: "keine wissenschaftliche Studie".

---

## Cluster 6: Kapazitätsengpass und offene Priorisierung

**Häufigkeit:** 6 interne Stimmen (Kai Schmidt, Anna Wagner, Julia Meyer, Felix Braun, Marc Hoffmann, David Müller); genannt in 2 Slack-Nachrichten, 3 E-Mails, 1 Retro, 1 Meeting-Protokoll. Quellen: `slack.md`, `emails.md`, `internal_docs.md`

**Zusammenfassung:** Das Team beschreibt sich als ausgelastet, und die Reihenfolge zwischen Compliance-Checking und Onboarding-Automatisierung ist nicht entschieden. Zwei Lager sind erkennbar; ein Beschluss liegt nicht vor.

**Belege:**
- "revenue ist ok aber wir haben 4 projekte parallel und das team ist gestreckt. müssen überlegen ob wir den nächsten kunden noch annehmen oder erst mal liefern" — `slack.md`, #strategie, Kai Schmidt
- "lieber weniger projekte die wirklich gut werden als viele die so la la sind" — `slack.md`, #strategie, Anna Wagner
- "Wir zwei reichen nicht. Für eine solide Analyse bräuchten wir mindestens eine dritte Person, zumindest part-time." — `internal_docs.md`, Pattern-Team Weekly, Julia Meyer ("Kai notiert, kein Commitment.")
- "Ergebnis: Kein finaler Beschluss. Kai nimmt beide Optionen zur Entscheidung ans Führungsteam." — `internal_docs.md`, Pattern-Team Weekly
- "Beim nächsten neuen Kollegen haben wir vielleicht nicht so viel Zeit für ihn." — `emails.md`, Thread 5, David Müller

**Widersprüche:**
- **Onboarding zuerst vs. Compliance zuerst:** Julia Meyer: "Wenn wir 2 Engineering-Wochen bekommen: Onboarding-Modul als wiederverwendbare Komponente. Das würde alle unsere zukünftigen Projekte günstiger machen." Felix Braun: "Ich würde Compliance-Checking vorziehen weil da konkret Geld liegt. PharmaCare wartet auf ein Angebot." (beide `internal_docs.md`, Pattern-Team Weekly)
- **Entweder/oder vs. parallel:** Anna Wagner: "Müssen wir nicht entweder/oder entscheiden." Marc Hoffmann: "Compliance-Checking als nächstes bezahltes Projekt (PharmaCare), Onboarding-Automatisierung als internes Experiment parallel dazu. Ergebnisse in 8 Wochen zusammenführen." (`emails.md`, Thread 3, 12. März). Einen Tag später endet das Pattern-Team-Meeting dennoch ohne Beschluss (`internal_docs.md`, 13. März).
- **Parallel vs. Auslastung:** Der Vorschlag, beides parallel zu machen (`emails.md`, Thread 3), steht neben der Aussage, das Team sei mit 4 parallelen Projekten "gestreckt" (`slack.md`, #strategie). Im Material wird dieser Konflikt nicht aufgelöst.
- **Produkt vs. Modul:** Kai Schmidt fragt, ob man Onboarding-Automatisierung "als Produkt testen" solle; Anna Wagner will es "als 'Modul' framen, nicht als eigenes Produkt. Produkt hat bei uns intern immer Erwartungen geweckt die wir dann nicht erfüllt haben." (`emails.md`, Thread 3)

---

## Sonstiges / Einzelfälle

- **Onboarding neuer Mitarbeiter (intern):** Nur von David Müller genannt, und in sich widersprüchlich: "onboarding läuft gut 👍 neuer kollege lars hat sich schnell eingefunden" (`slack.md`, 12. März) gegenüber "Lars hat sich gut eingefunden, aber das war mehr Glück als System" (`emails.md`, Thread 5, 7. März).
- **Kunden wollen den Agenten selbst weiterentwickeln:** "Unterschätzt: Wie viel Zeit es kostet Kunden beizubringen wie sie den Agenten selbst weiterentwickeln. Das war nicht im Scope, aber Roth hat gefragt." — `internal_docs.md`, Retro 2, David Müller
- **Hypothese: Onboarding und Reporting als ein Pattern:** "Onboarding und Reporting [sind] eigentlich zwei Seiten desselben Problems […] Kunden und interne Nutzer wissen nicht wie sie das System richtig nutzen." — `internal_docs.md`, Pattern-Team Weekly, Felix Braun (Einzelmeinung, von niemandem aufgegriffen)
- **Interne Ablage:** Interview-Aufzeichnungen im Drive nicht auffindbar — `slack.md`, #projektteam, Lisa Chen; Onboarding-Dokument nur in der "version von januar" vorhanden — `slack.md`, #projektteam, Sarah Klein
- **Dokumentation zu spät:** STOP "Dokumentation erst am Ende des Projekts schreiben" — `internal_docs.md`, Retro 1
- **Kunden früher einbeziehen:** START "Kunden früher in den Rollout einbeziehen (nicht erst bei Go-Live)" — `internal_docs.md`, Retro 1
- **Pattern-Tracking formalisieren:** START "Systematisches Tracking welche Prozesse bei welchen Kunden vorkommen" — `internal_docs.md`, Retro 2
- **Was gut läuft (beibehalten):** Wöchentliche Kundencalls und Transparenz bei Problemen (`internal_docs.md`, Retro 1); enge Abstimmung mit Dr. Roth und früh definierte Abnahmekriterien (`internal_docs.md`, Retro 2); Team-Gefühl (Tom Bauer) und Flexibilität bei Kundenanforderungen (David Müller) (`emails.md`, Thread 5)
- **Ad-hoc-Workaround:** Marc Hoffmann erstellt Status-Updates "jetzt schon irgendwie mit claude aber richtig strukturiert ist das nicht" — `slack.md`, #projektteam
- **Offene Zusage:** Skizze und Aufwandsschätzung an PharmaCare "bis Fr." angekündigt; ob sie verschickt wurde, geht aus dem Material nicht hervor — `emails.md`, Thread 2, Anna Wagner
