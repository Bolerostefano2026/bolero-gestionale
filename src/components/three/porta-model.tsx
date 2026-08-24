"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import type { Dimensions } from "@/lib/dimensions";

const FRAME_W = 0.08;
const DOOR_DEPTH = 0.05;
const PANEL_DEPTH = 0.03;

function Structure({ width, height }: Pick<Dimensions, "width" | "height">) {
  const hw = width / 2;
  const hh = height / 2;
  const frameColor = "#4A3728";
  const doorColor = "#7C5A3A";
  const panelColor = "#6B4E31";
  const metalColor = "#B8A090";

  return (
    <group position={[0, hh, 0]}>
      {/* Frame — top */}
      <mesh position={[0, hh + FRAME_W / 2, 0]}>
        <boxGeometry args={[width + FRAME_W * 2, FRAME_W, FRAME_W + DOOR_DEPTH]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Frame — left */}
      <mesh position={[-hw - FRAME_W / 2, 0, 0]}>
        <boxGeometry args={[FRAME_W, height + FRAME_W, FRAME_W + DOOR_DEPTH]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Frame — right */}
      <mesh position={[hw + FRAME_W / 2, 0, 0]}>
        <boxGeometry args={[FRAME_W, height + FRAME_W, FRAME_W + DOOR_DEPTH]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Door panel */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width - 0.01, height - 0.01, DOOR_DEPTH]} />
        <meshStandardMaterial color={doorColor} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Decorative raised panels */}
      <mesh position={[0, hh * 0.45, DOOR_DEPTH / 2 + PANEL_DEPTH / 2]}>
        <boxGeometry args={[width * 0.7, height * 0.35, PANEL_DEPTH]} />
        <meshStandardMaterial color={panelColor} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0, -hh * 0.35, DOOR_DEPTH / 2 + PANEL_DEPTH / 2]}>
        <boxGeometry args={[width * 0.7, height * 0.45, PANEL_DEPTH]} />
        <meshStandardMaterial color={panelColor} roughness={0.5} metalness={0.05} />
      </mesh>

      {/* Handle plate */}
      <mesh position={[hw * 0.55, 0, DOOR_DEPTH / 2 + 0.01]}>
        <boxGeometry args={[0.035, 0.18, 0.012]} />
        <meshStandardMaterial color={metalColor} roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Handle bar */}
      <mesh position={[hw * 0.55, 0.04, DOOR_DEPTH / 2 + 0.042]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 12]} />
        <meshStandardMaterial color={metalColor} roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Hinge */}
      {[-hh * 0.6, hh * 0.5].map((y, i) => (
        <mesh key={i} position={[-hw * 0.9, y, DOOR_DEPTH / 2 + 0.01]}>
          <boxGeometry args={[0.025, 0.07, 0.02]} />
          <meshStandardMaterial color="#888" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function PortaModel({ dimensions }: { dimensions: Dimensions }) {
  const span = Math.max(dimensions.width, dimensions.height, 1.5);
  return (
    <div className="h-full w-full">
      <Canvas shadows camera={{ position: [span * 1.2, span * 0.7, span * 2.2], fov: 35 }}>
        <color attach="background" args={["#EDE8E2"]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[4, 7, 3]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
        <Suspense fallback={null}>
          <Structure width={dimensions.width} height={dimensions.height} />
          <Environment preset="apartment" />
        </Suspense>
        <Grid infiniteGrid fadeDistance={span * 5} cellSize={0.5} sectionSize={1} cellColor="#D8D2C8" sectionColor="#7C5A3A" />
        <OrbitControls minDistance={span * 0.8} maxDistance={span * 5} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
