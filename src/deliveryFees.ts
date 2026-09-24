export interface DeliveryLocation {
  city: string;
  fee: number;
}

// Hawn l-fees taba3 kel manta2a lebneniyye, centralized la ydal l-calculation wa7ad.
export const deliveryLocations: DeliveryLocation[] = [
  { city: 'Beirut', fee: 4 }, { city: 'Hamra', fee: 4 }, { city: 'Achrafieh', fee: 4 },
  { city: 'Mar Mikhael', fee: 4 }, { city: 'Verdun', fee: 4 }, { city: 'Dora', fee: 5 },
  { city: 'Antelias', fee: 5 }, { city: 'Broummana', fee: 6 }, { city: 'Kaslik', fee: 6 },
  { city: 'Jounieh', fee: 6 }, { city: 'Byblos', fee: 7 }, { city: 'Jbeil', fee: 7 },
  { city: 'Batroun', fee: 8 }, { city: 'Tripoli', fee: 9 }, { city: 'Zahle', fee: 9 },
  { city: 'Baalbek', fee: 11 }, { city: 'Aley', fee: 7 }, { city: 'Chouf', fee: 9 },
  { city: 'Sidon', fee: 9 }, { city: 'Saida', fee: 9 }, { city: 'Tyre', fee: 11 },
  { city: 'Nabatieh', fee: 11 },
];

export const deliveryFeeFor = (city: string | undefined): number => {
  const normalizedCity = city?.trim().toLocaleLowerCase();
  return deliveryLocations.find(location => location.city.toLocaleLowerCase() === normalizedCity)?.fee ?? 0;
};
