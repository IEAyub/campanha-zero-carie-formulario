/**
 * Zero Cárie® - Rastreamento de leads do formulário
 *
 * COMO INSTALAR:
 * 1. Crie uma planilha nova no Google Sheets (sheets.new).
 * 2. Nela, vá em Extensões > Apps Script.
 * 3. Apague o conteúdo padrão e cole todo este arquivo.
 * 4. Clique em "Implantar" > "Nova implantação".
 * 5. Tipo: "App da Web". Executar como: "Eu". Quem pode acessar: "Qualquer pessoa".
 * 6. Copie a URL gerada (termina em /exec) e cole em WHATSAPP config no script.js do site (TRACKING_URL).
 * 7. Na primeira execução o Google vai pedir autorização — aceite (é sua própria planilha).
 */

const SHEET_NAME = "Leads";

function doPost(e) {
  const sheet = getOrCreateSheet();
  const data = JSON.parse(e.postData.contents);

  const rows = sheet.getDataRange().getValues();
  const idCol = 0; // coluna A = sessionId
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === data.sessionId) {
      rowIndex = i + 1; // linhas do Sheets começam em 1
      break;
    }
  }

  const now = new Date();
  const status = data.completed ? "Concluído" : "Em andamento / Abandonou";

  const rowValues = [
    data.sessionId,
    rowIndex === -1 ? now : rows[rowIndex - 1][1], // Primeiro acesso (mantém o original se já existir)
    now, // Última atividade
    data.stepName || "",
    status,
    data.nomeResponsavel || "",
    data.nomeCrianca || "",
    data.idade || "",
    data.dor || "",
    data.motivo || "",
    data.origem || "",
    data.contato || "",
  ];

  if (rowIndex === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "ID da sessão",
      "Primeiro acesso",
      "Última atividade",
      "Última etapa alcançada",
      "Status",
      "Responsável",
      "Criança",
      "Idade",
      "Dor/desconforto",
      "Motivo",
      "Origem",
      "Contato (WhatsApp)",
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
