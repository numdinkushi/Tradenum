"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
} from "lightweight-charts";

import { Regime } from "@/lib/enums";
import type { ChartBar, ChartState } from "@/lib/types";
import { cn } from "@/lib/utils";

const REGIME_COPY: Record<string, { label: string; className: string }> = {
  [Regime.Up]: { label: "UPTREND", className: "border-cyan-400/40 text-cyan-300" },
  [Regime.Down]: { label: "DOWNTREND", className: "border-rose-400/40 text-rose-300" },
  [Regime.Range]: { label: "RANGE", className: "border-amber-400/40 text-amber-300" },
};

function rollingSma(bars: ChartBar[], n: number) {
  const out: { time: string; value: number }[] = [];
  for (let i = n - 1; i < bars.length; i++) {
    let sum = 0;
    for (let j = i - n + 1; j <= i; j++) sum += bars[j].c;
    out.push({ time: bars[i].t, value: sum / n });
  }
  return out;
}

export function TapeChart({
  chart,
  strikes,
}: {
  chart: ChartState | null;
  strikes: number[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const sma20 = useRef<ISeriesApi<"Line"> | null>(null);
  const sma50 = useRef<ISeriesApi<"Line"> | null>(null);
  const lines = useRef<IPriceLine[]>([]);

  useEffect(() => {
    if (!host.current) return;
    const instance = createChart(host.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#07080c" },
        textColor: "rgba(255,255,255,0.45)",
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        vertLine: { color: "rgba(34,211,238,0.35)", width: 1 },
        horzLine: { color: "rgba(34,211,238,0.35)", width: 1 },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: false },
    });
    const candle = instance.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f43f5e",
      borderVisible: false,
      wickUpColor: "#34d399",
      wickDownColor: "#f43f5e",
    });
    sma20.current = instance.addSeries(LineSeries, {
      color: "rgba(34,211,238,0.7)",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    sma50.current = instance.addSeries(LineSeries, {
      color: "rgba(251,191,36,0.55)",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    api.current = instance;
    series.current = candle;
    return () => {
      instance.remove();
      api.current = null;
      series.current = null;
      sma20.current = null;
      sma50.current = null;
    };
  }, []);

  useEffect(() => {
    if (!series.current || !chart?.bars.length) return;
    series.current.setData(
      chart.bars.map((bar) => ({
        time: bar.t as never,
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
      }))
    );
    sma20.current?.setData(rollingSma(chart.bars, 20) as never);
    sma50.current?.setData(rollingSma(chart.bars, 50) as never);
    api.current?.timeScale().fitContent();
  }, [chart]);

  useEffect(() => {
    const candle = series.current;
    if (!candle) return;
    for (const line of lines.current) candle.removePriceLine(line);
    lines.current = strikes.map((price, i) =>
      candle.createPriceLine({
        price,
        color: i % 2 === 0 ? "#22d3ee" : "#fbbf24",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `K${price}`,
      })
    );
  }, [strikes, chart]);

  const regime = chart?.regime ? REGIME_COPY[chart.regime] : null;

  return (
    <div className="relative h-full min-h-[320px] bg-[#07080c]">
      <div ref={host} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-4 top-3 space-y-1">
        <p className="font-mono text-[10px] tracking-[0.22em] text-white/35">
          {chart?.symbol ?? "—"} · DAILY
        </p>
        <p className="font-mono text-2xl text-white">
          {chart?.price ? chart.price.toFixed(2) : "—"}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {regime ? (
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.18em]",
                regime.className
              )}
            >
              {regime.label}
            </span>
          ) : (
            <span className="text-[11px] text-white/40">loading tape</span>
          )}
          <span className="font-mono text-[9px] tracking-[0.12em] text-cyan-300/70">20</span>
          <span className="font-mono text-[9px] tracking-[0.12em] text-amber-300/70">50</span>
        </div>
      </div>
    </div>
  );
}
