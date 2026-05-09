export const generateDosages = (basePrice) => {
  const doses = [6, 12, 18, 24, 30];

  return doses.map((d) => ({
    value: d,
    unit: "mg",
    price: Math.max(basePrice + d * 50, 500),
  }));
};