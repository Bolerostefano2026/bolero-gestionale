"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import type { Dimensions } from "@/lib/dimensions";

const FRAME = 0.07;
const GLASS_DEPTH = 0.025;
const MULLION = 0.045;

function Structure({ width, height }: Pick<Dimensions, "width" | "height">) {
  const hw = width / 2;
  const hh = height / 2;
  const frameColor = "#5A6470";
  const glassColor = "#A8D4E8";

  // number of panes based on width
  const panes = width > 1.0 ? 2 : 1;

  return (
    <group position={[0, hh, 0]}>
      {/* Outer frame — top, bottom, left, right */}
      <mesh position={[0, hh, 0]}>
        <boxGeometry args={[width + FRAME * 2, FRAME, FRAME]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, -hh, 0]}>
        <boxGeometry args={[width + FRAME * 2, FRAME, FRAME]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[-hw - FRAME / 2, 0, 0]}>
        <boxGeometry args={[FRAME, height + FRAME * 2, FRAME]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[hw + FRAME / 2, 0, 0]}>
        <boxGeometry args={[FRAME, height + FRAME * 2, FRAME]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Central mullion for 2-pane window */}
      {panes === 2 && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[MULLION, height, MULLION]} />
          <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.7} />
        </mesh>
      )}

      {/* Horizontal transom rail at mid-height */}
      <mesh position={[0, hh * 0.15, 0]}>
        <boxGeometry args={[width, MULLION, MULLION]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Glass panes */}
      {Array.from({ length: panes }).map((_, i) => {
        const paneW = panes === 2 ? (width - MULLION) / 2 - 0.01 : width - 0.01;
        const offsetX = panes === 2 ? (i === 0 ? -(width / 4 + MULLION / 4) : width / 4 + MULLION / 4) : 0;
        return (
          <mesh key={i} position={[offsetX, 0, 0]}>
            <boxGeometry args={[paneW, height - 0.01, GLASS_DEPTH]} />
            <meshStandardMaterial
              color={glassColor}
              transparent
              opacity={0.35}
              roughness={0.05}
              metalness={0.1}
            />
          </mesh>
        );
      })}

      {/* Handle */}
      <mesh position={[panes === 2 ? MULLION / 2 + 0.04 : 0.05, -hh * 0.05, GLASS_DEPTH + 0.02]}>
        <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
        <meshStandardMaterial color="#888" roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  );
}

export function FinestraModel({ dimensions }: { dimensions: Dimensions }) {
  const span = Math.max(dimensions.width, dimensions.height, 1.5);
  return (
    <div className="h-full w-full">
      <Canvas shadows camera={{ position: [span * 1.5, span * 0.8, span * 2], fov: 35 }}>
        <color attach="background" args={["#E8ECF0"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 3]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
        <Suspense fallback={null}>
          <Structure width={dimensions.width} height={dimensions.height} />
          <Environment preset="apartment" />
        </Suspense>
        <Grid infiniteGrid fadeDistance={span * 5} cellSize={0.5} sectionSize={1} cellColor="#D0D4D8" sectionColor="#5A6470" />
        <OrbitControls minDistance={span * 0.8} maxDistance={span * 5} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
