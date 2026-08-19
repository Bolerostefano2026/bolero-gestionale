"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import type { Dimensions } from "@/lib/dimensions";

const POST_RADIUS = 0.06;
const BEAM_SIZE = 0.08;

function Structure({ width, depth, height }: Dimensions) {
  const hw = width / 2;
  const hd = depth / 2;
  const postColor = "#8C8680";
  const frameColor = "#A8682A";
  const fabricColor = "#C4895A";

  const corners: [number, number][] = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];

  return (
    <group position={[0, 0, 0]}>
      {corners.map(([x, z], i) => (
        <mesh key={i} position={[x, height / 2, z]} castShadow>
          <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, height, 16]} />
          <meshStandardMaterial color={postColor} roughness={0.4} metalness={0.6} />
        </mesh>
      ))}

      {/* Top frame beams */}
      <mesh position={[0, height, -hd]} castShadow>
        <boxGeometry args={[width + BEAM_SIZE, BEAM_SIZE, BEAM_SIZE]} />
        <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, height, hd]} castShadow>
        <boxGeometry args={[width + BEAM_SIZE, BEAM_SIZE, BEAM_SIZE]} />
        <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[-hw, height, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[depth + BEAM_SIZE, BEAM_SIZE, BEAM_SIZE]} />
        <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[hw, height, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[depth + BEAM_SIZE, BEAM_SIZE, BEAM_SIZE]} />
        <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Slatted roof / awning */}
      {Array.from({ length: Math.max(4, Math.round(depth * 3)) }).map((_, i, arr) => {
        const t = arr.length === 1 ? 0 : i / (arr.length - 1);
        const z = -hd + t * depth;
        return (
          <mesh key={i} position={[0, height + BEAM_SIZE / 2 + 0.01, z]} castShadow>
            <boxGeometry args={[width, 0.02, Math.min(0.18, depth / arr.length)]} />
            <meshStandardMaterial color={fabricColor} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

export function PergolaModel({ dimensions }: { dimensions: Dimensions }) {
  const maxSpan = Math.max(dimensions.width, dimensions.depth, 4);

  return (
    <div className="h-full w-full">
      <Canvas
        shadows
        camera={{ position: [maxSpan * 0.9, maxSpan * 0.7, maxSpan * 0.9], fov: 40 }}
      >
        <color attach="background" args={["#EDE7DC"]} />
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[6, 8, 4]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <Suspense fallback={null}>
          <Structure {...dimensions} />
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
          minDistance={maxSpan * 0.6}
          maxDistance={maxSpan * 4}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
