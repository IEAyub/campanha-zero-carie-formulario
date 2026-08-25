const WHATSAPP_NUMBER = "5567992247988";

// Cole aqui a URL do Google Apps Script (termina em /exec) depois de implantar
// o arquivo google-apps-script/Code.gs. Enquanto estiver vazio, o rastreamento fica desligado.
const TRACKING_URL = "https://script.google.com/macros/s/AKfycbz6NZ54C0RtPq0XQy6H8qwtUcNVEMdo6iezWvWEf4nnwvEcw8obYdUnrHJg2lrQ-8on/exec";

const sessionId = crypto.randomUUID
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const STEP_NAMES = {
  0: "Boas-vindas",
  1: "Nome do responsável",
  2: "Nome da criança",
  3: "Idade da criança",
  4: "Dor/desconforto",
  5: "Motivo da consulta",
  6: "Processando",
  7: "Concluído",
};

function trackProgress(step, completed) {
  if (!TRACKING_URL) return;
  const payload = {
    sessionId,
    step,
    stepName: STEP_NAMES[step] || String(step),
    completed: !!completed,
    nomeResponsavel: document.getElementById("nomeResponsavel").value.trim(),
    nomeCrianca: document.getElementById("nomeCrianca").value.trim(),
    idade: answers.idade,
    dor: answers.dor,
    motivo: answers.motivo,
    origem: "instagram",
  };
  fetch(TRACKING_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

const screens = Array.from(document.querySelectorAll(".screen"));
const progressFill = document.getElementById("progressFill");
const card = document.querySelector(".card");
const TOTAL_STEPS = screens.length - 1; // último passo (final) não conta pro avanço

const answers = { idade: "", dor: "", motivo: "" };
let currentStep = 0;

function showStep(step) {
  screens.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === step));
  const pct = Math.min(100, Math.round((step / TOTAL_STEPS) * 100));
  progressFill.style.width = Math.max(6, pct) + "%";
  card.classList.toggle("is-complete", step === TOTAL_STEPS);
  currentStep = step;

  const active = screens.find(s => Number(s.dataset.step) === step);
  const input = active.querySelector(".text-input");
  if (input) setTimeout(() => input.focus(), 300);

  const optionsGroup = active.querySelector(".options[data-field]");
  if (optionsGroup) {
    const field = optionsGroup.dataset.field;
    optionsGroup.querySelectorAll(".option").forEach(opt => {
      opt.classList.toggle("selected", opt.dataset.value === answers[field]);
    });
  }
}

function goNext() {
  if (!validateStep(currentStep)) return;
  const next = currentStep + 1;
  showStep(next);
  trackProgress(next, next === TOTAL_STEPS);
  if (next === 6) {
    setTimeout(() => goNext(), 1200); // simula processamento
  }
  if (next === 7) {
    buildWhatsappLink();
  }
}

function goBack() {
  if (currentStep === 0) return;
  showStep(currentStep - 1);
}

function validateStep(step) {
  if (step === 1) {
    const v = document.getElementById("nomeResponsavel").value.trim();
    return v.length > 0;
  }
  if (step === 2) {
    const v = document.getElementById("nomeCrianca").value.trim();
    return v.length > 0;
  }
  if (step === 3) return !!answers.idade;
  if (step === 4) return !!answers.dor;
  if (step === 5) return !!answers.motivo;
  return true;
}

document.querySelectorAll('[data-action="next"]').forEach(btn => {
  btn.addEventListener("click", goNext);
});

document.querySelectorAll('[data-action="back"]').forEach(btn => {
  btn.addEventListener("click", goBack);
});

document.querySelectorAll(".text-input").forEach(input => {
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") goNext();
  });
});

document.querySelectorAll(".options").forEach(group => {
  const field = group.dataset.field;
  group.querySelectorAll(".option").forEach(opt => {
    opt.addEventListener("click", () => {
      group.querySelectorAll(".option").forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      answers[field] = opt.dataset.value;
      setTimeout(goNext, 250);
    });
  });
});

function buildWhatsappLink() {
  const nomeResponsavel = document.getElementById("nomeResponsavel").value.trim();
  const nomeCrianca = document.getElementById("nomeCrianca").value.trim();
  const msg = [
    "Olá, vim pelo instagram.",
    "",
    `Responsável: ${nomeResponsavel}`,
    `Criança: ${nomeCrianca} - ${answers.idade}`,
    `Sentindo dor ou desconforto: ${answers.dor}`,
    `Atendimento: ${answers.motivo}`,
    "",
    "Tenho interesse em agendar uma avaliação.",
  ].join("\n");
  document.getElementById("whatsappBtn").href =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

showStep(0);
trackProgress(0, false);
