const FeaturedProductCard = ({ product }) => (
  <div className="col-span-4 bg-yellow-100 p-6 rounded-xl shadow-md flex justify-between items-center">
    <div>
      <h2 className="text-lg font-bold text-yellow-800">{product.name}</h2>
      <p className="text-sm text-yellow-700">{product.description}</p>
    </div>
    <img src={product.image_url} alt={product.name} className="w-24 h-24 rounded object-cover" />
  </div>
);

export default FeaturedProductCard;
