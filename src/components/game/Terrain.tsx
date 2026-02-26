import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '@/lib/noise';

const CHUNK_SIZE = 32;
const RESOLUTION = 32;

interface TerrainChunkProps {
  chunkX: number;
  chunkZ: number;
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

      // Color based on height
      if (h < -0.5) {
        // Deep underwater sand
        colors[i * 3] = 0.76; colors[i * 3 + 1] = 0.70; colors[i * 3 + 2] = 0.50;
        hasWaterFlag = true;
      } else if (h < 0) {
        // Shallow water edge / wet sand
        colors[i * 3] = 0.65; colors[i * 3 + 1] = 0.75; colors[i * 3 + 2] = 0.45;
        hasWaterFlag = true;
      } else if (h < 0.5) {
        // Beach/light grass
        colors[i * 3] = 0.55; colors[i * 3 + 1] = 0.78; colors[i * 3 + 2] = 0.38;
      } else if (h < 2) {
        // Grass
        colors[i * 3] = 0.35; colors[i * 3 + 1] = 0.70; colors[i * 3 + 2] = 0.30;
      } else {
        // Hill
        colors[i * 3] = 0.30; colors[i * 3 + 1] = 0.60; colors[i * 3 + 2] = 0.25;
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    // Water plane for this chunk if needed
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
        <meshLambertMaterial vertexColors side={THREE.DoubleSide} />
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
