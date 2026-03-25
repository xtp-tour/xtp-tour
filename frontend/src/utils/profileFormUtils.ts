import type { TFunction } from 'i18next';

const NTRP_LEVEL_VALUES = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0] as const;

export function getNtrpLevelOptions(t: TFunction) {
  return NTRP_LEVEL_VALUES.map((value) => {
    const formattedValue = value.toFixed(1);
    return {
      value,
      label: t(`profileSetup.ntrp.levels.${formattedValue}`),
    };
  });
}
