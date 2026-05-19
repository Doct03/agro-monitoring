type AdvisorInput = {
  cropName: string;
  recommendation: string;
  moisture: number;
  temperature: number;
  rainfall: number;
};

export const buildAdvisoryText = ({
  cropName,
  recommendation,
  moisture,
  temperature,
  rainfall,
}: AdvisorInput) => {
  return `Для культури "${cropName}" система визначила такий стан: вологість ґрунту становить ${moisture}%, температура повітря ${temperature}°C, кількість опадів ${rainfall} мм. На основі цих даних рекомендація: ${recommendation}`;
};