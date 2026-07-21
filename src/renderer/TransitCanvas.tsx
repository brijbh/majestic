import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { useAppStore } from "../state/app-store";
import type {
  ThemeName,
  TransitLine,
  TransitMapModel,
  TransitStage,
  TransitTrain,
} from "../transit/model";

type Props = {
  model: TransitMapModel;
  theme: ThemeName;
  paused: boolean;
  speed: number;
};

const stageIcons: Record<TransitStage, string> = {
  start: "⌁",
  development: "</>",
  "pull-request": "{}",
  review: "☷",
  checks: "✓",
  merge: "⌘",
  release: "⚑",
  deploy: "↗",
};

const stageSubtitles: Record<TransitStage, string> = {
  start: "Branch Created",
  development: "Commits",
  "pull-request": "Opened",
  review: "In Progress",
  checks: "CI / Tests",
  merge: "Into Main",
  release: "Tagged",
  deploy: "Production",
};

export function TransitCanvas({ model, theme, paused, speed }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectTrain = useAppStore((state) => state.selectTrain);
  const [rendererError, setRendererError] = useState<string>();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new PIXI.Application();
    let destroyed = false;
    let initialized = false;
    setRendererError(undefined);

    void app
      .init({
        resizeTo: host,
        antialias: theme === "metro",
        backgroundAlpha: 0,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      })
      .then(() => {
        initialized = true;
        if (destroyed) {
          safelyDestroyApp(app);
          return;
        }
        host.appendChild(app.canvas);
        const scene = new PIXI.Container();
        app.stage.addChild(scene);
        const tick = () => {
          try {
            drawScene(app, scene, model, theme, paused, speed, selectTrain);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown renderer error";
            console.error("[Git Transit] Renderer draw failed", error);
            setRendererError(message);
            app.ticker.remove(tick);
          }
        };
        app.ticker.add(tick);
        drawScene(app, scene, model, theme, paused, speed, selectTrain);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "PixiJS renderer could not start.";
        console.error("[Git Transit] Renderer initialization failed", error);
        setRendererError(message);
      });

    return () => {
      destroyed = true;
      if (initialized) safelyDestroyApp(app);
    };
  }, [model, paused, selectTrain, speed, theme]);

  return (
    <div className="transit-canvas" ref={hostRef}>
      {rendererError ? (
        <div className="renderer-error" role="alert">
          <strong>Map renderer failed</strong>
          <span>{rendererError}</span>
        </div>
      ) : null}
    </div>
  );
}

function drawScene(
  app: PIXI.Application,
  scene: PIXI.Container,
  model: TransitMapModel,
  theme: ThemeName,
  paused: boolean,
  speed: number,
  selectTrain: (train?: TransitTrain) => void,
) {
  const width = app.renderer.width / (window.devicePixelRatio || 1);
  const height = app.renderer.height / (window.devicePixelRatio || 1);
  const time = paused ? 0 : performance.now() * 0.001 * speed;
  scene.removeChildren();

  const frame = {
    left: Math.max(110, width * 0.08),
    right: width - Math.max(70, width * 0.05),
    top: Math.max(118, height * 0.15),
    bottom: height - Math.max(84, height * 0.12),
  };
  const stageY = frame.top + 118;
  const routeHeight = frame.bottom - stageY;

  drawBackground(scene, width, height, theme, time);
  drawStageHeaders(scene, model, frame, theme);

  const visibleLines = model.lines.filter((line) =>
    model.trains.some((train) => train.line === line.id),
  );
  const lines = visibleLines.length > 0 ? visibleLines : model.lines.slice(0, 5);
  const lineY = new Map<string, number>();
  lines.forEach((line, index) => {
    lineY.set(
      line.id,
      stageY + (routeHeight * (index + 0.5)) / Math.max(1, lines.length),
    );
  });

  for (const line of lines) {
    const y = lineY.get(line.id) ?? stageY;
    drawRoute(scene, line, y, model, frame, theme);
  }

  for (const train of model.trains.slice(0, 14)) {
    const line = model.lines.find((item) => item.id === train.line) ?? model.lines[0];
    const y = lineY.get(train.line);
    if (!y) continue;
    drawTrain(scene, train, line, y, model, frame, theme, time, selectTrain);
  }

  drawMiniMap(scene, lines, frame, width, height, theme);
}

function drawBackground(
  scene: PIXI.Container,
  width: number,
  height: number,
  theme: ThemeName,
  time: number,
) {
  const bg = new PIXI.Graphics();
  bg.rect(0, 0, width, height).fill(theme === "metro" ? 0x030914 : 0x08211a);

  if (theme === "retro") {
    drawRetroTerrain(bg, width, height, time);
  } else {
    drawMetroGrid(bg, width, height);
  }
  scene.addChild(bg);
}

function drawMetroGrid(bg: PIXI.Graphics, width: number, height: number) {
  bg.rect(0, height * 0.72, width, height * 0.28).fill({
    color: 0x06101d,
    alpha: 0.9,
  });
  for (let x = 0; x < width; x += 42) {
    bg.moveTo(x, 0)
      .lineTo(x, height)
      .stroke({ color: 0x16425f, width: 1, alpha: 0.14 });
  }
  for (let y = 0; y < height; y += 42) {
    bg.moveTo(0, y).lineTo(width, y).stroke({ color: 0x16425f, width: 1, alpha: 0.1 });
  }
  for (let i = 0; i < 24; i += 1) {
    const x = 80 + ((i * 91) % Math.max(120, width - 160));
    const h = 20 + ((i * 17) % 86);
    bg.rect(x, height - 54 - h, 28, h).fill({ color: 0x0a1627, alpha: 0.9 });
    bg.rect(x + 7, height - 72 - (h % 20), 4, 4).fill(0xffb454);
    bg.rect(x + 18, height - 92 - (h % 26), 4, 4).fill(0x7ee787);
  }
}

function drawRetroTerrain(
  bg: PIXI.Graphics,
  width: number,
  height: number,
  time: number,
) {
  for (let x = 0; x < width; x += 16) {
    for (let y = 0; y < height; y += 16) {
      const tone = (x / 16 + y / 16) % 2 === 0 ? 0x0c2b1f : 0x103525;
      bg.rect(x, y, 16, 16).fill({ color: tone, alpha: 0.92 });
    }
  }
  for (let i = 0; i < 92; i += 1) {
    const x = (i * 73) % width;
    const y = 108 + ((i * 41) % Math.max(120, height - 260));
    const color = i % 5 === 0 ? 0x246e65 : i % 3 === 0 ? 0x4b8a2f : 0x24551f;
    bg.rect(x, y, 10, 10).fill(color);
    bg.rect(x + 3, y - 6, 5, 6).fill(color);
  }
  bg.rect(0, height - 122, width, 122).fill({ color: 0x0a3444, alpha: 0.9 });
  for (let x = 0; x < width; x += 24) {
    const wave = Math.sin(time + x * 0.03) * 4;
    bg.rect(x, height - 92 + wave, 18, 3).fill(0x1d7e95);
  }
  for (let i = 0; i < 10; i += 1) {
    const x = width * 0.58 + i * 28;
    const h = 38 + ((i * 19) % 72);
    bg.rect(x, height - 130 - h, 20, h).fill(0x10243a);
    bg.rect(x + 5, height - 150 - (h % 24), 4, 4).fill(0xffc857);
  }
}

function drawStageHeaders(
  scene: PIXI.Container,
  model: TransitMapModel,
  frame: { left: number; right: number; top: number; bottom: number },
  theme: ThemeName,
) {
  const w = frame.right - frame.left;
  for (const station of model.stations) {
    const x = frame.left + w * station.x;
    const guide = new PIXI.Graphics();
    guide
      .moveTo(x, frame.top + 68)
      .lineTo(x, frame.bottom)
      .stroke({
        color: theme === "metro" ? 0x335a76 : 0xf5cf61,
        width: theme === "metro" ? 1 : 2,
        alpha: theme === "metro" ? 0.32 : 0.5,
      });
    scene.addChild(guide);

    const title = text(station.label.toUpperCase(), {
      fill: theme === "metro" ? "#ffe77a" : "#ffd957",
      fontSize: 15,
      fontFamily: theme === "retro" ? "Consolas, monospace" : "Segoe UI, sans-serif",
      fontWeight: "700",
    });
    title.anchor.set(0.5, 0);
    title.x = x;
    title.y = frame.top;
    scene.addChild(title);

    const subtitle = text(stageSubtitles[station.id], {
      fill: theme === "metro" ? "#9daabd" : "#f5df9d",
      fontSize: 13,
    });
    subtitle.anchor.set(0.5, 0);
    subtitle.x = x;
    subtitle.y = frame.top + 24;
    scene.addChild(subtitle);

    const icon = new PIXI.Graphics();
    icon.circle(x, frame.top + 58, 18).stroke({
      color: stationColor(station.id),
      width: 3,
      alpha: 0.95,
    });
    scene.addChild(icon);
    const iconText = text(stageIcons[station.id], {
      fill: `#${stationColor(station.id).toString(16).padStart(6, "0")}`,
      fontSize: 17,
      fontWeight: "700",
    });
    iconText.anchor.set(0.5);
    iconText.x = x;
    iconText.y = frame.top + 58;
    scene.addChild(iconText);
  }
}

function drawRoute(
  scene: PIXI.Container,
  line: TransitLine,
  y: number,
  model: TransitMapModel,
  frame: { left: number; right: number; top: number; bottom: number },
  theme: ThemeName,
) {
  const w = frame.right - frame.left;
  const path = new PIXI.Graphics();
  const points = model.stations.map((station) => ({
    x: frame.left + w * station.x,
    y,
  }));
  path.moveTo(points[0].x, y);
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const point = points[i];
    const curve =
      (line.id === "feature" && i >= 3 && i <= 5) ||
      (line.id === "release" && i >= 5) ||
      (line.id === "hotfix" && i >= 4);
    if (curve) {
      const lift = line.id === "hotfix" ? -44 : line.id === "release" ? -58 : -28;
      path.bezierCurveTo(
        prev.x + (point.x - prev.x) * 0.45,
        prev.y,
        prev.x + (point.x - prev.x) * 0.55,
        point.y + lift,
        point.x,
        point.y + (line.id === "release" && i >= 6 ? lift : 0),
      );
    } else {
      path.lineTo(point.x, point.y);
    }
  }
  path.stroke({
    color: Number(line.color.replace("#", "0x")),
    width: theme === "retro" ? 8 : 6,
    alpha: 0.95,
  });
  path.stroke({
    color: Number(line.color.replace("#", "0x")),
    width: theme === "retro" ? 14 : 20,
    alpha: theme === "metro" ? 0.18 : 0.08,
  });
  scene.addChild(path);

  const labelBox = new PIXI.Graphics();
  labelBox
    .roundRect(frame.left - 90, y - 24, 74, 42, theme === "retro" ? 0 : 6)
    .fill({ color: 0x06101d, alpha: 0.84 })
    .stroke({ color: Number(line.color.replace("#", "0x")), width: 2 });
  scene.addChild(labelBox);
  const label = text(lineLabel(line.id), {
    fill: line.color,
    fontSize: 14,
    fontWeight: "700",
  });
  label.anchor.set(0.5);
  label.x = frame.left - 53;
  label.y = y - 2;
  scene.addChild(label);

  for (const point of points) {
    const station = new PIXI.Graphics();
    if (theme === "retro") {
      station
        .rect(point.x - 11, y - 11, 22, 22)
        .fill(0x06101d)
        .stroke({
          color: 0xfff0bf,
          width: 3,
        });
    } else {
      station.circle(point.x, y, 11).fill(0x05101a).stroke({
        color: 0xf3f7ff,
        width: 3,
      });
      station.circle(point.x, y, 20).stroke({
        color: Number(line.color.replace("#", "0x")),
        width: 1,
        alpha: 0.16,
      });
    }
    scene.addChild(station);
  }
}

function drawTrain(
  scene: PIXI.Container,
  train: TransitTrain,
  line: TransitLine,
  y: number,
  model: TransitMapModel,
  frame: { left: number; right: number; top: number; bottom: number },
  theme: ThemeName,
  time: number,
  selectTrain: (train?: TransitTrain) => void,
) {
  const w = frame.right - frame.left;
  const stage = model.stations.find((station) => station.id === train.stage);
  const base = stage ? stage.x : train.progress;
  const statusMotion =
    train.status === "moving" || train.status === "waiting"
      ? Math.sin(time * 2) * 0.012
      : 0;
  const x = frame.left + w * Math.min(0.98, Math.max(0.02, base + statusMotion));
  const body = new PIXI.Graphics();
  body.eventMode = "static";
  body.cursor = "pointer";
  body.on("pointertap", () => selectTrain(train));
  const color = statusColor(train.status, line.color);

  if (theme === "retro") {
    body
      .rect(x - 42, y - 18, 72, 28)
      .fill(color)
      .stroke({ color: 0x06101d, width: 3 });
    body.rect(x - 34, y - 11, 12, 8).fill(0x041019);
    body.rect(x - 15, y - 11, 12, 8).fill(0x041019);
    body.rect(x + 4, y - 11, 12, 8).fill(0x041019);
    body.rect(x - 30, y + 10, 9, 5).fill(0xf8f1d8);
    body.rect(x + 12, y + 10, 9, 5).fill(0xf8f1d8);
  } else {
    body
      .roundRect(x - 48, y - 16, 88, 28, 8)
      .fill(color)
      .stroke({
        color: 0xeef8ff,
        width: 1,
        alpha: 0.82,
      });
    body.roundRect(x - 36, y - 9, 16, 8, 2).fill(0x06101d);
    body.roundRect(x - 15, y - 9, 16, 8, 2).fill(0x06101d);
    body.roundRect(x + 6, y - 9, 16, 8, 2).fill(0x06101d);
  }
  scene.addChild(body);

  if (train.pullRequestNumber) {
    const badge = text(`#${train.pullRequestNumber}`, {
      fill: "#fff7d6",
      fontSize: 13,
      fontWeight: "700",
    });
    badge.x = x + 48;
    badge.y = y - 32;
    scene.addChild(badge);
  }
}

function drawMiniMap(
  scene: PIXI.Container,
  lines: TransitLine[],
  frame: { left: number; right: number; top: number; bottom: number },
  width: number,
  height: number,
  theme: ThemeName,
) {
  const miniW = 220;
  const miniH = 130;
  const x = Math.min(width - miniW - 34, frame.right - miniW - 22);
  const y = height - miniH - 30;
  const box = new PIXI.Graphics();
  box
    .rect(x, y, miniW, miniH)
    .fill({ color: 0x06101d, alpha: 0.88 })
    .stroke({
      color: theme === "retro" ? 0xffd957 : 0xe4edff,
      width: theme === "retro" ? 2 : 1,
      alpha: 0.85,
    });
  scene.addChild(box);
  lines.forEach((line, index) => {
    const yy = y + 24 + (index * (miniH - 46)) / Math.max(1, lines.length - 1);
    const route = new PIXI.Graphics();
    route
      .moveTo(x + 18, yy)
      .lineTo(x + miniW - 22, yy)
      .stroke({
        color: Number(line.color.replace("#", "0x")),
        width: 3,
        alpha: 0.96,
      });
    scene.addChild(route);
  });
  const zoomPlus = text("+", { fill: "#dbe9ff", fontSize: 30 });
  zoomPlus.x = x + miniW + 24;
  zoomPlus.y = y + 20;
  scene.addChild(zoomPlus);
  const zoomMinus = text("−", { fill: "#dbe9ff", fontSize: 34 });
  zoomMinus.x = x + miniW + 28;
  zoomMinus.y = y + 70;
  scene.addChild(zoomMinus);
}

function text(label: string, style: Partial<PIXI.TextStyleOptions>) {
  return new PIXI.Text({
    text: label,
    style: {
      fill: "#f0f6fc",
      fontSize: 14,
      fontFamily: "Segoe UI, sans-serif",
      ...style,
    },
  });
}

function lineLabel(line: TransitLine["id"]) {
  if (line === "feature") return "feature/";
  if (line === "release") return "release/";
  if (line === "hotfix") return "hotfix/";
  return line;
}

function stationColor(stage: TransitStage) {
  if (stage === "checks") return 0x6bdc49;
  if (stage === "review") return 0xffaa22;
  if (stage === "pull-request") return 0xc153ff;
  if (stage === "merge") return 0x36d6e8;
  if (stage === "release") return 0x91ea40;
  if (stage === "deploy") return 0xff5b5b;
  return 0x59c8ff;
}

function statusColor(status: TransitTrain["status"], fallback: string) {
  if (status === "failed" || status === "blocked") return 0xff4d4d;
  if (status === "approved" || status === "deployed") return 0x82e84a;
  if (status === "merged" || status === "released") return 0xffc13b;
  return Number(fallback.replace("#", "0x"));
}

function safelyDestroyApp(app: PIXI.Application) {
  try {
    app.destroy(true, { children: true, texture: true });
  } catch (error) {
    console.warn("[Git Transit] PixiJS cleanup skipped after init race", error);
  }
}
