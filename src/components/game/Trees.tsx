import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, isWater, noise2D } from '@/lib/noise';

const CHUNK_SIZE = 32;
const TREES_PER_CHUNK = 12;
const ROCKS_PER_CHUNK = 8;

function PalmTree({ position }: { position: [number, number, number] }) {
  const scale = 0.8 + Math.abs(noise2D(position[0] * 7.3, position[2] * 7.3)) * 0.6;
  const lean = noise2D(position[0] * 3.1, position[2] * 3.1) * 0.3;
  
  return (
    <group position={position} scale={scale}>
      {/* Trunk - slightly curved */}
      <mesh position={[lean * 0.5, 1.2, 0]} rotation={[0, 0, lean]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 2.4, 6]} />
        <meshToonMaterial color="#8B6914" />
      </mesh>
      {/* Trunk segments for texture */}
      {[0.4, 0.8, 1.2, 1.6].map((y, i) => (
        <mesh key={i} position={[lean * (y / 2.4), y, 0]} rotation={[0, 0, lean * (y / 2.4)]}>
          <torusGeometry args={[0.13 - y * 0.015, 0.02, 4, 6]} />
          <meshToonMaterial color="#6B4F0A" />
        </mesh>
      ))}
      {/* Palm fronds */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2 + lean;
        const droop = -0.4;
        return (
          <group key={i} position={[lean * 1, 2.3, 0]} rotation={[droop, angle, 0]}>
            <mesh position={[0, 0.1, 0.8]} rotation={[0.3, 0, 0]} castShadow>
              <boxGeometry args={[0.15, 0.04, 1.6]} />
              <meshToonMaterial color={i % 2 === 0 ? "#2D8B2D" : "#3AA03A"} />
            </mesh>
            <mesh position={[0, 0.05, 1.5]} rotation={[0.5, 0, 0]}>
              <boxGeometry args={[0.1, 0.03, 0.6]} />
              <meshToonMaterial color="#248F24" />
            </mesh>
          </group>
        );
      })}
      {/* Coconuts */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={`c${i}`} position={[Math.cos(a) * 0.12 + lean, 2.15, Math.sin(a) * 0.12]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshToonMaterial color="#5C4A1E" />
          </mesh>
        );
      })}
    </group>
  );
}

function Rock({ position, seed }: { position: [number, number, number]; seed: number }) {
  const scale = 0.3 + Math.abs(noise2D(seed * 13.7, seed * 7.3)) * 0.5;
  const rotation = noise2D(seed * 5.1, seed * 9.2) * Math.PI;
  const shade = 0.45 + Math.abs(noise2D(seed * 2.3, seed * 4.1)) * 0.2;
  const color = new THREE.Color(shade, shade, shade + 0.03);

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Smaller rock next to it */}
      <mesh position={[0.4, -0.1, 0.2]} castShadow>
        <dodecahedronGeometry args={[0.25, 0]} />
        <meshToonMaterial color={color} />
      </mesh>
    </group>
  );
}

interface TreesChunkProps {
  chunkX: number;
  chunkZ: number;
}

function TreesChunk({ chunkX, chunkZ }: TreesChunkProps) {
  const objects = useMemo(() => {
    const trees: [number, number, number][] = [];
    const rocks: { pos: [number, number, number]; seed: number }[] = [];

    for (let i = 0; i < TREES_PER_CHUNK; i++) {
      const nx = noise2D(chunkX * 100 + i * 17.3, chunkZ * 100 + i * 23.7);
      const nz = noise2D(chunkX * 100 + i * 31.1 + 500, chunkZ * 100 + i * 13.9 + 500);
      const wx = chunkX * CHUNK_SIZE + nx * CHUNK_SIZE * 0.45;
      const wz = chunkZ * CHUNK_SIZE + nz * CHUNK_SIZE * 0.45;
      if (isWater(wx, wz)) continue;
      const h = getTerrainHeight(wx, wz);
      if (h < 0.3 || h > 3.5) continue;
      trees.push([wx, h, wz]);
    }

    for (let i = 0; i < ROCKS_PER_CHUNK; i++) {
      const nx = noise2D(chunkX * 200 + i * 41.3 + 1000, chunkZ * 200 + i * 37.7 + 1000);
      const nz = noise2D(chunkX * 200 + i * 29.1 + 1500, chunkZ * 200 + i * 43.9 + 1500);
      const wx = chunkX * CHUNK_SIZE + nx * CHUNK_SIZE * 0.45;
      const wz = chunkZ * CHUNK_SIZE + nz * CHUNK_SIZE * 0.45;
      if (isWater(wx, wz)) continue;
      const h = getTerrainHeight(wx, wz);
      rocks.push({ pos: [wx, h - 0.1, wz], seed: chunkX * 1000 + chunkZ * 100 + i });
    }

    return { trees, rocks };
  }, [chunkX, chunkZ]);

  return (
    <group>
      {objects.trees.map((pos, i) => (
        <PalmTree key={`t${i}`} position={pos} />
      ))}
      {objects.rocks.map((r, i) => (
        <Rock key={`r${i}`} position={r.pos} seed={r.seed} />
      ))}
    </group>
  );
}

interface TreesProps {
  playerPosition: THREE.Vector3;
}

export default function Trees({ playerPosition }: TreesProps) {
  const RENDER_DISTANCE = 3;

  const chunks = useMemo(() => {
    const cx = Math.round(playerPosition.x / CHUNK_SIZE);
    const cz = Math.round(playerPosition.z / CHUNK_SIZE);
    const result: { x: number; z: number }[] = [];
    for (let x = cx - RENDER_DISTANCE; x <= cx + RENDER_DISTANCE; x++) {
      for (let z = cz - RENDER_DISTANCE; z <= cz + RENDER_DISTANCE; z++) {
        result.push({ x, z });
      }
    }
    return result;
  }, [
    Math.round(playerPosition.x / CHUNK_SIZE),
    Math.round(playerPosition.z / CHUNK_SIZE),
  ]);

  return (
    <group>
      {chunks.map((c) => (
        <TreesChunk key={`${c.x},${c.z}`} chunkX={c.x} chunkZ={c.z} />
      ))}
    </group>
  );
}
