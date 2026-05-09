export const generatePackaging = (basePrice) => {
  const packs = [6, 12, 24, 48, 96, 180];

  return packs.map((q) => {
    const unitPrice = Math.max(basePrice - q * 0.5, 100);

    return {
      label: `${q} comprimés`,
      quantity: q,
      price: unitPrice,
      total: unitPrice * q,
      discount: q >= 96 ? 25 : q >= 48 ? 20 : q >= 24 ? 10 : 0,
    };
  });
};