type SimulateMoistureInput = {
  previousMoisture: number | null;
  temperature: number;
  rainfall: number;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

export const simulateMoistureValue = ({
  previousMoisture,
  temperature,
  rainfall,
}: SimulateMoistureInput) => {
  const baseMoisture =
    previousMoisture !== null && previousMoisture !== undefined
      ? Number(previousMoisture)
      : 55;

  const rainfallEffect = clamp(Number(rainfall || 0) * 0.8, 0, 12);

  let evaporationEffect = 2;

  if (temperature >= 30) {
    evaporationEffect = 7;
  } else if (temperature >= 25) {
    evaporationEffect = 5;
  } else if (temperature >= 18) {
    evaporationEffect = 3;
  } else if (temperature <= 8) {
    evaporationEffect = 1;
  }

  const randomNoise = Math.random() * 4 - 2;

  const nextMoisture =
    baseMoisture + rainfallEffect - evaporationEffect + randomNoise;

  return Number(clamp(nextMoisture, 10, 90).toFixed(1));
};