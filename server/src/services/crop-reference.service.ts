type CropReference = {
  name: string;
  aliases: string[];
  averageDaysToHarvest: number;
  optimalMoistureMin: number;
  optimalMoistureMax: number;
  baseYield: number;
};

const cropCatalog: CropReference[] = [
  {
    name: "Томат",
    aliases: ["томат", "tomato", "помідор"],
    averageDaysToHarvest: 100,
    optimalMoistureMin: 60,
    optimalMoistureMax: 75,
    baseYield: 22,
  },
  {
    name: "Огірок",
    aliases: ["огірок", "cucumber"],
    averageDaysToHarvest: 65,
    optimalMoistureMin: 70,
    optimalMoistureMax: 85,
    baseYield: 20,
  },
  {
    name: "Картопля",
    aliases: ["картопля", "potato"],
    averageDaysToHarvest: 95,
    optimalMoistureMin: 65,
    optimalMoistureMax: 80,
    baseYield: 30,
  },
  {
    name: "Перець",
    aliases: ["перець", "pepper"],
    averageDaysToHarvest: 95,
    optimalMoistureMin: 60,
    optimalMoistureMax: 75,
    baseYield: 18,
  },
  {
    name: "Цибуля",
    aliases: ["цибуля", "onion"],
    averageDaysToHarvest: 110,
    optimalMoistureMin: 55,
    optimalMoistureMax: 70,
    baseYield: 12,
  },
];

export const findCropReference = (inputName: string) => {
  const normalized = inputName.trim().toLowerCase();

  return cropCatalog.find((crop) =>
    crop.aliases.some((alias) => alias.toLowerCase() === normalized)
  );
};

export const getCropCatalog = () => cropCatalog.map((crop) => crop.name);