import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function AvatarModel({ shirtColor, pantsColor }) {
  const bodyRef = useRef();

  useFrame(() => {
    if (bodyRef.current) {
      bodyRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={bodyRef}>
      {/* Cuerpo base */}
      <mesh position={[0, 1, 0]}>
        <cylinderBufferGeometry args={[0.5, 0.5, 1.2, 32]} />
        <meshStandardMaterial color="#f5d7b2" />
      </mesh>

      {/* Cabeza */}
      <mesh position={[0, 2, 0]}>
        <sphereBufferGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#f5d7b2" />
      </mesh>

      {/* Camiseta */}
      <mesh position={[0, 1.4, 0]}>
        <boxBufferGeometry args={[1, 0.6, 0.6]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>

      {/* Piernas */}
      <mesh position={[-0.2, 0.3, 0]}>
        <boxBufferGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
      <mesh position={[0.2, 0.3, 0]}>
        <boxBufferGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
    </group>
  );
}

export default function Avatar3DViewer() {
  const [shirtColor, setShirtColor] = useState('#ff0000');
  const [pantsColor, setPantsColor] = useState('#0000ff');

  return (
    <div className="w-full h-[500px]">
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <ambientLight />
        <directionalLight position={[2, 5, 2]} intensity={1} />
        <OrbitControls enablePan={false} />
        <AvatarModel shirtColor={shirtColor} pantsColor={pantsColor} />
      </Canvas>

      <div className="mt-4 flex justify-center space-x-4">
        <div>
          <label className="block mb-1">Color Camiseta</label>
          <input type="color" value={shirtColor} onChange={(e) => setShirtColor(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Color Pantalón</label>
          <input type="color" value={pantsColor} onChange={(e) => setPantsColor(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
