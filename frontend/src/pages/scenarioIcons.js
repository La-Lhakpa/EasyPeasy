import { Bus, Pill, School, ShoppingBasket, Siren, Stethoscope } from "lucide-react";

export const scenarioIcons = {
  Bus,
  Pill,
  School,
  ShoppingBasket,
  Siren,
  Stethoscope
};

export function withScenarioIcons(scenarios) {
  return scenarios.map((scenario) => ({
    ...scenario,
    icon: scenarioIcons[scenario.iconName] || Stethoscope
  }));
}
