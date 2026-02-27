import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, noise2D } from '@/lib/noise';

const CHUNK_SIZE = 32;
const RESOLUTION = 64;

interface TerrainChunkProps {
  chunkX: number;
  chunkZ: number;
}

// Cartoonish color palettes
const GRASS_COLORS = [
  [0.30, 0.72, 0.28],  // vivid green
  [0.38, 0.80, 0.32],  // light green
  [0.26, 0.62, 0.24],  // dark green
  [0.42, 0.75, 0.30],  // lime-ish
  [0.34, 0.65, 0.22],  // olive green
];

const BEACH_COLORS = [
  [0.88, 0.82, 0.58],  // sand
  [0.78, 0.72, 0.48],  // dark sand
  [0.92, 0.86, 0.64],  // light sand
  [0.70, 0.76, 0.42],  // sandy green
];

const HILL_COLORS = [
  [0.45, 0.55, 0.30],  // mossy
  [0.38, 0.48, 0.26],  // dark mossy
  [0.52, 0.50, 0.35],  // rocky brown
  [0.32, 0.58, 0.28],  // hill green
];

const SAND_COLORS = [
  [0.80, 0.74, 0.52],
  [0.72, 0.66, 0.46],
  [0.85, 0.78, 0.56],
];

function hashTile(x: number, z: number): number {
  // Quick integer hash for deterministic per-tile color picking
  let h = (Math.floor(x * 3.7) * 374761393 + Math.floor(z * 3.7) * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return Math.abs(h);
}

function pickColor(palette: number[][], x: number, z: number): number[] {
  const idx = hashTile(x, z) % palette.length;
  return palette[idx];
}

function TerrainChunk({ chunkX, chunkZ }: TerrainChunkProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, waterGeometry, hasWater } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, RESOLUTION, RESOLUTION);
    geo.rotateX(-Math.PI / 2);
    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    let hasWaterFlag = false;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) + chunkX * CHUNK_SIZE;
      const z = positions.getZ(i) + chunkZ * CHUNK_SIZE;
      const h = getTerrainHeight(x, z);
      positions.setY(i, h);

      // High-freq noise for subtle per-vertex jitter
      const jitter = noise2D(x * 6.0 + 500, z * 6.0 + 500) * 0.04;

      let base: number[];
      if (h < -0.5) {
        base = pickColor(SAND_COLORS, x, z);
        hasWaterFlag = true;
      } else if (h < 0) {
        base = pickColor(BEACH_COLORS, x, z);
        hasWaterFlag = true;
      } else if (h < 0.5) {
        base = pickColor(BEACH_COLORS, x, z);
      } else if (h < 2) {
        base = pickColor(GRASS_COLORS, x, z);
      } else {
        base = pickColor(HILL_COLORS, x, z);
      }

      colors[i * 3]     = base[0] + jitter;
      colors[i * 3 + 1] = base[1] + jitter;
      colors[i * 3 + 2] = base[2] + jitter * 0.5;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const waterGeo = hasWaterFlag
      ? new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE)
      : null;
    if (waterGeo) waterGeo.rotateX(-Math.PI / 2);

    return { geometry: geo, waterGeometry: waterGeo, hasWater: hasWaterFlag };
  }, [chunkX, chunkZ]);

  const worldX = chunkX * CHUNK_SIZE;
  const worldZ = chunkZ * CHUNK_SIZE;

  return (
    <group position={[worldX, 0, worldZ]}>
      <mesh ref={meshRef} geometry={geometry} receiveShadow>
        <meshToonMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
      {hasWater && waterGeometry && (
        <mesh geometry={waterGeometry} position={[0, -0.05, 0]} receiveShadow>
          <meshPhysicalMaterial
            color="#4fa8c7"
            transparent
            opacity={0.6}
            roughness={0.1}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

interface TerrainProps {
  playerPosition: THREE.Vector3;
}

export default function Terrain({ playerPosition }: TerrainProps) {
  const RENDER_DISTANCE = 4;

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
        <TerrainChunk key={`${c.x},${c.z}`} chunkX={c.x} chunkZ={c.z} />
      ))}
    </group>
  );
}
