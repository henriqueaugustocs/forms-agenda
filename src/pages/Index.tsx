import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldAlert,
  Smartphone,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Play,
  ArrowRight,
  Users,
  MessageSquare,
  BarChart3,
  Shield,
  ShieldCheck,
  Clock,
  BarChart,
  X,
  Ban,
  CircleCheck,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <HeroSection />
      <PainSection />
      <PositioningSection />
      <SocialProofSection />
      <MidCTASection />
      <QualificationSection />
      <ObjectionFilterSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
};

/* ───── Fade-in on scroll ───── */
function useFadeIn() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("animate-fade-in");
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const Section = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useFadeIn();
  return (
    <section
      ref={ref}
      className={`opacity-0 transition-all duration-700 ease-out ${className}`}
    >
      {children}
    </section>
  );
};

/* ───── 1. Hero ───── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 flex flex-col-reverse items-center gap-8 sm:gap-12 py-12 sm:py-20 lg:flex-row lg:py-32">
        {/* Text */}
        <div className="max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold text-primary">Funcionário de IA • Disponível 24/7</span>
          </div>
          
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-6xl">
            Um funcionário de IA que atende seus clientes, agenda automaticamente e aumenta seu faturamento
          </h1>
          
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Pare de perder clientes por demora no atendimento.</span>
            {" "}Nossa IA atende no WhatsApp 24 horas por dia, 7 dias por semana — sem férias, sem atrasos, sem erros.
          </p>
          
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground justify-center lg:justify-start">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Atende instantaneamente</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Agenda automaticamente</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Funciona 24/7</span>
            </div>
          </div>
          
          <Link to="/diagnostico-agendamento">
            <Button size="lg" className="mt-6 sm:mt-8 h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-bold rounded-xl shadow-xl transition active:scale-[0.98] hover:scale-[1.02]">
              Quero Meu Funcionário de IA Agora
              <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
            </Button>
          </Link>
          
          <p className="mt-4 text-xs text-muted-foreground/70">
            ✓ Análise gratuita • ✓ Sem compromisso • ✓ Resultados em 3 minutos
          </p>
        </div>

        {/* Comparison */}
        <div className="w-full max-w-sm sm:max-w-lg lg:max-w-xl">
          <HeroComparison />
        </div>
      </div>
    </section>
  );
}

/* ───── Hero Comparison ───── */
function HeroComparison() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 items-start max-w-full">
      {/* LEFT — Manual */}
      <div className="relative pb-6 flex flex-col">
        <div className="relative rounded-2xl border-2 border-red-200 bg-white shadow-lg overflow-hidden min-h-[280px] sm:min-h-[320px] flex flex-col">
          {/* Red tint */}
          <div className="absolute inset-0 bg-red-50/40 pointer-events-none z-[1]" />

          {/* Header */}
          <div className="relative z-[2] bg-[#008069] px-3 py-2 sm:py-2.5">
            <span className="text-[10px] sm:text-xs font-bold text-white">WhatsApp</span>
          </div>

          {/* Body */}
          <div className="relative z-[2] flex flex-col items-center justify-center text-center px-3 py-6 sm:py-8 space-y-3 sm:space-y-4 flex-1">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-100">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            </div>
            <p className="text-[9px] sm:text-xs font-semibold text-neutral-800 leading-tight">
              Cliente aguardando há 2h
            </p>
            <p className="text-[7px] sm:text-[10px] text-neutral-500 leading-tight">
              Agenda lotada • Secretária sobrecarregada
            </p>
            <div className="w-4/5 rounded-full bg-red-100 py-1.5 sm:py-2 mt-1">
              <span className="text-[7px] sm:text-[10px] font-medium text-red-600">
                3 agendamentos perdidos hoje
              </span>
            </div>
          </div>

          {/* Big X overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[3]">
            <X className="h-20 w-20 sm:h-28 sm:w-28 text-red-500/15" strokeWidth={1.5} />
          </div>
        </div>

        {/* Badge */}
        <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-red-500 px-3 sm:px-4 py-1 sm:py-1.5 shadow-lg z-20">
          <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" strokeWidth={3} />
          <span className="text-[9px] sm:text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap">Manual</span>
        </div>
      </div>

      {/* RIGHT — Com IA */}
      <div className="relative pb-6 flex flex-col">
        <div className="rounded-2xl border-2 border-primary/30 bg-white shadow-lg overflow-hidden min-h-[280px] sm:min-h-[320px] flex flex-col">
          {/* Header */}
          <div className="bg-primary/95 px-3 py-2 sm:py-2.5 flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-white">IA Agendamento</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[6px] sm:text-[8px] font-semibold text-white">
              ✓ Automático
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1 px-2 py-1.5 sm:py-2 bg-primary/5">
            {[
              { label: "Ativos", value: "3" },
              { label: "Fila", value: "0" },
              { label: "Hoje", value: "47" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[10px] sm:text-sm font-bold text-primary">{s.value}</p>
                <p className="text-[6px] sm:text-[8px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Chat list */}
          <div className="px-2 py-1.5 sm:py-2 space-y-1.5 sm:space-y-2">
            {[
              { name: "João Silva", msg: "Boa tarde, gostaria de...", time: "14:32", unread: 2 },
              { name: "Maria Costa", msg: "Obrigada pelo retorno!", time: "14:28", unread: 0 },
              { name: "Pedro Alves", msg: "Vou enviar o comprov...", time: "14:15", unread: 1 },
            ].map((chat) => (
              <div key={chat.name} className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] sm:text-[10px] font-semibold text-foreground truncate">{chat.name}</span>
                    <span className="text-[6px] sm:text-[8px] text-muted-foreground shrink-0 ml-1">{chat.time}</span>
                  </div>
                  <p className="text-[7px] sm:text-[9px] text-muted-foreground truncate">{chat.msg}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-[6px] sm:text-[7px] font-bold text-white">{chat.unread}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-2 py-1.5 sm:py-2 border-t bg-secondary/30">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
              <span className="text-[6px] sm:text-[8px] text-muted-foreground">3 atendentes</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[6px] sm:text-[8px] text-green-600 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-primary px-3 sm:px-4 py-1 sm:py-1.5 shadow-lg z-20">
          <CircleCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" strokeWidth={3} />
          <span className="text-[9px] sm:text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap">Com IA</span>
        </div>
      </div>
    </div>
  );
}

/* ───── 2. Pain Section ───── */
function PainSection() {
  const pains = [
    {
      icon: Clock,
      title: "Clientes abandonam por demora",
      text: "Enquanto você demora para responder, seu cliente já agendou com o concorrente que respondeu em 30 segundos.",
    },
    {
      icon: TrendingDown,
      title: "Perde vendas fora do horário",
      text: "Mensagens à noite, madrugada e fim de semana ficam sem resposta. Seu concorrente com IA está vendendo 24/7.",
    },
    {
      icon: Users,
      title: "Depende de pessoas",
      text: "Secretária atrasou? Ficou doente? Saiu de férias? Seu atendimento para e você perde dinheiro.",
    },
    {
      icon: MessageSquare,
      title: "Agenda virou bagunça",
      text: "Confirmações, remarcações e novos agendamentos misturados no WhatsApp. Impossível escalar assim.",
    },
  ];

  return (
    <Section className="bg-secondary/40">
      <div className="container mx-auto py-12 sm:py-20 lg:py-28">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-sm font-semibold text-primary mb-2">O PROBLEMA DO ATENDIMENTO MANUAL</p>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-5xl">
            Você está perdendo clientes<br />enquanto lê isso
          </h2>
        </div>

        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {pains.map((p) => (
            <Card
              key={p.title}
              className="border-l-4 border-l-red-500 bg-card shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                  <p.icon className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {p.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-10 sm:mt-14 max-w-2xl text-center">
          <p className="text-base sm:text-lg text-muted-foreground">
            <span className="font-bold text-foreground text-xl sm:text-2xl block mb-2">
              A solução? Um funcionário que nunca dorme.
            </span>
            Nossa IA atende, qualifica e agenda seus clientes 24 horas por dia, 7 dias por semana.
            Sem salário, sem férias, sem erros.
          </p>
        </div>

        <div className="flex justify-center mt-8 sm:mt-10">
          <Link to="/diagnostico-agendamento">
            <Button size="lg" className="h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-bold rounded-xl shadow-xl transition active:scale-[0.98] hover:scale-[1.02]">
              Quero Parar de Perder Clientes
              <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
            </Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}

/* ───── 3. Positioning ───── */
function PositioningSection() {
  return (
    <Section>
      <div className="container mx-auto max-w-4xl py-12 sm:py-20 lg:py-28">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-sm font-semibold text-primary mb-2">COMO FUNCIONA</p>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-5xl">
            Seu funcionário de IA trabalha<br />enquanto você dorme
          </h2>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
          {/* Atendimento Manual */}
          <Card className="border-2 border-red-200 bg-red-50/30">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <X className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Atendimento Manual</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Funciona apenas em horário comercial</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Depende de pessoas (férias, atrasos, erros)</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Demora para responder gera perda de clientes</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Custo mensal fixo (salário + encargos)</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Impossível escalar sem contratar mais gente</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Funcionário de IA */}
          <Card className="border-2 border-primary bg-primary/5">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Funcionário de IA</h3>
              </div>
              <ul className="space-y-3 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">Atende 24 horas, 7 dias por semana</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">Nunca falta, nunca atrasa, nunca erra</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">Responde em segundos, não perde clientes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">Sem salário, sem férias, sem encargos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">Atende 1 ou 1000 clientes simultaneamente</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 sm:mt-14 text-center">
          <p className="text-lg sm:text-xl font-bold text-foreground mb-4">
            É como ter uma secretária perfeita que trabalha 24/7 por uma fração do custo.
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Enquanto seus concorrentes perdem clientes por demora no atendimento,
            você está vendendo automaticamente — inclusive enquanto dorme.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ───── 3b. Social Proof ───── */
function SocialProofSection() {
  const stats = [
    { number: "24/7", label: "Atendimento ininterrupto", icon: Clock },
    { number: "< 30s", label: "Tempo médio de resposta", icon: MessageSquare },
    { number: "+150", label: "Negócios automatizados", icon: Users },
  ];

  return (
    <Section className="bg-primary/5">
      <div className="container mx-auto py-12 sm:py-20 lg:py-28">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-sm font-semibold text-primary mb-2">RESULTADOS REAIS</p>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-5xl">
            Negócios que contrataram um<br />funcionário de IA relatam:
          </h2>
        </div>

        <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto mb-10 sm:mb-14">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none bg-card shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-primary mb-2">{stat.number}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">Redução de 70% no tempo de resposta</p>
                <p className="text-xs text-muted-foreground mt-1">Cliente não espera mais horas, recebe resposta em segundos</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">Aumento de 40% em agendamentos</p>
                <p className="text-xs text-muted-foreground mt-1">Atendimento rápido converte mais clientes</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">Zero perda fora do horário</p>
                <p className="text-xs text-muted-foreground mt-1">Vendendo 24/7, inclusive madrugada e fim de semana</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">Economia de até 80% em custo</p>
                <p className="text-xs text-muted-foreground mt-1">Sem salário, férias ou encargos trabalhistas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ───── 4a. Mid CTA (Avaliar Minha Estrutura) ───── */
function MidCTASection() {
  return (
    <Section className="bg-secondary/40">
      <div className="container mx-auto py-12 sm:py-16 lg:py-20 text-center">
        <p className="text-lg sm:text-xl font-bold text-foreground mb-4">
          Pronto para ter um funcionário que nunca dorme?
        </p>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
          Descubra em 3 minutos como a IA pode funcionar no seu negócio
        </p>
        <Link to="/diagnostico-agendamento">
          <Button size="lg" className="h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-bold rounded-xl shadow-xl transition active:scale-[0.98] hover:scale-[1.02]">
            Quero Meu Funcionário de IA
            <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
          </Button>
        </Link>
      </div>
    </Section>
  );
}

/* ───── 4b. Video Section ───── */
function VideoSection() {
  return (
    <Section className="bg-secondary/40">
      <div className="container mx-auto py-12 sm:py-20 lg:py-28 text-center">
        <h2 className="text-xl font-bold text-foreground sm:text-3xl lg:text-4xl">
          Veja como a IA atende e agenda seus clientes
        </h2>

        {/* Video placeholder */}
        <div className="mx-auto mt-8 sm:mt-10 max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-xl">
          <div className="flex aspect-video items-center justify-center bg-muted">
            <button className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105">
              <Play className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </div>
        </div>

        <p className="mx-auto mt-6 sm:mt-8 max-w-xl text-sm sm:text-base text-muted-foreground">
          Em menos de 2 minutos você vai entender como a IA pode transformar
          seu atendimento e multiplicar seus agendamentos.
        </p>

        <Link to="/diagnostico-agendamento">
          <Button size="lg" className="mt-6 sm:mt-8 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-xl shadow-lg">
            Ver Demonstração Gratuita
            <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
          </Button>
        </Link>
      </div>
    </Section>
  );
}

/* ───── 5. Qualification ───── */
function QualificationSection() {
  const items = [
    { emoji: "💈", text: "Barbearias, salões de beleza e nail designers" },
    { emoji: "🏥", text: "Clínicas, consultórios médicos e odontológicos" },
    { emoji: "🏋️", text: "Academias, personal trainers e studios de pilates" },
    { emoji: "🐾", text: "Pet shops, veterinárias e clínicas de estética animal" },
    { emoji: "💆", text: "Clínicas de estética, spas e centros de bem-estar" },
  ];

  return (
    <Section>
      <div className="container mx-auto max-w-3xl py-12 sm:py-20 lg:py-28">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-sm font-semibold text-primary mb-2">PARA QUEM É</p>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-5xl">
            Seu funcionário de IA é perfeito para:
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.text} className="border-none bg-card shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="text-3xl">{item.emoji}</div>
                <span className="text-base font-medium text-foreground">{item.text}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 text-center space-y-4">
          <p className="text-base sm:text-lg font-semibold text-foreground">
            Qualquer negócio que trabalha com agendamentos e atendimento via WhatsApp
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Se você perde clientes por demora no atendimento ou depende de pessoas para agendar,
            um funcionário de IA vai transformar seu negócio.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ───── 5b. Objection Filter ───── */
function ObjectionFilterSection() {
  return (
    <Section className="bg-secondary/30">
      <div className="container mx-auto max-w-2xl py-12 sm:py-16 lg:py-20 text-center">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Esta análise não é indicada para quem busca soluções gratuitas,
          gambiarras ou quer apenas "testar" sem intenção real de melhorar.
        </p>
        <p className="mt-3 text-sm font-medium text-foreground/80">
          Trabalhamos exclusivamente com negócios sérios que querem resultados reais.
        </p>
      </div>
    </Section>
  );
}

/* ───── 6. Final CTA ───── */
function FinalCTASection() {
  return (
    <Section className="bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-20 lg:py-28 text-center">
        <div className="mb-8 sm:mb-10">
          <p className="text-sm font-semibold text-primary mb-3">ÚLTIMA CHANCE</p>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl leading-tight px-4">
            Enquanto você lê isso, seus concorrentes estão vendendo 24/7
          </h2>
        </div>

        <div className="max-w-2xl mx-auto mb-8 sm:mb-10 px-4">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Cada minuto que você adia ter um <span className="font-bold text-foreground">funcionário de IA</span>,
            é um cliente que você perde para quem já automatizou o atendimento.
          </p>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">
            <span className="font-bold text-foreground">A pergunta não é "se" você vai automatizar.</span>
            {" "}A pergunta é: você vai fazer isso antes ou depois dos seus concorrentes?
          </p>
        </div>

        <Card className="border-2 border-primary/20 bg-card shadow-lg max-w-xl mx-auto mb-8 mx-4">
          <CardContent className="p-5 sm:p-6">
            <p className="text-xs sm:text-sm font-semibold text-primary mb-3">O QUE VOCÊ VAI DESCOBRIR:</p>
            <ul className="space-y-2.5 sm:space-y-3 text-left">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span className="text-xs sm:text-sm text-foreground">Quantos clientes você está perdendo por demora no atendimento</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span className="text-xs sm:text-sm text-foreground">Como a IA pode funcionar especificamente no seu negócio</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span className="text-xs sm:text-sm text-foreground">Quanto você pode economizar substituindo atendimento manual por IA</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="px-4">
          <Link to="/diagnostico-agendamento">
            <Button
              size="lg"
              className="w-full max-w-md h-14 sm:h-16 px-6 sm:px-8 text-base sm:text-lg font-bold rounded-xl shadow-xl transition active:scale-[0.98] hover:scale-[1.02]"
            >
              Contratar Meu Funcionário de IA Agora
              <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
            </Button>
          </Link>
        </div>

        <div className="mt-5 sm:mt-6 flex flex-col items-center gap-2 text-xs sm:text-sm text-muted-foreground px-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span>Análise 100% gratuita</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span>Leva apenas 3 minutos</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span>Demonstração personalizada ao final</span>
          </div>
        </div>

        <p className="mt-6 sm:mt-8 text-xs text-muted-foreground/60 px-4">
          Mais de 150 negócios já automatizaram o atendimento. Não fique para trás.
        </p>
      </div>
    </Section>
  );
}

/* ───── 7. Micro FAQ ───── */
function MicroFAQSection() {
  return (
    <Section>
      <div className="container mx-auto max-w-xl py-12 sm:py-16 lg:py-20 text-center">
        <p className="text-sm sm:text-base font-semibold text-foreground">
          "Isso é um chatbot comum ou algo diferente?"
        </p>
        <p className="mt-3 sm:mt-4 text-sm leading-relaxed text-muted-foreground">
          É um sistema completo de agendamento com IA que atende, qualifica e
          agenda seus clientes automaticamente, funcionando como um atendente
          comercial virtual 24/7.
        </p>
      </div>
    </Section>
  );
}

/* ───── 8. Footer ───── */
function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex flex-col items-center gap-1.5 py-6 sm:py-8 text-center text-muted-foreground">
        <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">Synna Tecnologia 2026 | Todos os Direitos Reservados</span>
        <span className="text-[10px] sm:text-xs">JVM Solucoes em Negocios Digitais LTDA | 43.979.010/0001-23</span>
      </div>
    </footer>
  );
}

export default Index;
