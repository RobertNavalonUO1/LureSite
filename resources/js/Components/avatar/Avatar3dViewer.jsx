import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const RotatingBox = () => {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
};

export default function Avatar3DViewer({ isOpen, onClose }) {
  const backgroundRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (backgroundRef.current && e.target === backgroundRef.current) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={backgroundRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl relative animate-fade-in">
        <h2 className="text-2xl font-semibold text-center mb-4">Vista 3D del Avatar</h2>

        <div className="w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden border">
          <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
            <ambientLight />
            <directionalLight position={[3, 5, 2]} intensity={1.2} />
            <OrbitControls enablePan={false} />
            <RotatingBox />
          </Canvas>
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-xl"
          title="Cerrar"
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}
