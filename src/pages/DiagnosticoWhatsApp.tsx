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
  faturamento: string;
  pessoas_atendimento: string;
  estrutura_atual: string;
  historico_bloqueio: string;
  volume_diario: string;
  intencao: string;
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
    id: "historico_bloqueio",
    title: "Já sofreu bloqueios no WhatsApp?",
    options: [
      { label: "Nunca", value: "Nunca", points: 0 },
      { label: "Uma vez", value: "Uma vez", points: 2 },
      { label: "Mais de uma vez", value: "Mais de uma", points: 4 },
      { label: "Vivo com medo disso", value: "Vivo com medo", points: 5 },
    ],
  },
  {
    id: "volume_diario",
    title: "Qual o volume médio de conversas diárias?",
    options: [
      { label: "Até 20", value: "Até 20", points: 0 },
      { label: "20–50", value: "20-50", points: 1 },
      { label: "50–100", value: "50-100", points: 2 },
      { label: "100–200", value: "100-200", points: 3 },
      { label: "+200", value: "200+", points: 5 },
    ],
  },
  {
    id: "pessoas_atendimento",
    title: "Quantas pessoas fazem parte do time de atendimento de sua empresa?",
    options: [
      { label: "Apenas eu", value: "Apenas eu", points: 0 },
      { label: "2–5 pessoas", value: "2-5", points: 1 },
      { label: "5–10 pessoas", value: "5-10", points: 2 },
      { label: "10–20 pessoas", value: "10-20", points: 3 },
      { label: "+20 pessoas", value: "20+", points: 5 },
    ],
  },
  {
    id: "estrutura_atual",
    title: "Qual estrutura você usa hoje?",
    options: [
      { label: "WhatsApp comum", value: "WhatsApp comum", points: 0 },
      { label: "WhatsApp Business", value: "WhatsApp Business", points: 1 },
      { label: "Vários chips", value: "Vários chips", points: 2 },
      { label: "API Oficial", value: "API Oficial", points: 5 },
    ],
  },
  {
    id: "faturamento",
    title: "Qual o faturamento médio mensal da sua empresa?",
    options: [
      { label: "Até 20 mil", value: "Até 20 mil", points: 0 },
      { label: "20 a 50 mil", value: "20-50 mil", points: 1 },
      { label: "50 a 100 mil", value: "50-100 mil", points: 3 },
      { label: "100 a 300 mil", value: "100-300 mil", points: 4 },
      { label: "Acima de 300 mil", value: "300 mil+", points: 5 },
    ],
  },
  {
    id: "intencao",
    title: "Se existisse uma solução definitiva para estabilizar seu atendimento e escalar com segurança, qual faixa de investimento faria sentido hoje?",
    options: [
      { label: "Até R$ 500", value: "Até 500", points: 0 },
      { label: "R$ 500 a R$ 1.000", value: "500-1000", points: 1 },
      { label: "R$ 1.000 a R$ 2.000", value: "1000-2000", points: 3 },
      { label: "R$ 2.000 a R$ 5.000", value: "2000-5000", points: 4 },
      { label: "+R$ 5.000", value: "5000+", points: 5 },
    ],
    disclaimer: "Essa pergunta é apenas para entendermos qual solução faz mais sentido para seu momento.",
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
  if (score <= 8) return "frio";
  if (score <= 15) return "morno";
  return "quente";
}

const COLD_VALUES: Record<string, string> = {
  volume_diario: "Até 20",
  pessoas_atendimento: "Apenas eu",
  estrutura_atual: "WhatsApp comum",
  faturamento: "Até 20 mil",
};

function countColdAnswers(data: FormData): number {
  let count = 0;
  for (const [key, coldVal] of Object.entries(COLD_VALUES)) {
    if (data[key as keyof FormData] === coldVal) count++;
  }
  return count;
}

const WA_NUMBER = "5562981530007";
const COURSE_URL = "https://henriqueaugusto.com.br/acessocursoapi?utm_source=site&utm_medium=formulario&utm_campaign=acesso_curso_api&utm_content=lead_form";

/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════ */

export default function DiagnosticoWhatsApp() {
  const startTime = useRef(Date.now());
  const [step, setStep] = useState(0);
  // 0 = context, 1 = phone, 2 = name, 3..8 = questions, 9 = result/special
  const lastStep = 2 + QUESTIONS.length; // 8 — last interactive step
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);
  const [webhookError, setWebhookError] = useState(false);
  const [sending, setSending] = useState(false);
  const [resultEmail, setResultEmail] = useState("");
  const [resultEmailError, setResultEmailError] = useState("");

  // Cold-lead flow state
  type FlowScreen = "normal" | "guide_only" | "api_offer" | "course_offer" | "course_buy";
  const [flowScreen, setFlowScreen] = useState<FlowScreen>("normal");

  const [formData, setFormData] = useState<FormData>({
    telefone: "",
    nome: "",
    email: "",
    faturamento: "",
    pessoas_atendimento: "",
    estrutura_atual: "",
    historico_bloqueio: "",
    volume_diario: "",
    intencao: "",
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
    if (step >= 3 && step < 3 + QUESTIONS.length) {
      const q = QUESTIONS[step - 3];
      return !!formData[q.id];
    }
    return false;
  };

  const isLastQuestion = step === 2 + QUESTIONS.length; // step 8

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
      score_total: score,
      classificacao,
      respostas: {
        historico_bloqueio: fd.historico_bloqueio || null,
        volume_diario: fd.volume_diario || null,
        pessoas_atendimento: fd.pessoas_atendimento || null,
        estrutura_atual: fd.estrutura_atual || null,
        faturamento: fd.faturamento || null,
        intencao: fd.intencao || null,
      },
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
      content_name: "diagnostico_whatsapp",
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
      respostas: {
        historico_bloqueio: fd.historico_bloqueio || null,
        volume_diario: fd.volume_diario || null,
        pessoas_atendimento: fd.pessoas_atendimento || null,
        estrutura_atual: fd.estrutura_atual || null,
        faturamento: fd.faturamento || null,
        intencao: fd.intencao || null,
      },
      ...(formCompleted ? decisionsRef.current : {}),
      tempo_preenchimento_segundos: Math.round((Date.now() - startTime.current) / 1000),
      origem: "landing_diagnostico",
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
    setStep(lastStep + 1); // result screen (step 9)

    // Standard Lead event
    fireEvent("Lead", userData(), {
      content_name: "diagnostico_completo",
      value: score,
      currency: "BRL",
      classificacao,
    }, true);

    const coldCount = countColdAnswers(formData);
    decisionsRef.current.cold_count = coldCount;
    decisionsRef.current.qualificacao = coldCount === 0 ? "qualificado" : "desqualificado";

    if (coldCount >= 2) {
      // 2+ cold answers → API Oficial R$1200 offer (Fluxo B)
      decisionsRef.current.fluxo = "B";
      setSending(false);
      setFlowScreen("api_offer");
      fireEvent("LeadDesqualificado", userData(), { cold_count: coldCount, classificacao, fluxo: "B" });
    } else if (coldCount === 1) {
      // 1 cold answer → guide only, no email/reunion (Fluxo A) — terminal screen
      decisionsRef.current.fluxo = "A";
      decisionsRef.current.tela_final = "guide_only";
      setSending(false);
      setFlowScreen("guide_only");
      fireEvent("LeadDesqualificado", userData(), { cold_count: coldCount, classificacao, fluxo: "A" });
      sendFinalWebhook();
    } else {
      // 0 cold → normal flow (Fluxo C) — webhook deferred until email step
      decisionsRef.current.fluxo = "C";
      decisionsRef.current.tela_final = "normal";
      setSending(false);
      setFlowScreen("normal");
      fireEvent("LeadQualificado", userData(), { cold_count: coldCount, classificacao, fluxo: "C" });
    }
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
                <h1 className="text-xl font-bold text-foreground sm:text-2xl leading-tight">
                  Diagnóstico Estratégico da Sua Operação de WhatsApp
                </h1>

                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md">
                  Em menos de 2 minutos, vamos analisar como está sua operação
                  hoje e identificar o que é necessário para garantir{" "}
                  <span className="font-medium text-foreground">segurança</span>,{" "}
                  <span className="font-medium text-foreground">estabilidade</span> e{" "}
                  <span className="font-medium text-foreground">escala</span> no
                  seu atendimento via WhatsApp.
                </p>

                <div className="mt-5 sm:mt-6 w-full max-w-sm space-y-2.5 text-left">
                  <p className="text-xs sm:text-sm font-semibold text-foreground text-center uppercase tracking-wide">
                    O que você vai descobrir:
                  </p>
                  {[
                    "O nível de risco atual da sua operação",
                    "Quais pontos precisam de atenção imediata",
                    "O caminho para estruturar seu atendimento de forma profissional",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-muted-foreground leading-snug">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 sm:mt-6 w-full max-w-sm rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 sm:py-4">
                  <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
                    🎁 Ao final, você receberá um <span className="font-bold">guia prático personalizado</span> com
                    as melhores práticas para proteger, estabilizar e escalar sua
                    operação de atendimento.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="mt-6 sm:mt-8 h-12 sm:h-14 px-8 text-sm sm:text-base font-semibold rounded-xl shadow-lg"
                  onClick={() => {
                    fireEvent("FormularioIniciado", {}, { content_name: "diagnostico_whatsapp" });
                    goNext();
                  }}
                >
                  Iniciar diagnóstico
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="mt-3 text-[11px] sm:text-xs text-muted-foreground/60">
                  São apenas 6 perguntas rápidas · 100% gratuito
                </p>
              </div>
            </StepCard>
          )}

          {/* ── ETAPA 1: Phone ── */}
          {step === 1 && (
            <StepCard>
              <StepHeader
                icon={<Phone className="h-5 w-5" />}
                label="Etapa 1 de 8"
              />
              <label className="block text-base sm:text-lg font-semibold text-foreground mt-5 sm:mt-6">
                Seu WhatsApp principal
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
                Usamos esse número para enviar o guia e o resultado da
                análise.
              </p>
              <NavButtons onBack={goBack} onNext={goNext} canNext={canAdvance()} />
            </StepCard>
          )}

          {/* ── ETAPA 2: Name ── */}
          {step === 2 && (
            <StepCard>
              <StepHeader
                icon={<User className="h-5 w-5" />}
                label="Etapa 2 de 8"
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

          {/* ── ETAPA 3..8: Questions ── */}
          {step >= 3 && step < 3 + QUESTIONS.length && (
            <QuestionStep
              question={QUESTIONS[step - 3]}
              stepLabel={`Etapa ${step} de 8`}
              selected={formData[QUESTIONS[step - 3].id]}
              onSelect={(val) => selectOption(QUESTIONS[step - 3].id, val)}
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

          {isResult && !sending && flowScreen === "api_offer" && (
            <ApiOficialOfferScreen
              nome={formData.nome.trim()}
              onYes={() => {
                decisionsRef.current.interesse_api_1200 = true;
                decisionsRef.current.tela_final = "normal";
                fireEvent("InteresseApiOficial", userData(), { value: 1200, currency: "BRL", classificacao });
                setFlowScreen("normal");
                sendFinalWebhook();
              }}
              onNo={() => {
                decisionsRef.current.interesse_api_1200 = false;
                setFlowScreen("course_offer");
              }}
            />
          )}

          {isResult && !sending && flowScreen === "course_offer" && (
            <CourseOfferScreen
              nome={formData.nome.trim()}
              onYes={() => {
                decisionsRef.current.interesse_curso_97 = true;
                fireEvent("InteresseCurso", userData(), { value: 97, currency: "BRL", classificacao });
                setFlowScreen("course_buy");
              }}
              onNo={() => {
                decisionsRef.current.interesse_curso_97 = false;
                decisionsRef.current.tela_final = "guide_only";
                setFlowScreen("guide_only");
                sendFinalWebhook();
              }}
            />
          )}

          {isResult && !sending && flowScreen === "course_buy" && (
            <CourseBuyScreen
              nome={formData.nome.trim()}
              onClickComprar={() => {
                decisionsRef.current.tela_final = "course_buy";
                decisionsRef.current.acao_curso = "comprar_link";
                sendFinalWebhook();
              }}
              onClickWhatsApp={() => {
                decisionsRef.current.tela_final = "course_buy";
                decisionsRef.current.acao_curso = "solicitar_whatsapp";
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
              onEmailChange={(val) => {
                setResultEmail(val);
                setResultEmailError("");
              }}
              onSubmitGuide={() => {
                if (!resultEmail) {
                  setResultEmailError("Informe seu email para receber o guia.");
                  return;
                }
                if (!isValidEmail(resultEmail)) {
                  setResultEmailError("Email inválido.");
                  return;
                }
                // Update formData so buildPayload picks up the email
                formDataRef.current = { ...formDataRef.current, email: resultEmail };
                sendFinalWebhook({ email: resultEmail });
                navigate("/confirmacao", {
                  state: {
                    nome: formData.nome.trim(),
                    email: resultEmail,
                    telefone: "55" + rawPhone(formData.telefone),
                    classificacao,
                    score,
                  },
                });
              }}
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
      badge: "Resultado: Fase Inicial",
      message:
        "Seu cenário ainda não exige uma estrutura avançada. Recomendamos aplicar boas práticas antes de migrar para uma solução mais robusta.",
    },
    morno: {
      color: "text-yellow-600",
      badge: "Resultado: Em Crescimento",
      message:
        "Sua operação está crescendo e pode enfrentar instabilidades se continuar escalando sem estrutura.",
    },
    quente: {
      color: "text-primary",
      badge: "Resultado: Estruturação Urgente",
      message:
        "Pelo seu perfil e volume, sua operação já exige uma estrutura profissional para evitar riscos e gargalos.",
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

          {/* Email + CTA */}
          <div className="mt-6 sm:mt-8 w-full max-w-sm space-y-3">
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
            <p className="text-[11px] text-muted-foreground/50">
              Para garantir que você receba o guia, deixe também seu email. Caso
              não chegue pelo WhatsApp, enviaremos diretamente no seu email.
            </p>

            <Button
              size="lg"
              className="w-full h-14 text-sm sm:text-base font-semibold rounded-xl shadow-lg transition active:scale-[0.98] hover:scale-[1.02]"
              onClick={onSubmitGuide}
            >
              <Send className="mr-2 h-5 w-5 shrink-0" />
              Receber guia no WhatsApp
            </Button>
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
   API OFICIAL OFFER SCREEN (cold lead — 2-3/4)
   ═══════════════════════════════════════════════ */

function ApiOficialOfferScreen({
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
            {nome}, temos a solução ideal para sua operação
          </h2>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
            Em nossa empresa, implantamos o serviço de{" "}
            <span className="font-semibold text-foreground">API Oficial do WhatsApp</span>,
            que traz <span className="font-medium text-foreground">estabilidade</span>,{" "}
            <span className="font-medium text-foreground">segurança contra bloqueios</span> e{" "}
            <span className="font-medium text-foreground">escala</span> para o seu atendimento.
          </p>

          <div className="mt-5 w-full max-w-sm space-y-3">
            <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-4">
              <p className="text-xs text-muted-foreground">Investimento a partir de</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">R$ 1.200,00</p>
              <p className="text-xs text-muted-foreground mt-1">Implantação completa</p>
            </div>

            <p className="text-sm font-semibold text-foreground mt-4">
              Este valor faz sentido para conter os bloqueios na sua empresa e
              escalar o atendimento no WhatsApp?
            </p>

            <Button
              size="lg"
              className="w-full h-12 text-sm font-semibold rounded-xl shadow-md"
              onClick={onYes}
            >
              Sim, quero saber mais
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <button
              onClick={onNo}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition py-2"
            >
              Não faz sentido para mim agora
            </button>
          </div>
        </div>
      </StepCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COURSE OFFER SCREEN (declined R$1200)
   ═══════════════════════════════════════════════ */

function CourseOfferScreen({
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
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-yellow-100">
            <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-600" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-foreground sm:text-xl leading-tight">
            {nome}, temos outra opção para você!
          </h2>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
            Temos um <span className="font-semibold text-foreground">curso completo e passo a passo</span> onde
            ensinamos tudo sobre a API Oficial do WhatsApp: como implantar,
            configurar da forma correta e garantir{" "}
            <span className="font-medium text-foreground">segurança e escala</span> na
            sua operação de atendimento.
          </p>

          <div className="mt-5 w-full max-w-sm space-y-3">
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-4">
              <p className="text-xs text-muted-foreground">Curso completo por apenas</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1">R$ 97,00</p>
              <p className="text-xs text-muted-foreground mt-1">Acesso imediato · Passo a passo</p>
            </div>

            <p className="text-sm font-semibold text-foreground mt-4">
              Tem interesse em aprender a implantar a API Oficial por conta própria?
            </p>

            <Button
              size="lg"
              className="w-full h-12 text-sm font-semibold rounded-xl shadow-md bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={onYes}
            >
              Sim, tenho interesse!
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <button
              onClick={onNo}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition py-2"
            >
              Não, quero apenas o guia gratuito
            </button>
          </div>
        </div>
      </StepCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COURSE BUY SCREEN (interested in R$97 course)
   ═══════════════════════════════════════════════ */

function CourseBuyScreen({ nome, onClickComprar, onClickWhatsApp }: { nome: string; onClickComprar?: () => void; onClickWhatsApp?: () => void }) {
  const msg = encodeURIComponent(
    `Me chamo ${nome}, e quero solicitar o acesso ao curso da Api Oficial.`
  );
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${msg}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <StepCard>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-foreground sm:text-xl leading-tight">
            Garanta seu acesso ao curso!
          </h2>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
            Aprenda a implantar a API Oficial do WhatsApp no seu negócio.
            Curso completo e passo a passo com tudo que você precisa para
            ter segurança e escala no atendimento.
          </p>

          <div className="mt-6 w-full max-w-sm space-y-3">
            <a
              href={COURSE_URL || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClickComprar?.()}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-lg transition active:scale-[0.98]"
            >
              <BookOpen className="h-4 w-4" />
              Comprar curso agora
            </a>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClickWhatsApp?.()}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm shadow-lg transition active:scale-[0.98]"
            >
              <MessageSquare className="h-4 w-4" />
              Solicitar curso no WhatsApp
            </a>
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground/50">
            Valor único de R$ 97,00 · Acesso imediato
          </p>
        </div>
      </StepCard>
    </div>
  );
}
