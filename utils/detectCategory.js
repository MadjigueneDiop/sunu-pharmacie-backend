export const detectCategory = (name) => {
  const n = name.toLowerCase();

  if (n.includes("doliprane") || n.includes("paracétamol"))
    return "Anti-inflammatoires";

  if (n.includes("amoxicilline") || n.includes("antibiotique"))
    return "Antibiotiques";

  if (n.includes("vitamine"))
    return "Compléments Alimentaires";


  if (n.includes("insuline") || n.includes("diabète"))
    return "Diabète";

  if (n.includes("crème") || n.includes("pommade"))
    return "Soins de la peau";

  return "General Health";
};