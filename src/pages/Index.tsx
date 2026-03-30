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
    <div className="min-h-screen bg-background">
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
      <div className="container mx-auto flex flex-col-reverse items-center gap-8 sm:gap-12 py-12 sm:py-20 lg:flex-row lg:py-32">
        {/* Text */}
        <div className="max-w-xl text-center lg:text-left">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-5xl">
            Enquanto você trabalha, uma IA atende, qualifica e agenda seus clientes automaticamente
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
            Quantos agendamentos seu negócio perde por demora no atendimento?
            Transforme seu WhatsApp em uma máquina de agendamentos com IA que
            funciona 24/7, sem depender de secretária ou recepcionista.
          </p>
          <Link to="/diagnostico-agendamento">
            <Button size="lg" className="mt-6 sm:mt-8 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-xl shadow-lg">
              Analisar Meu Atendimento Gratuitamente
              <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
            </Button>
          </Link>
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
    <div className="grid grid-cols-2 gap-3 sm:gap-5 items-stretch">
      {/* LEFT — Banned */}
      <div className="relative pb-5 flex flex-col">
        <div className="relative flex-1 rounded-2xl border border-red-200 bg-white shadow-xl overflow-hidden">
          {/* Red tint */}
          <div className="absolute inset-0 bg-red-50/40 pointer-events-none z-[1]" />

          {/* Header */}
          <div className="relative z-[2] bg-[#008069] px-3 py-2 sm:py-2.5">
            <span className="text-[10px] sm:text-xs font-bold text-white">WhatsApp</span>
          </div>

          {/* Body */}
          <div className="relative z-[2] flex flex-col items-center text-center px-3 py-4 sm:py-6 space-y-2 sm:space-y-3">
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

      {/* RIGHT — API Oficial */}
      <div className="relative pb-5 flex flex-col">
        <div className="flex-1 rounded-2xl border border-primary/20 bg-white shadow-xl overflow-hidden">
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
      title: "Clientes esperando resposta",
      text: "Demora no atendimento faz você perder agendamentos para concorrentes mais rápidos.",
    },
    {
      icon: Users,
      title: "Dependência total da secretária",
      text: "Se ela sai, fica doente ou se atrasa, seu atendimento para completamente.",
    },
    {
      icon: MessageSquare,
      title: "Agenda desorganizada e manual",
      text: "Confirmações, remarcações e novos agendamentos viram uma bagunça no WhatsApp.",
    },
    {
      icon: TrendingDown,
      title: "Perda de clientes fora do horário",
      text: "Mensagens à noite e fim de semana ficam sem resposta até segunda-feira.",
    },
  ];

  return (
    <Section className="bg-secondary/40">
      <div className="container mx-auto py-12 sm:py-20 lg:py-28">
        <h2 className="text-center text-xl font-bold text-foreground sm:text-3xl lg:text-4xl">
          Seu negócio enfrenta algum desses problemas?
        </h2>

        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {pains.map((p) => (
            <Card
              key={p.title}
              className="border-none bg-card shadow-md transition-shadow hover:shadow-lg"
            >
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {p.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mx-auto mt-8 sm:mt-10 max-w-xl text-center text-sm sm:text-base text-muted-foreground">
          Se você se identificou com dois ou mais pontos,{" "}
          <span className="font-semibold text-foreground">
            seu atendimento está perdendo dinheiro todos os dias.
          </span>
        </p>

        <div className="flex justify-center mt-6 sm:mt-8">
          <Link to="/diagnostico-agendamento">
            <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-xl shadow-lg">
              Descobrir Como Resolver Isso
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
      <div className="container mx-auto max-w-3xl py-12 sm:py-20 lg:py-28 text-center">
        <h2 className="text-xl font-bold text-foreground sm:text-3xl lg:text-4xl">
          A diferença entre atendimento manual e atendimento com IA
        </h2>
        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
          <p>
            Um sistema de agendamento com IA permite que seu negócio tenha{" "}
            <span className="font-semibold text-foreground">
              atendimento automático 24/7
            </span>{" "}
            , respondendo clientes, informando preços, disponibilidade e fazendo
            agendamentos sem depender de atendimento humano.
          </p>
          <p>
            Enquanto o atendimento manual depende de pessoas disponíveis e gera
            demora, perda de clientes e sobrecarga operacional, a IA garante{" "}
            <span className="font-semibold text-foreground">
              velocidade, organização e escalabilidade
            </span>{" "}
            — tudo o que um negócio moderno precisa para crescer.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ───── 3b. Social Proof ───── */
function SocialProofSection() {
  const bullets = [
    "Redução de 70% no tempo de resposta",
    "Aumento de 40% em agendamentos confirmados",
    "Atendimento funcionando 24/7 sem custo adicional",
  ];

  return (
    <Section>
      <div className="container mx-auto max-w-2xl py-12 sm:py-20 lg:py-28 text-center">
        <p className="text-xs font-medium text-muted-foreground/70 mb-2">
          Resultados reais de negócios que implementaram IA:
        </p>
        <p className="text-xs sm:text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Empresas que automatizaram o agendamento relatam:
        </p>

        <ul className="mt-6 sm:mt-8 space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-center justify-center gap-2.5 text-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm sm:text-base">{b}</span>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-sm font-medium text-muted-foreground">
          +150 negócios já automatizaram o agendamento com IA
        </p>
      </div>
    </Section>
  );
}

/* ───── 4a. Mid CTA (Avaliar Minha Estrutura) ───── */
function MidCTASection() {
  return (
    <Section className="bg-secondary/40">
      <div className="container mx-auto py-12 sm:py-16 lg:py-20 text-center">
        <Link to="/diagnostico-agendamento">
          <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-xl shadow-lg">
            Analisar Meu Atendimento
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
    "Barbearias, clínicas, salões e studios com agenda lotada",
    "Negócios que perdem clientes por demora no atendimento",
    "Empresas que dependem de secretária para agendar",
    "Operações que querem escalar sem aumentar equipe",
  ];

  return (
    <Section>
      <div className="container mx-auto max-w-2xl py-12 sm:py-20 lg:py-28 text-center">
        <h2 className="text-xl font-bold text-foreground sm:text-3xl lg:text-4xl">
          Essa análise é ideal para:
        </h2>

        <ul className="mt-8 sm:mt-10 space-y-4 sm:space-y-5 text-left">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="text-base sm:text-lg text-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-muted-foreground">
          Se você não trabalha com agendamento de clientes, essa solução
          provavelmente não é para você.
        </p>
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
    <Section className="bg-primary/5">
      <div className="container mx-auto max-w-2xl py-12 sm:py-20 lg:py-28 text-center">
        <h2 className="text-xl font-bold text-foreground sm:text-3xl lg:text-4xl">
          Seu negócio cresce. Seu atendimento precisa acompanhar.
        </h2>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
          Responda algumas perguntas estratégicas e descubra como a IA pode
          transformar seu atendimento e multiplicar seus agendamentos.
        </p>

        <p className="mt-6 sm:mt-8 text-sm text-muted-foreground/70">
          Realizamos essa análise apenas com negócios que realmente querem
          modernizar o atendimento e aumentar resultados.
        </p>

        <p className="mt-6 sm:mt-8 text-xs text-muted-foreground/50">
          Análise baseada em dados reais do seu negócio, não em promessas vazias.
        </p>

        <Link to="/diagnostico-agendamento">
          <Button
            size="lg"
            className="mt-6 h-12 sm:h-14 px-6 sm:px-10 text-sm sm:text-base font-semibold rounded-xl shadow-xl transition active:scale-[0.98] hover:scale-[1.02]"
          >
            Iniciar Análise Estratégica Gratuita
            <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
          </Button>
        </Link>

        <div className="mt-5 flex flex-col items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Leva menos de 3 minutos
          </span>
          <span className="flex items-center gap-1.5">
            <BarChart className="h-3.5 w-3.5" />
            Ao final você saberá exatamente como a IA pode funcionar no seu negócio
          </span>
        </div>
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
