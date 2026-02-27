import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, noise2D } from '@/lib/noise';

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

      // Texture variation using high-frequency noise
      const texNoise1 = noise2D(x * 0.8, z * 0.8) * 0.08;
      const texNoise2 = noise2D(x * 2.5 + 100, z * 2.5 + 100) * 0.05;
      const texNoise3 = noise2D(x * 5.0 + 200, z * 5.0 + 200) * 0.03;
      const patch = texNoise1 + texNoise2 + texNoise3;

      // Color based on height with texture variation
      if (h < -0.5) {
        colors[i * 3] = 0.76 + patch; colors[i * 3 + 1] = 0.70 + patch; colors[i * 3 + 2] = 0.50 + patch * 0.5;
        hasWaterFlag = true;
      } else if (h < 0) {
        colors[i * 3] = 0.65 + patch; colors[i * 3 + 1] = 0.75 + patch; colors[i * 3 + 2] = 0.45 + patch * 0.5;
        hasWaterFlag = true;
      } else if (h < 0.5) {
        // Beach / light grass - mix green and sandy brown patches
        const brownMix = noise2D(x * 1.5 + 50, z * 1.5 + 50) > 0.1 ? 0.06 : -0.04;
        colors[i * 3] = 0.55 + patch + brownMix; colors[i * 3 + 1] = 0.78 + patch - Math.abs(brownMix); colors[i * 3 + 2] = 0.38 + patch * 0.5;
      } else if (h < 2) {
        // Grass - alternating darker/lighter patches
        const darkPatch = noise2D(x * 3.0 + 300, z * 3.0 + 300) > 0.15 ? -0.06 : 0.04;
        colors[i * 3] = 0.35 + patch + darkPatch * 0.5; colors[i * 3 + 1] = 0.70 + patch + darkPatch; colors[i * 3 + 2] = 0.30 + patch * 0.3;
      } else {
        // Hill - rocky brown/green mix
        const rockMix = noise2D(x * 4.0, z * 4.0) > 0 ? 0.05 : -0.05;
        colors[i * 3] = 0.30 + patch + rockMix; colors[i * 3 + 1] = 0.60 + patch - Math.abs(rockMix) * 0.5; colors[i * 3 + 2] = 0.25 + patch * 0.3;
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
