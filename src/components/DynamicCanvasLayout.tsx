"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

const GAP = 40; // px between each section (in SVG coordinate space)
const MEASURE_RETRY_MS = 150; // retry interval if children not yet rendered

interface Props {
  children: React.ReactNode;
  gap?: number;
}

/**
 * DynamicCanvasLayout
 *
 * SVG グループ内に子コンポーネントを横並びで配置し、
 * 初回描画後に各要素の getBBox() で実際の幅を取得して
 * GAP を挟んだ正確な位置に再配置する。
 */
export default function DynamicCanvasLayout({ children, gap = GAP }: Props) {
  const childArray = React.Children.toArray(children).filter(Boolean);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const [positions, setPositions] = useState<number[]>(childArray.map(() => 0));
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = useCallback(() => {
    const widths: number[] = [];
    let allReady = true;

    for (let i = 0; i < groupRefs.current.length; i++) {
      const g = groupRefs.current[i];
      if (!g) { allReady = false; break; }
      const bbox = g.getBBox();
      if (bbox.width === 0) { allReady = false; break; }
      widths.push(bbox.width);
    }

    if (!allReady) {
      // Some children haven't rendered yet → retry
      retryRef.current = setTimeout(measure, MEASURE_RETRY_MS);
      return;
    }

    // All widths known → compute positions
    const newPositions: number[] = [];
    let currentX = 0;
    for (const w of widths) {
      newPositions.push(currentX);
      currentX += w + gap;
    }
    setPositions(newPositions);
  }, [gap]);

  useEffect(() => {
    retryRef.current = setTimeout(measure, 100);
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [measure, childArray.length]);

  return (
    <>
      {childArray.map((child, i) => (
        <g
          key={i}
          ref={(el) => { groupRefs.current[i] = el; }}
          transform={`translate(${positions[i]}, 0)`}
        >
          {child}
        </g>
      ))}
    </>
  );
}
