import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Block = {
  eventId: string | null;
  slot: string | null;
  summary: string | null;
  start: string | null;
  end: string | null;
};

type Slot = {
  start: string;
  end: string;
  label: string;
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildSlots() {
  const windows = [
    { startMinutes: 8 * 60 + 30, endMinutes: 11 * 60 },
    { startMinutes: 13 * 60 + 30, endMinutes: 16 * 60 + 30 },
  ];

  const labels: string[] = [];
  for (const w of windows) {
    for (let t = w.startMinutes; t < w.endMinutes; t += 30) {
      const hour = Math.floor(t / 60);
      const minute = t % 60;
      labels.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return labels;
}

const ALL_SLOT_LABELS = buildSlots();
const TOKEN_KEY = "synna_admin_token";

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [date, setDate] = useState(() => todayISO());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);

  const blockMap = useMemo(() => {
    const m = new Map<string, Block>();
    for (const b of blocks) {
      if (!b.slot) continue;
      const parts = b.slot.split("T");
      if (parts.length !== 2) continue;
      m.set(parts[1], b);
    }
    return m;
  }, [blocks]);

  const availableSet = useMemo(() => {
    return new Set(availableSlots.map((s) => s.label));
  }, [availableSlots]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [blocksRes, slotsRes] = await Promise.all([
        fetch(`/api/admin-list-blocks?date=${date}`, { headers }),
        fetch(`/api/get-available-slots?date=${date}`),
      ]);

      const blocksJson = await blocksRes.json();
      const slotsJson = await slotsRes.json();

      if (!blocksRes.ok) {
        setError(blocksJson?.details || blocksJson?.error || "Erro ao carregar bloqueios");
        setBlocks([]);
      } else {
        setBlocks(blocksJson?.blocks || []);
      }

      if (!slotsRes.ok) {
        setError((prev) => prev || slotsJson?.details || slotsJson?.error || "Erro ao carregar horários");
        setAvailableSlots([]);
      } else {
        setAvailableSlots(slotsJson?.slots || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBlocks([]);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [date]);

  const saveToken = () => {
    localStorage.setItem(TOKEN_KEY, token);
    load();
  };

  const toggleBlock = async (time: string) => {
    setLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const isBlocked = blockMap.has(time);
      const url = isBlocked ? "/api/admin-unblock-slot" : "/api/admin-block-slot";

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ date, time }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json?.details || json?.error || "Erro ao salvar");
        return;
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-4">
        <Card className="border bg-card shadow-xl rounded-2xl">
          <CardContent className="p-5 sm:p-8 space-y-4">
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-foreground">Admin • Bloqueio de horários</h1>
              <p className="text-xs text-muted-foreground/70">
                Defina bloqueios criando eventos privados no Google Calendar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground/70">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground/70">ADMIN_TOKEN</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Cole o token"
                    className="flex-1 h-11 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <Button onClick={saveToken} className="rounded-xl" disabled={loading}>
                    Salvar
                  </Button>
                </div>
              </div>
            </div>

            {error && <div className="text-xs text-destructive">{error}</div>}

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground/70">
                Clique no horário para alternar entre bloqueado/liberado.
              </p>
              <Button variant="secondary" className="rounded-xl" onClick={load} disabled={loading}>
                Atualizar
              </Button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ALL_SLOT_LABELS.map((t) => {
                const isBlocked = blockMap.has(t);
                const isAvailable = availableSet.has(t);
                const disabled = loading || (!isAvailable && !isBlocked);

                return (
                  <button
                    key={t}
                    disabled={disabled}
                    onClick={() => toggleBlock(t)}
                    className={`rounded-lg border px-3 py-3 text-sm font-semibold transition active:scale-[0.97]
                      ${
                        isBlocked
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : isAvailable
                          ? "border-primary/30 bg-primary/5 text-foreground hover:border-primary/60"
                          : "border-border text-muted-foreground/40 cursor-not-allowed"
                      }`}
                    title={
                      isBlocked
                        ? "Bloqueado"
                        : isAvailable
                        ? "Disponível"
                        : "Indisponível (ocupado ou no passado)"
                    }
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
