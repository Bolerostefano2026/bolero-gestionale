"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import type { Dimensions } from "@/lib/dimensions";

const FRAME_R = 0.04;
const BAR_H = 0.06;

function Structure({ width, depth, height, color }: Dimensions & { color?: string | null }) {
  const hw = width / 2;
  const sag = depth * 0.18; // how much the front bar drops vs wall mount
  const armX = hw - 0.25;

  // arm direction vector (from wall mount to front tip)
  const armLen = Math.sqrt(depth * depth + sag * sag);
  const armAngle = Math.atan2(sag, depth); // rotation around X axis (tilting down as it extends)

  return (
    <group>
      {/* Wall backing */}
      <mesh position={[0, height / 2, 0.12]} receiveShadow>
        <boxGeometry args={[width + 0.4, height + 0.3, 0.1]} />
        <meshStandardMaterial color="#C4B8A8" roughness={0.9} />
      </mesh>

      {/* Cassonetto (wall box) */}
      <mesh position={[0, height, 0]} castShadow>
        <boxGeometry args={[width + 0.1, 0.18, 0.22]} />
        <meshStandardMaterial color={color ?? "#8C8680"} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Left arm */}
      <group position={[-armX, height, 0]} rotation={[armAngle, 0, 0]}>
        <mesh position={[0, 0, -armLen / 2]} castShadow>
          <cylinderGeometry args={[FRAME_R, FRAME_R, armLen, 12]} />
          <meshStandardMaterial color={color ?? "#7A7470"} roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Right arm */}
      <group position={[armX, height, 0]} rotation={[armAngle, 0, 0]}>
        <mesh position={[0, 0, -armLen / 2]} castShadow>
          <cylinderGeometry args={[FRAME_R, FRAME_R, armLen, 12]} />
          <meshStandardMaterial color={color ?? "#7A7470"} roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Front bar */}
      <mesh position={[0, height - sag, -depth]} castShadow>
        <boxGeometry args={[width + 0.06, BAR_H, BAR_H]} />
        <meshStandardMaterial color={color ?? "#7A7470"} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Fabric panel (tilted plane from cassonetto to front bar) */}
      <group
        position={[0, height - sag / 2, -depth / 2]}
        rotation={[armAngle, 0, 0]}
      >
        <mesh castShadow receiveShadow>
          <planeGeometry args={[width, armLen, 1, 1]} />
          <meshStandardMaterial
            color={color ?? "#D4956A"}
            roughness={0.85}
            side={2}
            transparent
            opacity={0.92}
          />
        </mesh>
        {/* Fabric stripes */}
        {Array.from({ length: Math.max(3, Math.round(width / 0.4)) }).map((_, i, arr) => {
          const x = -width / 2 + (i / (arr.length - 1)) * width;
          return (
            <mesh key={i} position={[x, 0, 0.001]}>
              <planeGeometry args={[0.03, armLen]} />
              <meshStandardMaterial color={color ?? "#BC7A50"} roughness={0.9} side={2} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function TendaModel({ dimensions, color }: { dimensions: Dimensions; color?: string | null }) {
  const maxSpan = Math.max(dimensions.width, dimensions.depth, 3);

  return (
    <div className="h-full w-full">
      <Canvas
        shadows
        camera={{
          position: [maxSpan * 0.8, maxSpan * 0.6, maxSpan * 1.1],
          fov: 40,
        }}
      >
        <color attach="background" args={["#EDE7DC"]} />
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[4, 8, 4]}
          intensity={1.3}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <Suspense fallback={null}>
          <Structure {...dimensions} color={color} />
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
