import {
  createUniver,
  LocaleType,
  mergeLocales,
  CommandType,
} from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import { UniverSheetsFilterPreset } from "@univerjs/preset-sheets-filter";
import { UniverSheetsSortPreset } from "@univerjs/preset-sheets-sort";
import { UniverSheetsDataValidationPreset } from "@univerjs/preset-sheets-data-validation";
import { UniverSheetsConditionalFormattingPreset } from "@univerjs/preset-sheets-conditional-formatting";
import { UniverSheetsFindReplacePreset } from "@univerjs/preset-sheets-find-replace";
import { UniverSheetsHyperLinkPreset } from "@univerjs/preset-sheets-hyper-link";
import { UniverSheetsNotePreset } from "@univerjs/preset-sheets-note";
import core from "@univerjs/preset-sheets-core/locales/en-US";
import filter from "@univerjs/preset-sheets-filter/locales/en-US";
import sort from "@univerjs/preset-sheets-sort/locales/en-US";
import validation from "@univerjs/preset-sheets-data-validation/locales/en-US";
import conditional from "@univerjs/preset-sheets-conditional-formatting/locales/en-US";
import find from "@univerjs/preset-sheets-find-replace/locales/en-US";
import links from "@univerjs/preset-sheets-hyper-link/locales/en-US";
import notes from "@univerjs/preset-sheets-note/locales/en-US";
import "@univerjs/preset-sheets-core/lib/index.css";
import "@univerjs/preset-sheets-filter/lib/index.css";
import "@univerjs/preset-sheets-sort/lib/index.css";
import "@univerjs/preset-sheets-data-validation/lib/index.css";
import "@univerjs/preset-sheets-conditional-formatting/lib/index.css";
import "@univerjs/preset-sheets-find-replace/lib/index.css";
import "@univerjs/preset-sheets-hyper-link/lib/index.css";
import "@univerjs/preset-sheets-note/lib/index.css";

export function mountEditor(container, snapshot, onChange) {
  const { univer, univerAPI } = createUniver({
    locale: LocaleType.EN_US,
    locales: {
      [LocaleType.EN_US]: mergeLocales(
        core,
        filter,
        sort,
        validation,
        conditional,
        find,
        links,
        notes,
      ),
    },
    presets: [
      UniverSheetsCorePreset({ container }),
      UniverSheetsFilterPreset(),
      UniverSheetsSortPreset(),
      UniverSheetsDataValidationPreset(),
      UniverSheetsConditionalFormattingPreset(),
      UniverSheetsFindReplacePreset(),
      UniverSheetsHyperLinkPreset(),
      UniverSheetsNotePreset(),
    ],
  });
  const workbook = univerAPI.createWorkbook(snapshot);
  let edited = false;
  const subscription = univerAPI.addEvent(
    univerAPI.Event.CommandExecuted,
    (event) => {
      // Operations are view-only. Formula-engine internal bookkeeping is not a user edit.
      if (
        event.type !== CommandType.MUTATION ||
        event.id.startsWith("formula.") ||
        event.options?.onlyLocal ||
        event.options?.applyFormulaCalculationResult
      )
        return;
      edited = true;
      onChange();
    },
  );
  // Late results get their own generation after an edit, without delaying the
  // initial content save indefinitely if formula evaluation fails.
  const formulaSubscription = univerAPI
    .getFormula()
    .calculationResultApplied(() => {
      if (edited) onChange();
    });
  return {
    api: univerAPI,
    capture: () => structuredClone(workbook.save()),
    dispose() {
      subscription.dispose();
      formulaSubscription.dispose();
      univer.dispose();
    },
  };
}
