"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

interface ModelViewerProps {
  modelUrl?: string;
  className?: string;
}

function PlaceholderMesh() {
  // TODO: Replace with useGLTF(modelUrl) during hackathon
  return (
    <mesh rotation={[0.4, 0.6, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#C4A035" />
    </mesh>
  );
}

export function ModelViewer({ modelUrl, className }: ModelViewerProps) {
  return (
    <div className={className ?? "h-64 w-full rounded-lg overflow-hidden bg-heritage-stone/10"}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <PlaceholderMesh />
        <OrbitControls enablePan={false} />
      </Canvas>
      {modelUrl && (
        <p className="sr-only">Model: {modelUrl}</p>
      )}
    </div>
  );
}
