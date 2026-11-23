// Plain-text follow-up requests the office copies and pastes by hand (nothing is sent from PermitDraft).
// Each one asks only for what the checklist already needs for that field: no homeowner details, no new requirements.
type L = [string, string];
type Ask = (label: L) => L;

const plate = (what: L): Ask => (label) => [
  `${label[0]} is missing. Please send a clear close-up of the equipment label with the ${what[0]} readable. If it cannot be read, say so; do not guess.`,
  `Falta: ${label[1]}. Envíe un primer plano claro de la etiqueta del equipo con ${what[1]} legible. Si no se puede leer, avise; no lo adivine.`,
];
const coil = (what: L): Ask => (label) => [
  `${label[0]} is missing. Please send a clear close-up of the indoor coil label with the ${what[0]} readable. If it cannot be read, say so; do not guess.`,
  `Falta: ${label[1]}. Envíe un primer plano claro de la etiqueta del serpentín interior con ${what[1]} legible. Si no se puede leer, avise; no lo adivine.`,
];

/** Keyed by the checklist item (rule id without its "app-doc-" prefix) or the sample draft's field id. */
const ASK: Record<string, Ask> = {
  name: (l) => [`${l[0]} is missing. Please send it as it should appear on the permit draft.`, `Falta: ${l[1]}. Envíelo tal como debe aparecer en el borrador del permiso.`],
  addr: (l) => [`${l[0]} is missing. Please send the street address of the job site.`, `Falta: ${l[1]}. Envíe la dirección del sitio del trabajo.`],
  city: (l) => [`${l[0]} is missing. Please send the city of the job site.`, `Falta: ${l[1]}. Envíe la ciudad del sitio del trabajo.`],
  model: plate(["model number", "el número de modelo"]),
  serial: plate(["serial number", "el número de serie"]),
  refrig: plate(["refrigerant type", "el tipo de refrigerante"]),
  refrigerant: plate(["refrigerant type", "el tipo de refrigerante"]),
  coilModel: coil(["model number", "el número de modelo"]),
  coilSerial: coil(["serial number", "el número de serie"]),
  panel: (l) => [`${l[0]} is missing. Please send the amperage from the main panel label, or a clear photo of that label.`, `Falta: ${l[1]}. Envíe el amperaje de la etiqueta del panel principal, o una foto clara de esa etiqueta.`],
  duct: (l) => [`${l[0]} is missing. Please confirm whether the ducts were sealed (sealed and verified, not sealed, or exempt with the reason) and share the job note.`, `Falta: ${l[1]}. Confirme si los ductos se sellaron (sellado y verificado, no sellado, o exento con el motivo) y comparta la nota del trabajo.`],
  location: (l) => [`${l[0]} needs checking. Please confirm where the outdoor unit sits and share the job note or photo it comes from.`, `Hay que revisar: ${l[1]}. Confirme dónde está la unidad exterior y comparta la nota del trabajo o la foto de donde sale.`],
  charge: (l) => [`${l[0]} needs checking. Please send the recorded reading with units and source (gauge or meter photo, or the logged reading).`, `Hay que revisar: ${l[1]}. Envíe la lectura registrada con unidades y fuente (foto del manómetro o medidor, o la lectura anotada).`],
  "p-plate": (l) => [`${l[0]} is missing. Please send a clear close-up of the equipment label with the model and serial readable.`, `Falta: ${l[1]}. Envíe un primer plano claro de la etiqueta del equipo con el modelo y la serie legibles.`],
  "p-plate_furnace": (l) => [`${l[0]} is missing. Please send a clear close-up of the replaced furnace's data plate with the model and serial readable.`, `Falta: ${l[1]}. Envíe un primer plano claro de la placa de datos del horno reemplazado con el modelo y la serie legibles.`],
  "p-plate_coil": (l) => [`${l[0]} is missing. Please send a clear close-up of the replaced indoor coil's data plate with the model and serial readable.`, `Falta: ${l[1]}. Envíe un primer plano claro de la placa de datos del serpentín interior reemplazado con el modelo y la serie legibles.`],
  "p-plate_outdoor": (l) => [`${l[0]} is missing. Please send a clear close-up of the replaced outdoor unit's data plate with the model and serial readable.`, `Falta: ${l[1]}. Envíe un primer plano claro de la placa de datos de la unidad exterior reemplazada con el modelo y la serie legibles.`],
  "p-outdoor": (l) => [`${l[0]} is missing. Please send a photo of the outdoor unit in place, showing where it sits and its clearance.`, `Falta: ${l[1]}. Envíe una foto de la unidad exterior instalada, que muestre dónde está y su espacio libre.`],
  "p-gauge": (l) => [`${l[0]} is missing. Please send the recorded reading with units and source: a clear photo of the gauge or meter.`, `Falta: ${l[1]}. Envíe la lectura registrada con unidades y fuente: una foto clara del manómetro o medidor.`],
};

/**
 * The request text for one NEEDED field, in English and Spanish.
 * `job` is non-personal context (job number, equipment type); `label` is the field's own name on this draft.
 */
export function copyRequest(id: string, label: L, job: L, conflict = false): L {
  const ask = ASK[id] ?? ((l: L): L => [`${l[0]} is missing. Please send it with where it came from.`, `Falta: ${l[1]}. Envíelo junto con de dónde sale.`]);
  let [en, es] = ask(label);
  // A value already on file that another source contradicts: same ask, worded as a conflict, never as missing.
  if (conflict) {
    en = en.replace(`${label[0]} is missing.`, `${label[0]} has two conflicting values.`);
    es = es.replace(`Falta: ${label[1]}.`, `Hay valores en conflicto: ${label[1]}.`);
  }
  return [job[0] ? `${job[0]}: ${en}` : en, job[1] ? `${job[1]}: ${es}` : es];
}
