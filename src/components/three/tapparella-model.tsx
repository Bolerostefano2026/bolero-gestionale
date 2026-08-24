"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import type { Dimensions } from "@/lib/dimensions";

const SLAT_H = 0.04;
const SLAT_GAP = 0.005;
const BOX_H = 0.28;

function Structure({ width, height }: Pick<Dimensions, "width" | "height">) {
  const hw = width / 2;
  const shutterColor = "#9AA0A8";
  const boxColor = "#6B7380";
  const guideColor = "#555C66";
  const slatCount = Math.max(4, Math.round((height * 0.6) / (SLAT_H + SLAT_GAP)));
  const visibleH = slatCount * (SLAT_H + SLAT_GAP);

  return (
    <group position={[0, 0, 0]}>
      {/* Housing box (avvolgitore) */}
      <mesh position={[0, height + BOX_H / 2, 0]}>
        <boxGeometry args={[width + 0.1, BOX_H, 0.22]} />
        <meshStandardMaterial color={boxColor} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Side guides */}
      {[-hw - 0.025, hw + 0.025].map((x, i) => (
        <mesh key={i} position={[x, height / 2 + 0.1, -0.04]}>
          <boxGeometry args={[0.04, height + 0.2, 0.08]} />
          <meshStandardMaterial color={guideColor} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}

      {/* Rolled-up portion visible at top */}
      <mesh position={[0, height + 0.04, -0.01]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, width, 20]} />
        <meshStandardMaterial color={shutterColor} roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Slats — partially deployed */}
      {Array.from({ length: slatCount }).map((_, i) => {
        const y = height - i * (SLAT_H + SLAT_GAP) - SLAT_H / 2;
        return (
          <mesh key={i} position={[0, y, -0.01]}>
            <boxGeometry args={[width, SLAT_H, 0.012]} />
            <meshStandardMaterial color={i % 2 === 0 ? shutterColor : "#A8AEB6"} roughness={0.5} metalness={0.4} />
          </mesh>
        );
      })}

      {/* Bottom rail */}
      <mesh position={[0, height - visibleH - SLAT_H / 2, -0.01]}>
        <boxGeometry args={[width + 0.02, 0.055, 0.022]} />
        <meshStandardMaterial color={guideColor} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Wall suggestion */}
      <mesh position={[0, height / 2, -0.14]} receiveShadow>
        <boxGeometry args={[width + 0.5, height + BOX_H + 0.4, 0.01]} />
        <meshStandardMaterial color="#D8D4CE" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

export function TapparellaModel({ dimensions }: { dimensions: Dimensions }) {
  const span = Math.max(dimensions.width, dimensions.height, 1.5);
  return (
    <div className="h-full w-full">
      <Canvas shadows camera={{ position: [span * 1.4, span * 0.9, span * 2.2], fov: 35 }}>
        <color attach="background" args={["#E6E8EA"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 7, 4]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        <Suspense fallback={null}>
          <Structure width={dimensions.width} height={dimensions.height} />
          <Environment preset="warehouse" />
        </Suspense>
        <Grid infiniteGrid fadeDistance={span * 5} cellSize={0.5} sectionSize={1} cellColor="#D0D4D8" sectionColor="#6B7380" />
        <OrbitControls minDistance={span * 0.8} maxDistance={span * 5} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
