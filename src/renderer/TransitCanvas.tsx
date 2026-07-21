import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { useAppStore } from "../state/app-store";
import type { ThemeName, TransitMapModel, TransitTrain } from "../transit/model";

type Props = {
  model: TransitMapModel;
  theme: ThemeName;
  paused: boolean;
  speed: number;
};

export function TransitCanvas({ model, theme, paused, speed }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectTrain = useAppStore((state) => state.selectTrain);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new PIXI.Application();
    let destroyed = false;

    void app
      .init({
        resizeTo: host,
        antialias: theme === "metro",
        backgroundAlpha: 0,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      })
      .then(() => {
        if (destroyed) {
          app.destroy(true);
          return;
        }
        host.appendChild(app.canvas);
        const scene = new PIXI.Container();
        app.stage.addChild(scene);
        const tick = () =>
          drawScene(app, scene, model, theme, paused, speed, selectTrain);
        app.ticker.add(tick);
        drawScene(app, scene, model, theme, paused, speed, selectTrain);
      });

    return () => {
      destroyed = true;
      app.destroy(true, { children: true, texture: true });
    };
  }, [model, paused, selectTrain, speed, theme]);

  return <div className="transit-canvas" ref={hostRef} />;
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
  const time = paused ? 0 : performance.now() * 0.00012 * speed;
  scene.removeChildren();

  drawBackground(scene, width, height, theme, time);
  const padX = width * 0.08;
  const padY = height * 0.07;
  const mapWidth = width - padX * 2;
  const mapHeight = height - padY * 2;

  for (const line of model.lines) {
    const y = padY + mapHeight * line.y;
    const track = new PIXI.Graphics();
    if (theme === "metro") {
      track
        .moveTo(padX, y)
        .bezierCurveTo(width * 0.36, y - 24, width * 0.64, y + 24, width - padX, y);
      track.stroke({ color: line.color, width: 7, alpha: 0.84 });
      track.stroke({ color: line.color, width: 17, alpha: 0.08 });
    } else {
      track.moveTo(padX, Math.round(y)).lineTo(width - padX, Math.round(y));
      track.stroke({ color: line.color, width: 6, alpha: 0.95 });
      for (let x = padX; x < width - padX; x += 24) {
        track.rect(x, y - 9, 12, 3).fill({ color: 0x131820, alpha: 0.85 });
      }
    }
    scene.addChild(track);
  }

  for (const station of model.stations) {
    const x = padX + mapWidth * station.x;
    const stationGraphic = new PIXI.Graphics();
    if (theme === "metro") {
      stationGraphic
        .circle(x, height * 0.5, 10)
        .fill(0x0f1720)
        .stroke({ color: 0xf0f6fc, width: 3 });
      stationGraphic
        .circle(x, height * 0.5, 22)
        .stroke({ color: 0x8be9fd, width: 1, alpha: 0.18 });
    } else {
      stationGraphic
        .rect(Math.round(x - 9), Math.round(height * 0.5 - 9), 18, 18)
        .fill(0xf8f1d8);
      stationGraphic
        .rect(Math.round(x - 5), Math.round(height * 0.5 - 5), 10, 10)
        .fill(0x1a1f29);
    }
    scene.addChild(stationGraphic);
    const label = new PIXI.Text({
      text: station.label,
      style: {
        fill: theme === "metro" ? "#d6e3f0" : "#f8f1d8",
        fontSize: theme === "metro" ? 13 : 12,
        fontFamily: theme === "metro" ? "Inter, Segoe UI, sans-serif" : "monospace",
      },
    });
    label.anchor.set(0.5, 0);
    label.x = x;
    label.y = height * 0.5 + 26;
    scene.addChild(label);
  }

  for (const train of model.trains) {
    const line = model.lines.find((item) => item.id === train.line) ?? model.lines[0];
    const x = padX + mapWidth * ((train.progress + time) % 1);
    const y = padY + mapHeight * line.y;
    const body = new PIXI.Graphics();
    body.eventMode = "static";
    body.cursor = "pointer";
    body.on("pointertap", () => selectTrain(train));
    const color = statusColor(train.status);
    if (theme === "metro") {
      body
        .roundRect(x - 22, y - 10, 44, 20, 8)
        .fill(color)
        .stroke({ color: 0xffffff, width: 1, alpha: 0.7 });
      body.circle(x + 26, y, 4).fill(color);
    } else {
      body.rect(Math.round(x - 20), Math.round(y - 10), 40, 20).fill(color);
      body.rect(Math.round(x - 13), Math.round(y - 5), 8, 5).fill(0x071018);
      body.rect(Math.round(x + 3), Math.round(y - 5), 8, 5).fill(0x071018);
    }
    scene.addChild(body);
  }
}

function drawBackground(
  scene: PIXI.Container,
  width: number,
  height: number,
  theme: ThemeName,
  time: number,
) {
  const bg = new PIXI.Graphics();
  bg.rect(0, 0, width, height).fill(theme === "metro" ? 0x071018 : 0x12131b);
  const gridColor = theme === "metro" ? 0x1f6f86 : 0x29313d;
  for (let x = 0; x < width; x += theme === "metro" ? 48 : 32) {
    bg.moveTo(x, 0)
      .lineTo(x, height)
      .stroke({ color: gridColor, width: 1, alpha: theme === "metro" ? 0.12 : 0.2 });
  }
  for (let y = 0; y < height; y += theme === "metro" ? 48 : 32) {
    bg.moveTo(0, y)
      .lineTo(width, y)
      .stroke({ color: gridColor, width: 1, alpha: theme === "metro" ? 0.12 : 0.2 });
  }
  if (theme === "retro") {
    for (let i = 0; i < 26; i += 1) {
      const x = (i * 89 + time * 600) % width;
      const y = 32 + ((i * 47) % Math.max(40, height - 80));
      bg.rect(Math.round(x), Math.round(y), 5, 5).fill(
        i % 3 === 0 ? 0x80c884 : 0xffd37a,
      );
    }
  }
  scene.addChild(bg);
}

function statusColor(status: TransitTrain["status"]) {
  if (status === "failed" || status === "blocked") return 0xff6b6b;
  if (status === "approved" || status === "deployed") return 0x7ee787;
  if (status === "merged" || status === "released") return 0xffd166;
  return 0x74c0fc;
}
