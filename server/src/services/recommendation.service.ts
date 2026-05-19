type RecommendationInput = {
  moisture: number;
  rainfall: number;
  temperature: number;
};

export const buildRecommendation = ({
  moisture,
  rainfall,
  temperature,
}: RecommendationInput) => {

  // ризик морозу
  if (temperature <= 2) {
    return {
      recommendationType: "protection",
      message: "Існує ризик низької температури. Рекомендується захистити рослини.",
      irrigationVolume: null,
    };
  }

  // сухий ґрунт і немає дощу
  if (moisture < 40 && rainfall < 2) {
    return {
      recommendationType: "irrigation",
      message: "Рівень вологості низький, опадів недостатньо. Рекомендується виконати полив.",
      irrigationVolume: 10,
    };
  }

  // сухий ґрунт але буде дощ
  if (moisture < 40 && rainfall >= 2) {
    return {
      recommendationType: "delay_irrigation",
      message: "Очікуються опади. Полив доцільно відкласти.",
      irrigationVolume: null,
    };
  }

  // все нормально
  return {
    recommendationType: "no_action",
    message: "Рівень вологості в допустимих межах. Додатковий полив не потрібен.",
    irrigationVolume: null,
  };
};
