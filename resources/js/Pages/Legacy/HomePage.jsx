// resources/js/Pages/HomePage.jsx
import React from 'react';
import ProductCatalog from '@/Components/catalog/ProductCatalog.jsx';
import { useI18n } from '@/i18n';

const HomePage = ({ products, cartCount }) => {
  const { t } = useI18n();

  return (
    <div>
      <h1>{t('legacy.home_page.title')}</h1>
      <ProductCatalog products={products} cartCount={cartCount} />
    </div>
  );
};

export default HomePage;
