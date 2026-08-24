"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import type { Dimensions } from "@/lib/dimensions";

const POST_R = 0.025;
const RAIL_H = 0.025;
const GLASS_T = 0.012;

function Structure({ width, height }: Pick<Dimensions, "width" | "height">) {
  const hw = width / 2;
  const postColor = "#7A8490";
  const glassColor = "#B8D8E8";
  const railColor = "#606870";

  const postCount = Math.max(2, Math.round(width / 0.8) + 1);
  const panelCount = postCount - 1;

  return (
    <group>
      {/* Floor/base plate */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[width + 0.1, 0.04, 0.12]} />
        <meshStandardMaterial color="#A0A4A8" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Vertical posts */}
      {Array.from({ length: postCount }).map((_, i) => {
        const x = -hw + (i / (postCount - 1)) * width;
        return (
          <mesh key={i} position={[x, height / 2, 0]} castShadow>
            <cylinderGeometry args={[POST_R, POST_R, height, 12]} />
            <meshStandardMaterial color={postColor} roughness={0.3} metalness={0.7} />
          </mesh>
        );
      })}

      {/* Glass panels between posts */}
      {Array.from({ length: panelCount }).map((_, i) => {
        const segW = width / panelCount;
        const x = -hw + segW * i + segW / 2;
        const panelH = height - 0.08;
        return (
          <mesh key={i} position={[x, panelH / 2 + 0.02, 0]}>
            <boxGeometry args={[segW - POST_R * 2 - 0.01, panelH, GLASS_T]} />
            <meshStandardMaterial
              color={glassColor}
              transparent
              opacity={0.4}
              roughness={0.05}
              metalness={0.1}
            />
          </mesh>
        );
      })}

      {/* Top handrail */}
      <mesh position={[0, height + RAIL_H / 2, 0]}>
        <boxGeometry args={[width + POST_R * 2, RAIL_H, 0.06]} />
        <meshStandardMaterial color={railColor} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Bottom rail */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[width, RAIL_H, 0.04]} />
        <meshStandardMaterial color={railColor} roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}

export function ParapettoModel({ dimensions }: { dimensions: Dimensions }) {
  const span = Math.max(dimensions.width, dimensions.height * 2, 2);
  return (
    <div className="h-full w-full">
      <Canvas shadows camera={{ position: [span * 0.9, span * 0.5, span * 1.8], fov: 38 }}>
        <color attach="background" args={["#E6EAF0"]} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 6, 3]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        <Suspense fallback={null}>
          <Structure width={dimensions.width} height={dimensions.height} />
          <Environment preset="city" />
        </Suspense>
        <Grid infiniteGrid fadeDistance={span * 5} cellSize={0.5} sectionSize={1} cellColor="#D0D4D8" sectionColor="#7A8490" />
        <OrbitControls minDistance={span * 0.5} maxDistance={span * 4} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
