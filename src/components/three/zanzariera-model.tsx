"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import type { Dimensions } from "@/lib/dimensions";

const FRAME_T = 0.05; // frame bar thickness

function Structure({ width, height, color }: { width: number; height: number; color?: string | null }) {
  const hw = width / 2;
  const hh = height / 2;
  const frameColor = color ?? "#8C8680";
  const meshColor = color ?? "#B8D4E8";

  return (
    <group position={[0, height / 2, 0]}>
      {/* Wall backing */}
      <mesh position={[0, 0, 0.06]} receiveShadow>
        <boxGeometry args={[width + 0.5, height + 0.4, 0.08]} />
        <meshStandardMaterial color="#C4B8A8" roughness={0.9} />
      </mesh>

      {/* Frame bars */}
      {/* Top */}
      <mesh position={[0, hh, 0]} castShadow>
        <boxGeometry args={[width + FRAME_T, FRAME_T, FRAME_T]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -hh, 0]} castShadow>
        <boxGeometry args={[width + FRAME_T, FRAME_T, FRAME_T]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Left */}
      <mesh position={[-hw, 0, 0]} castShadow>
        <boxGeometry args={[FRAME_T, height + FRAME_T, FRAME_T]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Right */}
      <mesh position={[hw, 0, 0]} castShadow>
        <boxGeometry args={[FRAME_T, height + FRAME_T, FRAME_T]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Mesh infill — semi-transparent plane */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[width - FRAME_T, height - FRAME_T]} />
        <meshStandardMaterial
          color={meshColor}
          roughness={0.5}
          transparent
          opacity={0.22}
          side={2}
        />
      </mesh>

      {/* Vertical mesh lines */}
      {Array.from({ length: Math.max(4, Math.round(width * 4)) }).map((_, i, arr) => {
        const x = -hw + FRAME_T / 2 + ((i + 0.5) / arr.length) * (width - FRAME_T);
        return (
          <mesh key={`v${i}`} position={[x, 0, 0.002]}>
            <planeGeometry args={[0.008, height - FRAME_T]} />
            <meshStandardMaterial color="#7090A8" roughness={0.6} transparent opacity={0.5} side={2} />
          </mesh>
        );
      })}
      {/* Horizontal mesh lines */}
      {Array.from({ length: Math.max(4, Math.round(height * 4)) }).map((_, i, arr) => {
        const y = -hh + FRAME_T / 2 + ((i + 0.5) / arr.length) * (height - FRAME_T);
        return (
          <mesh key={`h${i}`} position={[0, y, 0.002]}>
            <planeGeometry args={[width - FRAME_T, 0.008]} />
            <meshStandardMaterial color="#7090A8" roughness={0.6} transparent opacity={0.5} side={2} />
          </mesh>
        );
      })}
    </group>
  );
}

export function ZanzarieraModel({ dimensions, color }: { dimensions: Dimensions; color?: string | null }) {
  const maxSpan = Math.max(dimensions.width, dimensions.height, 2);

  return (
    <div className="h-full w-full">
      <Canvas
        shadows
        camera={{ position: [maxSpan * 0.8, maxSpan * 0.5, maxSpan * 1.4], fov: 38 }}
      >
        <color attach="background" args={["#EDE7DC"]} />
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[4, 6, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <Suspense fallback={null}>
          <Structure width={dimensions.width} height={dimensions.height} color={color} />
          <Environment preset="city" />
        </Suspense>
        <Grid
          infiniteGrid
          fadeDistance={maxSpan * 6}
          cellSize={0.5}
          sectionSize={2}
          cellColor="#D8D2C8"
          sectionColor="#C4895A"
        />
        <OrbitControls
          minDistance={maxSpan * 0.5}
          maxDistance={maxSpan * 4}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
