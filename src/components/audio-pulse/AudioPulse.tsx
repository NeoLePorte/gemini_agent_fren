/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./audio-pulse.scss";
import React from "react";
import { useEffect, useRef } from "react";
import c from "classnames";

const lineCount = 5;

export type AudioPulseProps = {
  active: boolean;
  volume: number;
  hover?: boolean;
};

export default function AudioPulse({ active, volume, hover }: AudioPulseProps) {
  const lines = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    let timeout: number | null = null;
    const update = () => {
      lines.current.forEach(
        (line, i) => {
          const centerOffset = Math.abs(i - Math.floor(lineCount / 2));
          const heightMultiplier = 1 - (centerOffset * 0.2);
          const height = Math.min(
            24,
            4 + volume * (i === Math.floor(lineCount / 2) ? 400 : 60) * heightMultiplier
          );
          line.style.height = `${height}px`;
          line.style.transitionDelay = `${i * 50}ms`;
        }
      );
      timeout = window.setTimeout(update, 50);
    };

    update();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [volume]);

  return (
    <div className={c("audioPulse", { active, hover })}>
      {Array(lineCount)
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            ref={(el) => (lines.current[i] = el!)}
            style={{ 
              animationDelay: `${i * 100}ms`,
              backgroundColor: active ? undefined : 'var(--color-primary)',
              opacity: active ? 1 : 0.5
            }}
          />
        ))}
    </div>
  );
}
