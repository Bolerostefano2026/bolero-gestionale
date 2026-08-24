"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import type { Dimensions } from "@/lib/dimensions";

function Structure({ width, depth }: Pick<Dimensions, "width" | "depth">) {
  const hw = width / 2;
  const wallH = 2.6;
  const mountH = wallH - 0.2;
  const armColor = "#888";
  const fabricColor = "#C8A468";
  const valanceColor = "#B89050";

  const armCount = Math.max(2, Math.round(width / 1.2));

  return (
    <group>
      {/* Wall */}
      <mesh position={[0, wallH / 2, -depth * 0.05]} receiveShadow>
        <boxGeometry args={[width + 0.6, wallH, 0.02]} />
        <meshStandardMaterial color="#D8D4CE" roughness={0.9} metalness={0} />
      </mesh>

      {/* Cassette box on wall */}
      <mesh position={[0, mountH, -depth * 0.04]}>
        <boxGeometry args={[width + 0.04, 0.14, 0.14]} />
        <meshStandardMaterial color={armColor} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Arms (scissors / articulated) */}
      {Array.from({ length: armCount }).map((_, i) => {
        const x = -hw + (i / (armCount - 1)) * width;
        return (
          <group key={i} position={[x, mountH - 0.07, 0]}>
            {/* Upper arm */}
            <mesh position={[0, -depth * 0.15, depth * 0.25]} rotation={[Math.PI / 5, 0, 0]}>
              <boxGeometry args={[0.025, 0.025, depth * 0.55]} />
              <meshStandardMaterial color={armColor} roughness={0.3} metalness={0.7} />
            </mesh>
            {/* Lower arm */}
            <mesh position={[0, -depth * 0.28, depth * 0.62]} rotation={[-Math.PI / 9, 0, 0]}>
              <boxGeometry args={[0.025, 0.025, depth * 0.48]} />
              <meshStandardMaterial color={armColor} roughness={0.3} metalness={0.7} />
            </mesh>
          </group>
        );
      })}

      {/* Front rail */}
      <mesh position={[0, mountH - 0.45, depth * 0.93]}>
        <boxGeometry args={[width + 0.04, 0.04, 0.04]} />
        <meshStandardMaterial color={armColor} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Fabric canopy */}
      <mesh position={[0, mountH - 0.05, depth * 0.48]} rotation={[Math.PI / 14, 0, 0]}>
        <boxGeometry args={[width, 0.008, depth]} />
        <meshStandardMaterial color={fabricColor} roughness={0.85} metalness={0} side={2} />
      </mesh>

      {/* Valance */}
      <mesh position={[0, mountH - 0.47, depth * 0.95]}>
        <boxGeometry args={[width, 0.22, 0.005]} />
        <meshStandardMaterial color={valanceColor} roughness={0.85} metalness={0} side={2} />
      </mesh>
    </group>
  );
}

export function TendaModel({ dimensions }: { dimensions: Dimensions }) {
  const span = Math.max(dimensions.width, dimensions.depth, 2);
  return (
    <div className="h-full w-full">
      <Canvas shadows camera={{ position: [span * 1.1, span * 0.6, span * 1.8], fov: 40 }}>
        <color attach="background" args={["#EAE6DF"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 3]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
        <Suspense fallback={null}>
          <Structure width={dimensions.width} depth={dimensions.depth} />
          <Environment preset="park" />
        </Suspense>
        <Grid infiniteGrid fadeDistance={span * 5} cellSize={0.5} sectionSize={2} cellColor="#D8D2C8" sectionColor="#C8A468" />
        <OrbitControls minDistance={span * 0.6} maxDistance={span * 4} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
