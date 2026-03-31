import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fireEvent, trackCustomEvent } from "@/lib/fbpixel";
import { sendWebhookEvent, setLeadId, getLeadId } from "@/lib/webhook";
import { getUtms } from "@/lib/utm";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Phone,
  User,
  Send,
  Mail,
  MessageSquare,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════ */

interface FormData {
  telefone: string;
  nome: string;
  email: string;
  empresa: string;
  segmento: string;
  trabalha_com_agendamento: string;
  quem_atende: string;
  canal_principal: string;
  volume_diario: string;
  tamanho_empresa: string;
  investimento: string;
}

type Classificacao = "frio" | "morno" | "quente";

interface QuestionOption {
  label: string;
  value: string;
  points: number;
}

interface Question {
  id: keyof FormData;
  title: string;
  options: QuestionOption[];
  disclaimer?: string;
}

const QUESTIONS: Question[] = [
  {
    id: "trabalha_com_agendamento",
    title: "Seu negócio trabalha com agendamento de clientes?",
    options: [
      { label: "Sim, o dia todo", value: "Sim, o dia todo", points: 5 },
      { label: "Sim, grande parte do atendimento", value: "Sim, grande parte", points: 4 },
      { label: "Em parte", value: "Em parte", points: 2 },
      { label: "Pouco", value: "Pouco", points: 0 },
    ],
  },
  {
    id: "quem_atende",
    title: "Hoje quem responde e agenda seus clientes?",
    options: [
      { label: "Eu mesmo", value: "Eu mesmo", points: 1 },
      { label: "Secretária / recepcionista", value: "Secretária", points: 3 },
      { label: "Equipe de atendimento", value: "Equipe", points: 4 },
      { label: "Parte manual e parte automatizado", value: "Misto", points: 5 },
    ],
  },
  {
    id: "canal_principal",
    title: "Onde a maior parte dos atendimentos acontece?",
    options: [
      { label: "WhatsApp", value: "WhatsApp", points: 5 },
      { label: "Instagram", value: "Instagram", points: 3 },
      { label: "Ligação", value: "Ligação", points: 2 },
      { label: "Recepção física", value: "Recepção", points: 1 },
      { label: "Misturado", value: "Misturado", points: 3 },
    ],
  },
  {
    id: "volume_diario",
    title: "Em média, quantos atendimentos / mensagens / pedidos de horário vocês recebem por dia?",
    options: [
      { label: "Até 30", value: "Até 30", points: 1 },
      { label: "30 a 50", value: "30-50", points: 2 },
      { label: "50 a 100", value: "50-100", points: 3 },
      { label: "100 a 200", value: "100-200", points: 4 },
      { label: "Acima de 200", value: "200+", points: 5 },
    ],
  },
  {
    id: "tamanho_empresa",
    title: "Quantas pessoas trabalham na sua empresa?",
    options: [
      { label: "Até 5", value: "Até 5", points: 1 },
      { label: "5 a 10", value: "5-10", points: 2 },
      { label: "10 a 20", value: "10-20", points: 3 },
      { label: "20 a 50", value: "20-50", points: 4 },
      { label: "Acima de 50", value: "50+", points: 5 },
    ],
  },
  {
    id: "investimento",
    title: "Você investiria em uma solução que reduz perda de atendimento e melhora agendamentos?",
    options: [
      { label: "Sim, com urgência", value: "Sim, urgente", points: 5 },
      { label: "Sim, dependendo da proposta", value: "Sim, depende", points: 3 },
      { label: "Talvez", value: "Talvez", points: 1 },
      { label: "Não agora", value: "Não agora", points: 0 },
    ],
  },
];


/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function rawPhone(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidPhone(value: string): boolean {
  return rawPhone(value).length >= 10;
}

function isValidEmail(value: string): boolean {
  if (!value) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function calculateScore(data: FormData): number {
  let total = 0;
  for (const q of QUESTIONS) {
    const selected = data[q.id];
    const opt = q.options.find((o) => o.value === selected);
    if (opt) total += opt.points;
  }
  return total;
}

function classify(score: number): Classificacao {
  if (score <= 10) return "frio";
  if (score <= 20) return "morno";
  return "quente";
}

const COLD_VALUES: Record<string, string> = {
  trabalha_com_agendamento: "Pouco",
  volume_diario: "Até 30",
  investimento: "Não agora",
};

function countColdAnswers(data: FormData): number {
  let count = 0;
  for (const [key, coldVal] of Object.entries(COLD_VALUES)) {
    if (data[key as keyof FormData] === coldVal) count++;
  }
  return count;
}

const WA_NUMBER = "5562981530007";
const DEMO_URL = "https://henriqueaugusto.com.br/demo-ia-agendamento?utm_source=site&utm_medium=formulario&utm_campaign=demo_ia&utm_content=lead_form";

/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════ */

export default function DiagnosticoAgendamento() {
  const startTime = useRef(Date.now());
  const [step, setStep] = useState(0);
  // 0 = context, 1 = phone, 2 = name, 3 = empresa, 4 = segmento, 5..9 = questions (5 perguntas), 10 = result
  const lastStep = 4 + QUESTIONS.length; // last interactive step (step 9)
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);
  const [webhookError, setWebhookError] = useState(false);
  const [sending, setSending] = useState(false);
  const [resultEmail, setResultEmail] = useState("");
  const [resultEmailError, setResultEmailError] = useState("");

  // Lead flow state
  type FlowScreen = "normal" | "guide_only" | "demo_offer";
  const [flowScreen, setFlowScreen] = useState<FlowScreen>("normal");

  const [formData, setFormData] = useState<FormData>({
    telefone: "",
    nome: "",
    email: "",
    empresa: "",
    segmento: "",
    trabalha_com_agendamento: "",
    quem_atende: "",
    canal_principal: "",
    volume_diario: "",
    tamanho_empresa: "",
    investimento: "",
  });

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");

  const score = calculateScore(formData);
  const classificacao = classify(score);

  /* ── Navigation ── */
  const canAdvance = (): boolean => {
    if (step === 0) return true;
    if (step === 1) return isValidPhone(formData.telefone);
    if (step === 2) return formData.nome.trim().length >= 2;
    if (step === 3) return formData.empresa.trim().length >= 2;
    if (step === 4) return formData.segmento.trim().length >= 2;
    if (step >= 5 && step < 5 + QUESTIONS.length) {
      const q = QUESTIONS[step - 5];
      return !!formData[q.id];
    }
    return false;
  };

  const isLastQuestion = step === 4 + QUESTIONS.length; // última pergunta

  /* ── Accumulated decisions for single webhook ── */
  const decisionsRef = useRef<Record<string, unknown>>({});
  const webhookSentFinalRef = useRef(false);

  const buildPayload = (status: string, extra: Record<string, unknown> = {}) => {
    const fd = formDataRef.current;
    return {
      status,
      nome: fd.nome.trim(),
      telefone: fd.telefone ? "55" + rawPhone(fd.telefone) : "",
      email: fd.email || "",
      empresa: fd.empresa || "",
      segmento: fd.segmento || "",
      score_total: score,
      classificacao,
      respostas: {
        trabalha_com_agendamento: fd.trabalha_com_agendamento || null,
        quem_atende: fd.quem_atende || null,
        canal_principal: fd.canal_principal || null,
        volume_diario: fd.volume_diario || null,
        tamanho_empresa: fd.tamanho_empresa || null,
        investimento: fd.investimento || null,
      },
      // Flags derivadas
      usa_whatsapp_como_canal_principal: fd.canal_principal === "WhatsApp",
      alto_volume: fd.volume_diario === "100-200" || fd.volume_diario === "200+",
      empresa_estruturada: fd.tamanho_empresa === "20-50" || fd.tamanho_empresa === "50+",
      lead_prioritario: score > 20,
      tempo_preenchimento_segundos: Math.round((Date.now() - startTime.current) / 1000),
      ...decisionsRef.current,
      ...extra,
    };
  };

  const sendFinalWebhook = async (extra: Record<string, unknown> = {}) => {
    if (webhookSentFinalRef.current) return;
    webhookSentFinalRef.current = true;
    try {
      await sendWebhookEvent("lead_completo", buildPayload("completo", extra));
      setWebhookSent(true);
    } catch {
      setWebhookError(true);
    }
  };

  /* ── FB: FormularioIncompleto on page leave ── */
  const submittedRef = useRef(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  const beaconFiredRef = useRef(false);
  const fireIncomplete = useCallback(() => {
    if (webhookSentFinalRef.current || beaconFiredRef.current || stepRef.current === 0) return;
    beaconFiredRef.current = true;

    trackCustomEvent("FormularioIncompleto", {
      ultima_etapa: stepRef.current,
      content_name: "diagnostico_agendamento_ia",
    });

    const fd = formDataRef.current;
    const utms = getUtms();
    const formCompleted = submittedRef.current;
    const payload = JSON.stringify({
      evento: formCompleted ? "lead_completo" : "lead_incompleto",
      lead_id: getLeadId(),
      status: formCompleted ? "completo_sem_email" : "incompleto",
      ultima_etapa: stepRef.current,
      nome: fd.nome.trim(),
      telefone: fd.telefone ? "55" + rawPhone(fd.telefone) : "",
      email: fd.email || "",
      empresa: fd.empresa || "",
      segmento: fd.segmento || "",
      respostas: {
        trabalha_com_agendamento: fd.trabalha_com_agendamento || null,
        quem_atende: fd.quem_atende || null,
        canal_principal: fd.canal_principal || null,
        volume_diario: fd.volume_diario || null,
        tamanho_empresa: fd.tamanho_empresa || null,
        investimento: fd.investimento || null,
      },
      ...(formCompleted ? decisionsRef.current : {}),
      tempo_preenchimento_segundos: Math.round((Date.now() - startTime.current) / 1000),
      origem: "landing_diagnostico_agendamento",
      utm: Object.keys(utms).length > 0 ? utms : undefined,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    const blob = new Blob([payload], { type: "application/json" });
    try {
      navigator.sendBeacon?.("/api/webhook", blob);
    } catch {
      /* ignore */
    }
    try {
      fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onBeforeUnload = () => fireIncomplete();
    const onVisChange = () => { if (document.visibilityState === "hidden") fireIncomplete(); };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisChange);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, [fireIncomplete]);

  const userData = () => ({
    phone: formData.telefone ? "55" + rawPhone(formData.telefone) : undefined,
    firstName: formData.nome.trim() || undefined,
    email: formData.email || undefined,
  });

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    submittedRef.current = true;
    setSending(true);
    setStep(lastStep + 1); // result screen

    // Standard Lead event
    fireEvent("Lead", userData(), {
      content_name: "diagnostico_completo",
      value: score,
      currency: "BRL",
      classificacao,
    }, true);

    const coldCount = countColdAnswers(formData);
    decisionsRef.current.cold_count = coldCount;
    decisionsRef.current.score = score;
    decisionsRef.current.classificacao = classificacao;
    
    // TODOS os leads vão para o fluxo normal (agendamento)
    // Score é apenas para controle interno
    decisionsRef.current.fluxo = "DIRETO_AGENDAMENTO";
    decisionsRef.current.tela_final = "normal";
    setSending(false);
    setFlowScreen("normal");
    fireEvent("LeadQualificado", userData(), { cold_count: coldCount, classificacao, score });
  };

  const handleGuideSubmit = async () => {
    // Validar email antes de redirecionar
    if (!isValidEmail(resultEmail)) {
      setResultEmailError("Informe um email válido.");
      return;
    }
    setResultEmailError("");

    // Atualizar formData com email
    setFormData((prev) => ({ ...prev, email: resultEmail }));
    
    // Fire event
    fireEvent("RedirecionamentoAgendamento", userData(), { classificacao, score, email: resultEmail });

    // Send final webhook com email
    decisionsRef.current.acao = "redirecionado_agendamento";
    decisionsRef.current.email_informado = true;
    await sendFinalWebhook({ email: resultEmail });

    // Navigate to confirmation page
    navigate("/confirmacao", {
      state: {
        nome: formData.nome.trim(),
        email: resultEmail,
        telefone: formData.telefone,
        empresa: formData.empresa,
        segmento: formData.segmento,
        classificacao,
        score,
      },
    });
  };

  const goNext = () => {
    if (step === 1 && !isValidPhone(formData.telefone)) {
      setPhoneError("Informe um telefone válido com DDD.");
      return;
    }
    if (step === 1) {
      setLeadId("55" + rawPhone(formData.telefone));
    }
    if (step === 2 && formData.nome.trim().length < 2) {
      setNameError("Informe seu nome.");
      return;
    }
    if (step === 3 && formData.empresa.trim().length < 2) {
      setNameError("Informe o nome da empresa.");
      return;
    }
    if (step === 4 && formData.segmento.trim().length < 2) {
      setNameError("Informe o segmento.");
      return;
    }
    setPhoneError("");
    setNameError("");

    if (step < lastStep) {
      setStep((s) => s + 1);
    } else if (!submitted) {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  /* ── Select question option ── */
  const selectOption = (questionId: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [questionId]: value }));
  };

  /* ── Progress ── */
  const isResult = step === lastStep + 1;
  const progressPercent = isResult
    ? 100
    : Math.round((step / lastStep) * 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      {!isResult && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-lg">
          {/* ── ETAPA 0: Context ── */}
          {step === 0 && (
            <StepCard>
              <div className="flex flex-col items-center text-center">
                <h1 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl leading-tight">
                  Análise Estratégica: Atendimento com IA
                </h1>

                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Descubra em menos de 3 minutos como a IA pode transformar seu atendimento,
                  <span className="font-medium text-foreground"> multiplicar agendamentos</span> e
                  reduzir perda de clientes no WhatsApp.
                </p>

                <div className="mt-5 sm:mt-6 w-full max-w-sm space-y-2.5 text-left">
                  <p className="text-xs sm:text-sm font-semibold text-foreground text-center uppercase tracking-wide">
                    O que você vai descobrir:
                  </p>
                  {[
                    "O potencial de automação do seu atendimento",
                    "Quantos agendamentos você pode estar perdendo",
                    "Como a IA pode funcionar especificamente no seu negócio",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-muted-foreground leading-snug">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 sm:mt-6 w-full max-w-sm rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 sm:py-4">
                  <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
                    🎁 Ao final, você receberá um <span className="font-bold">diagnóstico personalizado</span> com
                    recomendações específicas de como a IA pode melhorar seu atendimento
                    e aumentar seus agendamentos.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="mt-6 sm:mt-8 h-12 sm:h-14 px-8 text-sm sm:text-base font-semibold rounded-xl shadow-lg"
                  onClick={() => {
                    fireEvent("FormularioIniciado", {}, { content_name: "diagnostico_agendamento_ia" });
                    goNext();
                  }}
                >
                  Iniciar análise gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="mt-3 text-[11px] sm:text-xs text-muted-foreground/60">
                  São apenas 5 perguntas rápidas · 100% gratuito
                </p>
              </div>
            </StepCard>
          )}

          {/* ── ETAPA 1: Phone ── */}
          {step === 1 && (
            <StepCard>
              <StepHeader
                icon={<Phone className="h-5 w-5" />}
                label="Etapa 1 de 9"
              />
              <label className="block text-base sm:text-lg font-semibold text-foreground mt-5 sm:mt-6">
                Qual seu WhatsApp?
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    telefone: formatPhone(e.target.value),
                  }));
                  setPhoneError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && goNext()}
                className="mt-3 w-full rounded-xl border bg-background px-4 py-4 text-base text-foreground outline-none ring-1 ring-transparent focus:ring-primary/50 transition"
              />
              {phoneError && (
                <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {phoneError}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground/70">
                Usamos para enviar o resultado da análise e demonstração.
              </p>
              <NavButtons onBack={goBack} onNext={goNext} canNext={canAdvance()} />
            </StepCard>
          )}

          {/* ── ETAPA 2: Name ── */}
          {step === 2 && (
            <StepCard>
              <StepHeader
                icon={<User className="h-5 w-5" />}
                label="Etapa 2 de 9"
              />
              <label className="block text-base sm:text-lg font-semibold text-foreground mt-5 sm:mt-6">
                Como podemos te chamar?
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Seu nome"
                value={formData.nome}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, nome: e.target.value }));
                  setNameError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && goNext()}
                className="mt-3 w-full rounded-xl border bg-background px-4 py-4 text-base text-foreground outline-none ring-1 ring-transparent focus:ring-primary/50 transition"
              />
              {nameError && (
                <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {nameError}
                </p>
              )}
              <NavButtons onBack={goBack} onNext={goNext} canNext={canAdvance()} />
            </StepCard>
          )}

          {/* ── ETAPA 3: Empresa ── */}
          {step === 3 && (
            <StepCard>
              <StepHeader
                icon={<User className="h-5 w-5" />}
                label="Etapa 3 de 9"
              />
              <label className="block text-base sm:text-lg font-semibold text-foreground mt-5 sm:mt-6">
                Qual o nome da sua empresa ou negócio?
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Nome da empresa"
                value={formData.empresa}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, empresa: e.target.value }));
                  setNameError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && goNext()}
                className="mt-3 w-full rounded-xl border bg-background px-4 py-4 text-base text-foreground outline-none ring-1 ring-transparent focus:ring-primary/50 transition"
              />
              {nameError && (
                <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {nameError}
                </p>
              )}
              <NavButtons onBack={goBack} onNext={goNext} canNext={canAdvance()} />
            </StepCard>
          )}

          {/* ── ETAPA 4: Segmento ── */}
          {step === 4 && (
            <StepCard>
              <StepHeader
                icon={<User className="h-5 w-5" />}
                label="Etapa 4 de 9"
              />
              <label className="block text-base sm:text-lg font-semibold text-foreground mt-5 sm:mt-6">
                Qual o segmento do seu negócio?
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ex: Barbearia, Clínica, Salão, etc."
                value={formData.segmento}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, segmento: e.target.value }));
                  setNameError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && goNext()}
                className="mt-3 w-full rounded-xl border bg-background px-4 py-4 text-base text-foreground outline-none ring-1 ring-transparent focus:ring-primary/50 transition"
              />
              {nameError && (
                <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {nameError}
                </p>
              )}
              <NavButtons onBack={goBack} onNext={goNext} canNext={canAdvance()} />
            </StepCard>
          )}

          {/* ── ETAPA 5..9: Questions ── */}
          {step >= 5 && step < 5 + QUESTIONS.length && (
            <QuestionStep
              question={QUESTIONS[step - 5]}
              stepLabel={`Etapa ${step} de 9`}
              selected={formData[QUESTIONS[step - 5].id]}
              onSelect={(val) => selectOption(QUESTIONS[step - 5].id, val)}
              onBack={goBack}
              onNext={goNext}
              canNext={canAdvance()}
              isLast={isLastQuestion}
            />
          )}

          {/* ── RESULT / FLOW SCREENS ── */}
          {isResult && sending && (
            <StepCard>
              <div className="flex flex-col items-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Analisando suas respostas…</p>
              </div>
            </StepCard>
          )}

          {isResult && !sending && flowScreen === "guide_only" && (
            <GuideOnlyScreen nome={formData.nome.trim()} />
          )}

          {isResult && !sending && flowScreen === "demo_offer" && (
            <DemoOfferScreen
              nome={formData.nome.trim()}
              onYes={() => {
                decisionsRef.current.interesse_demo = true;
                decisionsRef.current.tela_final = "normal";
                fireEvent("InteresseSistemaAgendamentoIA", userData(), { classificacao });
                setFlowScreen("normal");
                sendFinalWebhook();
              }}
              onNo={() => {
                decisionsRef.current.interesse_demo = false;
                decisionsRef.current.tela_final = "guide_only";
                setFlowScreen("guide_only");
                sendFinalWebhook();
              }}
            />
          )}

          {isResult && !sending && flowScreen === "normal" && (
            <ResultScreen
              classificacao={classificacao}
              score={score}
              sending={false}
              webhookSent={webhookSent}
              webhookError={webhookError}
              resultEmail={resultEmail}
              resultEmailError={resultEmailError}
              onEmailChange={(val) => setResultEmail(val)}
              onSubmitGuide={handleGuideSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border bg-card shadow-xl rounded-2xl animate-fade-in mx-0">
      <CardContent className="p-5 sm:p-8">{children}</CardContent>
    </Card>
  );
}

function StepHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  canNext,
  nextLabel = "Continuar",
}: {
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 sm:mt-8 flex items-center justify-between gap-3">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition min-h-[44px] px-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>
      <Button
        onClick={onNext}
        disabled={!canNext}
        className="h-12 px-6 rounded-xl font-semibold shadow-md min-w-[140px]"
      >
        {nextLabel}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function QuestionStep({
  question,
  stepLabel,
  selected,
  onSelect,
  onBack,
  onNext,
  canNext,
  isLast = false,
}: {
  question: Question;
  stepLabel: string;
  selected: string;
  onSelect: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  isLast?: boolean;
}) {
  const handleOptionClick = (val: string) => {
    onSelect(val);
    setTimeout(() => onNext(), 300);
  };

  return (
    <StepCard>
      <StepHeader icon={<CheckCircle2 className="h-5 w-5" />} label={stepLabel} />
      <h2 className="mt-5 sm:mt-6 text-base sm:text-lg font-semibold text-foreground leading-snug">
        {question.title}
      </h2>
      <div className="mt-4 sm:mt-5 space-y-2.5">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleOptionClick(opt.value)}
            className={`w-full text-left rounded-xl border px-4 py-4 text-sm font-medium transition active:scale-[0.98]
              ${
                selected === opt.value
                  ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary/[0.02]"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {question.disclaimer && (
        <p className="mt-3 text-xs sm:text-sm text-muted-foreground/70 text-center italic">
          ⚠ {question.disclaimer}
        </p>
      )}
      <NavButtons onBack={onBack} onNext={onNext} canNext={canNext} nextLabel={isLast ? "Ver resultado" : "Continuar"} />
    </StepCard>
  );
}

/* ═══════════════════════════════════════════════
   RESULT SCREEN
   ═══════════════════════════════════════════════ */

function ResultScreen({
  classificacao,
  sending,
  webhookSent,
  webhookError,
  resultEmail,
  resultEmailError,
  onEmailChange,
  onSubmitGuide,
}: {
  classificacao: Classificacao;
  score: number;
  sending: boolean;
  webhookSent: boolean;
  webhookError: boolean;
  resultEmail: string;
  resultEmailError: string;
  onEmailChange: (val: string) => void;
  onSubmitGuide: () => void;
}) {
  const configs: Record<
    Classificacao,
    { color: string; badge: string; message: string }
  > = {
    frio: {
      color: "text-muted-foreground",
      badge: "Análise Concluída",
      message:
        "Identificamos oportunidades de melhoria no seu atendimento. Vamos mostrar como a IA pode ajudar seu negócio a crescer.",
    },
    morno: {
      color: "text-yellow-600",
      badge: "Potencial Identificado",
      message:
        "Seu negócio tem um bom volume de atendimento. A IA pode multiplicar seus resultados automatizando processos estratégicos.",
    },
    quente: {
      color: "text-primary",
      badge: "Alto Potencial de Automação",
      message:
        "Seu negócio está pronto para automação com IA. Podemos reduzir drasticamente o tempo de resposta e aumentar conversões.",
    },
  };

  const cfg = configs[classificacao];

  return (
    <div className="space-y-6 animate-fade-in">
      <StepCard>
        <div className="flex flex-col items-center text-center">
          <span
            className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${cfg.color} bg-secondary`}
          >
            {cfg.badge}
          </span>

          <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-relaxed text-muted-foreground max-w-md">
            {cfg.message}
          </p>

          {webhookError && (
            <p className="mt-4 text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Houve um erro ao enviar. Tente novamente mais tarde.
            </p>
          )}

          {webhookSent && (
            <p className="mt-3 text-xs text-muted-foreground/60 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Dados enviados com sucesso.
            </p>
          )}

          {/* CTA Agendamento */}
          <div className="mt-6 sm:mt-8 w-full max-w-sm space-y-4">
            <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-4">
              <p className="text-sm font-semibold text-foreground">
                🎯 Próximo passo: Demonstração Estratégica
              </p>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Agende um horário com nosso consultor especializado. Vamos mostrar
                exatamente como a IA pode funcionar no seu negócio e quanto você
                pode economizar em tempo e aumentar em conversões.
              </p>
            </div>

            {/* Campo de Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <input
                type="email"
                placeholder="Seu melhor email"
                value={resultEmail}
                onChange={(e) => onEmailChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmitGuide()}
                className="w-full rounded-xl border bg-background pl-10 pr-4 py-4 text-base text-foreground outline-none ring-1 ring-transparent focus:ring-primary/50 transition"
              />
            </div>
            {resultEmailError && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" />
                {resultEmailError}
              </p>
            )}

            <Button
              size="lg"
              className="w-full h-14 text-sm sm:text-base font-semibold rounded-xl shadow-lg transition active:scale-[0.98] hover:scale-[1.02]"
              onClick={onSubmitGuide}
            >
              <Send className="mr-2 h-5 w-5 shrink-0" />
              Agendar Demonstração Agora
            </Button>

            <p className="text-[11px] text-center text-muted-foreground/60">
              ⏱️ Demonstração de 30 minutos · 100% personalizada para seu negócio
            </p>
          </div>
        </div>
      </StepCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   GUIDE ONLY SCREEN (cold lead — 4/4)
   ═══════════════════════════════════════════════ */

function GuideOnlyScreen({ nome }: { nome: string }) {
  const msg = encodeURIComponent(
    `Olá! Me chamo ${nome}, finalizei o diagnóstico e gostaria de receber o Guia do WhatsApp.`
  );
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${msg}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <StepCard>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-foreground sm:text-xl leading-tight">
            {nome ? `${nome}, s` : "S"}eu diagnóstico está pronto!
          </h2>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
            Preparamos um guia prático com as melhores práticas para manter seu
            WhatsApp seguro e estável. Solicite agora pelo WhatsApp e receba
            instantaneamente!
          </p>

          <div className="mt-6 w-full max-w-sm rounded-xl bg-green-50 border border-green-200 p-4 sm:p-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Devido ao alto fluxo de solicitações, o envio por email pode levar
              até 15 minutos. Clique no botão abaixo e receba instantaneamente
              no WhatsApp!
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm shadow-lg transition active:scale-[0.98]"
            >
              <MessageSquare className="h-4 w-4" />
              Receber guia pelo WhatsApp
            </a>
          </div>
        </div>
      </StepCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DEMO OFFER SCREEN (cold lead — 2+/4)
   ═══════════════════════════════════════════════ */

function DemoOfferScreen({
  nome,
  onYes,
  onNo,
}: {
  nome: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <StepCard>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-foreground sm:text-xl leading-tight">
            {nome}, temos a solução ideal para seu atendimento
          </h2>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
            Nosso <span className="font-semibold text-foreground">Sistema de Agendamento com IA</span>{" "}
            atende seus clientes automaticamente, agenda horários, informa preços e disponibilidade{" "}
            <span className="font-medium text-foreground">24 horas por dia, 7 dias por semana</span>,
            sem depender de secretária ou atendimento manual.
          </p>

          <div className="mt-5 w-full max-w-sm space-y-3">
            <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-4">
              <p className="text-xs text-muted-foreground">Benefícios imediatos</p>
              <p className="text-lg sm:text-xl font-bold text-primary mt-1">Atendimento 24/7 com IA</p>
              <p className="text-xs text-muted-foreground mt-1">Reduz perda de clientes · Organiza agenda</p>
            </div>

            <p className="text-sm font-semibold text-foreground mt-4">
              Quer ver uma demonstração de como a IA pode funcionar no seu negócio?
            </p>

            <Button
              size="lg"
              className="w-full h-12 text-sm font-semibold rounded-xl shadow-md"
              onClick={onYes}
            >
              Sim, quero ver a demonstração
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <button
              onClick={onNo}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition py-2"
            >
              Não tenho interesse agora
            </button>
          </div>
        </div>
      </StepCard>
    </div>
  );
}

