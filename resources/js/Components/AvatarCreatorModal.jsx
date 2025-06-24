import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const AvatarModel = ({ shirtColor, pantsColor }) => {
  return (
    <group>
      {/* Cuerpo */}
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
};

const AvatarCreatorModal = ({ isOpen, onClose, onSelect }) => {
  const [shirtColor, setShirtColor] = useState('#ff0000');
  const [pantsColor, setPantsColor] = useState('#0000ff');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const avatarData = {
      shirtColor,
      pantsColor,
    };
    onSelect(avatarData);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full animate-fade-in">
        <h2 className="text-2xl font-semibold mb-4 text-center">Crea tu Avatar 3D</h2>

        <div className="w-full h-80 bg-gray-100 rounded">
          <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
            <ambientLight />
            <directionalLight position={[3, 5, 2]} intensity={1.2} />
            <OrbitControls enablePan={false} />
            <AvatarModel shirtColor={shirtColor} pantsColor={pantsColor} />
          </Canvas>
        </div>

        <div className="flex justify-around mt-4">
          <div>
            <label className="block text-sm mb-1 font-medium">Color Camiseta</label>
            <input
              type="color"
              value={shirtColor}
              onChange={(e) => setShirtColor(e.target.value)}
              className="w-16 h-10"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">Color Pantalón</label>
            <input
              type="color"
              value={pantsColor}
              onChange={(e) => setPantsColor(e.target.value)}
              className="w-16 h-10"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
          >
            Guardar Avatar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AvatarCreatorModal;
