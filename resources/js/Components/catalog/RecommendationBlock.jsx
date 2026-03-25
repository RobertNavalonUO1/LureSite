import React from 'react';

const RecommendationBlock = ({ title = "Recomendaciones para ti" }) => (
  <div className="card w-full text-center mt-6 mb-4 animate-fade-in-up">
    <h3 className="text-xl font-semibold text-primary mb-2">{title}</h3>
    <p className="text-neutral text-sm">Basado en tu navegación y preferencias.</p>
  </div>
);

export default RecommendationBlock;
