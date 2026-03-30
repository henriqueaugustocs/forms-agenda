import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fireEvent } from "@/lib/fbpixel";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  ArrowRight,
  Loader2,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   TYPES & CONFIG
   ═══════════════════════════════════════════════ */

interface LocationState {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  segmento: string;
  classificacao: string;
  score: number;
}

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return days;
}

function isWeekday(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month, day).getDay();
  return dow !== 0 && dow !== 6;
}

function isFutureDate(year: number, month: number, day: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(year, month, day);
  return date > today;
}

function formatDateBR(year: number, month: number, day: number): string {
  return `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
}

function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */

export default function Confirmacao() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as Partial<LocationState>;

  const [showSuccessBannerMobile, setShowSuccessBannerMobile] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSuccessBannerMobile(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const nome = state.nome ?? "";
  const email = state.email ?? "";
  const telefone = state.telefone ?? "";
  const empresa = state.empresa ?? "";
  const segmento = state.segmento ?? "";
  const classificacao = state.classificacao ?? "";
  const score = state.score ?? 0;

  // If no state, redirect back
  if (!nome && !telefone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="border bg-card shadow-xl rounded-2xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Sessão expirada.</p>
            <Button className="mt-6 rounded-xl" onClick={() => navigate("/")}>
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-5 sm:py-12 space-y-4 sm:space-y-8">
        {/* ── Success message ── */}
        <div className={`${showSuccessBannerMobile ? "block" : "hidden"} sm:block`}>
          <Card className="border bg-card shadow-xl rounded-2xl animate-fade-in">
            <CardContent className="p-4 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-base font-bold text-foreground sm:text-2xl leading-tight">
                  {nome ? `${nome}, s` : "S"}ua análise está pronta!
                </h1>

                <p className="mt-2 sm:mt-4 text-xs sm:text-sm leading-relaxed text-muted-foreground max-w-md">
                  Enviamos o diagnóstico personalizado para o seu WhatsApp e email.
                  Agora, agende uma demonstração estratégica para ver como a IA pode
                  funcionar no seu negócio.
                </p>

                <div className="hidden sm:flex mt-4 sm:mt-6 flex-col sm:flex-row items-center gap-2 sm:gap-3 text-xs text-muted-foreground/70">
                  {telefone && (
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      WhatsApp confirmado
                    </span>
                  )}
                  {email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {email}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Scheduling section ── */}
        <Card className="border bg-card shadow-xl rounded-2xl animate-fade-in">
          <CardContent className="p-5 sm:p-8">
            <SchedulingCalendar
              nome={nome}
              email={email}
              telefone={telefone}
              empresa={empresa}
              segmento={segmento}
              classificacao={classificacao}
              score={score}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCHEDULING CALENDAR
   ═══════════════════════════════════════════════ */

function SchedulingCalendar({
  nome,
  email,
  telefone,
  empresa,
  segmento,
  classificacao,
  score,
}: {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  segmento: string;
  classificacao: string;
  score: number;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [availableSlots, setAvailableSlots] = useState<Array<{start: string, end: string, label: string}>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const confirmCtaRef = useRef<HTMLDivElement | null>(null);

  const days = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  // Auto-select the next available weekday in the current view so slots show immediately
  useEffect(() => {
    if (selectedDay) return;
    for (const d of days) {
      if (!d) continue;
      if (!isWeekday(viewYear, viewMonth, d)) continue;
      if (!isFutureDate(viewYear, viewMonth, d)) continue;
      setSelectedDay(d);
      return;
    }
  }, [days, selectedDay, viewMonth, viewYear]);

  useEffect(() => {
    if (!selectedDay || !selectedTime) return;
    confirmCtaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedDay, selectedTime]);

  // Fetch available slots when a day is selected
  useEffect(() => {
    if (!selectedDay) {
      setAvailableSlots([]);
      return;
    }

    const dateISO = formatDateISO(viewYear, viewMonth, selectedDay);
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedTime(null);

    fetch(`/api/get-available-slots?date=${dateISO}`)
      .then((r) => r.json())
      .then((data) => {
        setAvailableSlots(data.slots || []);
      })
      .catch(() => {
        setError("Erro ao buscar horários. Tente novamente.");
        setAvailableSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDay, viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
    setSelectedTime(null);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
    setSelectedTime(null);
  };

  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();

  const handleConfirm = async () => {
    if (!selectedDay || !selectedTime) return;
    setConfirming(true);
    setError("");

    const dateISO = formatDateISO(viewYear, viewMonth, selectedDay);
    const dateBR = formatDateBR(viewYear, viewMonth, selectedDay);

    // Create Google Calendar event via backend
    let calendarLink = "";
    try {
      const res = await fetch(`/api/create-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          empresa,
          segmento,
          date: dateISO,
          time: selectedTime,
          classificacao,
          score,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao agendar. Tente novamente.");
        setConfirming(false);
        return;
      }

      calendarLink = data.htmlLink || "";
      console.log("[Google Calendar] Event created:", calendarLink);
    } catch {
      setError("Erro ao conectar com o servidor de agendamento.");
      setConfirming(false);
      return;
    }

    setConfirming(false);
    setConfirmed(true);
    fireEvent("ReuniaoAgendadaAgendamentoIA", { email, phone: telefone, firstName: nome }, {
      content_name: "demonstracao_ia_agendamento",
      classificacao,
      score,
    });
  };

  if (confirmed) {
    const whatsappNumber = "5562981530007";
    const whatsappMessage = encodeURIComponent(
      `Olá! Acabei de finalizar a análise e agendar minha demonstração do Sistema de Agendamento com IA. Meu nome é ${nome}.`
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    return (
      <div className="flex flex-col items-center justify-center text-center py-8 min-h-[60vh] animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Demonstração agendada!</h3>
        <p className="mt-3 text-sm text-muted-foreground max-w-sm">
          Sua demonstração estratégica está confirmada para{" "}
          <span className="font-semibold text-foreground">
            {formatDateBR(viewYear, viewMonth, selectedDay!)} às {selectedTime}
          </span>
          . Enviaremos um lembrete no seu WhatsApp e email.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/60">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Evento adicionado ao Google Calendar</span>
        </div>

        <div className="mt-6 sm:mt-8 w-full max-w-sm rounded-xl bg-green-50 border border-green-200 p-4 sm:p-5">
          <p className="text-sm font-semibold text-foreground">
            Confirme seu agendamento no WhatsApp
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Devido ao alto fluxo de solicitações, o envio do guia por email pode
            levar até 15 minutos. Clique no botão abaixo e receba
            instantaneamente no WhatsApp!
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm shadow-lg transition active:scale-[0.98]"
          >
            <MessageSquare className="h-4.5 w-4.5" />
            Solicitar guia pelo WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-base font-bold text-foreground sm:text-xl leading-snug">
          Quer entender a melhor forma de escalar seu atendimento?
        </h2>
        <p className="mt-2 sm:mt-3 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Agende uma conversa rápida com um dos nossos consultores.
          Vamos analisar sua operação e mostrar o caminho mais seguro
          para estruturar seu WhatsApp com a API Oficial.
        </p>
        <p className="mt-3 text-xs text-muted-foreground/60">
          Clique em um dia abaixo, escolha um horário e agende sua reunião agora (leva ~10s).
        </p>
      </div>

      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          disabled={!canGoPrev}
          className="p-2 rounded-lg hover:bg-secondary transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-secondary transition"
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium text-muted-foreground/60 py-1"
          >
            {d}
          </div>
        ))}

        {/* Day cells */}
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }

          const available =
            isWeekday(viewYear, viewMonth, day) &&
            isFutureDate(viewYear, viewMonth, day);
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              disabled={!available}
              onClick={() => setSelectedDay(day)}
              className={`aspect-square rounded-lg text-sm font-medium transition
                ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : available
                    ? "text-foreground hover:bg-primary/10"
                    : "text-muted-foreground/30 cursor-not-allowed"
                }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {selectedDay && (
        <div className="animate-fade-in">
          <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Horários disponíveis para {formatDateBR(viewYear, viewMonth, selectedDay)}
          </p>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Buscando horários…</span>
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 text-center py-4">
              Nenhum horário disponível nesta data.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => setSelectedTime(slot.label)}
                  className={`rounded-lg border px-3 py-3 text-sm font-medium transition active:scale-[0.97]
                    ${
                      selectedTime === slot.label
                        ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm button */}
      {selectedDay && selectedTime && (
        <div ref={confirmCtaRef} className="animate-fade-in pt-2">
          {error && (
            <p className="text-xs text-destructive mb-3">{error}</p>
          )}
          <Button
            size="lg"
            className="w-full h-14 text-sm sm:text-base font-semibold rounded-xl shadow-lg transition active:scale-[0.98] hover:scale-[1.02]"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirming ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Agendando…
              </>
            ) : (
              <>
                Confirmar reunião
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-[11px] sm:text-xs text-muted-foreground/50">
            Duração estimada: 30 minutos • Sem compromisso
          </p>
        </div>
      )}
    </div>
  );
}
