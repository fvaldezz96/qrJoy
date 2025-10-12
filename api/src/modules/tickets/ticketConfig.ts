export const TICKET_TYPES = {
  joypark: {
    name: 'JoyPark Day Pass',
    price: 5000,
    metadata: {
      includesFood: false,
      includesDrinks: false,
      accessAreas: ['general'],
      durationHours: 8,
    },
  },
  joyweek: {
    name: 'JoyWeek Pass',
    price: 15000,
    metadata: {
      includesFood: true,
      includesDrinks: false,
      accessAreas: ['general', 'vip'],
      durationHours: 168,
    },
  },
  joybox: {
    name: 'JoyBox Premium',
    price: 25000,
    metadata: {
      includesFood: true,
      includesDrinks: true,
      accessAreas: ['general', 'vip', 'premium'],
      durationHours: 24,
    },
  },
};
