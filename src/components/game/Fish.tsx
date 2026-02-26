import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { isWater, waterDepth } from '@/lib/noise';

interface FishShadow {
  id: number;
  baseX: number;
  baseZ: number;
  size: number;
  speed: number;
  phase: number;
  radius: number;
}

interface FishProps {
  playerPosition: THREE.Vector3;
}

export default function Fish({ playerPosition }: FishProps) {
  const groupRef = useRef<THREE.Group>(null);
  const fishDataRef = useRef<FishShadow[]>([]);
  const lastChunkRef = useRef<string>('');

  // Generate fish around the player in water areas
  const fish = useMemo(() => {
    const cx = Math.floor(playerPosition.x / 32);
    const cz = Math.floor(playerPosition.z / 32);
    const key = `${cx},${cz}`;
    if (key === lastChunkRef.current) return fishDataRef.current;
    lastChunkRef.current = key;

    const result: FishShadow[] = [];
    let id = 0;

    // Sample points around player to find water
    for (let dx = -80; dx <= 80; dx += 8) {
      for (let dz = -80; dz <= 80; dz += 8) {
        const wx = cx * 32 + dx;
        const wz = cz * 32 + dz;
        if (isWater(wx, wz) && waterDepth(wx, wz) > 0.3) {
          // Deterministic seeding based on position
          const seed = Math.abs(Math.sin(wx * 12.9898 + wz * 78.233) * 43758.5453) % 1;
          if (seed > 0.7) {
            result.push({
              id: id++,
              baseX: wx,
              baseZ: wz,
              size: 0.3 + seed * 0.5,
              speed: 0.3 + seed * 0.7,
              phase: seed * Math.PI * 2,
              radius: 1 + seed * 3,
            });
          }
        }
      }
    }

    fishDataRef.current = result;
    return result;
  }, [Math.floor(playerPosition.x / 32), Math.floor(playerPosition.z / 32)]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const children = groupRef.current.children;
    for (let i = 0; i < children.length && i < fish.length; i++) {
      const f = fish[i];
      const child = children[i];
      child.position.x = f.baseX + Math.sin(t * f.speed + f.phase) * f.radius;
      child.position.z = f.baseZ + Math.cos(t * f.speed * 0.7 + f.phase) * f.radius;
      child.position.y = -0.15;
      // Rotate to face movement direction
      const angle = Math.atan2(
        Math.cos(t * f.speed + f.phase) * f.radius * f.speed,
        -Math.sin(t * f.speed * 0.7 + f.phase) * f.radius * f.speed * 0.7
      );
      child.rotation.y = angle;
    }
  });

  return (
    <group ref={groupRef}>
      {fish.map((f) => (
        <mesh key={f.id} position={[f.baseX, -0.15, f.baseZ]} rotation={[-Math.PI / 2, 0, 0]} scale={[f.size, f.size * 0.4, 1]}>
          <circleGeometry args={[0.5, 8]} />
          <meshBasicMaterial color="#1a3a4a" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
