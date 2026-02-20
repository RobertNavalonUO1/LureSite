import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const AvatarModel = ({ gender, bodyType, shirtColor, pantsColor, hairColor }) => {
  const bodyHeight = bodyType === 'tall' ? 1.6 : bodyType === 'short' ? 1.0 : 1.2;

  return (
    <group>
      {/* Cuerpo base */}
      <mesh position={[0, bodyHeight / 2, 0]}>
        <cylinderGeometry args={[0.5, 0.5, bodyHeight, 32]} />
        <meshStandardMaterial color="#f5d7b2" />
      </mesh>

      {/* Cabeza */}
      <mesh position={[0, bodyHeight + 0.6, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#f5d7b2" />
      </mesh>

      {/* Ojos */}
      <mesh position={[-0.15, bodyHeight + 0.7, 0.35]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[0.15, bodyHeight + 0.7, 0.35]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>

      {/* Nariz */}
      <mesh position={[0, bodyHeight + 0.6, 0.4]}>
        <coneGeometry args={[0.05, 0.2, 16]} />
        <meshStandardMaterial color="#f5b5a2" />
      </mesh>

      {/* Boca */}
      <mesh position={[0, bodyHeight + 0.5, 0.35]}>
        <boxGeometry args={[0.2, 0.05, 0.01]} />
        <meshStandardMaterial color="red" />
      </mesh>

      {/* Orejas */}
      <mesh position={[-0.45, bodyHeight + 0.6, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#f5d7b2" />
      </mesh>
      <mesh position={[0.45, bodyHeight + 0.6, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#f5d7b2" />
      </mesh>

      {/* Pelo */}
      <mesh position={[0, bodyHeight + 0.95, 0]}>
        <sphereGeometry args={[0.45, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>

      {/* Gorro (si es mujer) */}
      {gender === 'female' && (
        <mesh position={[0, bodyHeight + 1.1, 0]}>
          <coneGeometry args={[0.6, 0.5, 32]} />
          <meshStandardMaterial color="#ff66cc" />
        </mesh>
      )}

      {/* Camiseta */}
      <mesh position={[0, bodyHeight - 0.3, 0]}>
        <boxGeometry args={[1, 0.6, 0.6]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>

      {/* Piernas */}
      <mesh position={[-0.2, 0.3, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
      <mesh position={[0.2, 0.3, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
    </group>
  );
};

const AvatarCreatorModal = ({ isOpen, onClose, onSelect }) => {
  const [shirtColor, setShirtColor] = useState('#00aaff');
  const [pantsColor, setPantsColor] = useState('#222222');
  const [hairColor, setHairColor] = useState('#552200');
  const [gender, setGender] = useState('male');
  const [bodyType, setBodyType] = useState('average');
  const canvasContainerRef = useRef(null);

  const handleConfirm = async () => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (!canvas) return alert('Canvas no disponible');

    const dataUrl = canvas.toDataURL('image/png');
    const response = await fetch('/api/avatar-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });

    if (response.ok) {
      const data = await response.json();
      onSelect(data.url);
      onClose();
    } else {
      alert('Error al guardar el avatar.');
    }
  };

  const handleReset = async () => {
    const response = await fetch('/api/avatar-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: null }),
    });

    if (response.ok) {
      const data = await response.json();
      onSelect(data.url);
      onClose();
    } else {
      alert('No se pudo restablecer el avatar.');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full animate-fade-in">
        <h2 className="text-2xl font-bold text-center mb-4">Creador de Avatar</h2>

        <div ref={canvasContainerRef} className="w-full h-80 bg-gray-100 rounded">
          <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
            <ambientLight />
            <directionalLight position={[3, 5, 2]} intensity={1.5} />
            <OrbitControls enablePan={false} />
            <AvatarModel
              gender={gender}
              bodyType={bodyType}
              shirtColor={shirtColor}
              pantsColor={pantsColor}
              hairColor={hairColor}
            />
          </Canvas>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <label className="block mb-1 font-medium">Camiseta</label>
            <input type="color" value={shirtColor} onChange={(e) => setShirtColor(e.target.value)} />
          </div>
          <div>
            <label className="block mb-1 font-medium">Pantalón</label>
            <input type="color" value={pantsColor} onChange={(e) => setPantsColor(e.target.value)} />
          </div>
          <div>
            <label className="block mb-1 font-medium">Cabello</label>
            <input type="color" value={hairColor} onChange={(e) => setHairColor(e.target.value)} />
          </div>
          <div>
            <label className="block mb-1 font-medium">Género</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border p-1 rounded">
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Cuerpo</label>
            <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className="w-full border p-1 rounded">
              <option value="short">Bajo</option>
              <option value="average">Normal</option>
              <option value="tall">Alto</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={handleReset} className="text-sm px-4 py-2 rounded border border-gray-400 hover:bg-gray-100">
            Restablecer Avatar
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
            <button onClick={handleConfirm} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Guardar Avatar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AvatarCreatorModal;
