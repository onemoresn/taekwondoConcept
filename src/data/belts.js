export const BELTS = [
  { id: 'white', name: 'White Belt', korean: 'Huin Ddi', color: '#f5f5f5', textColor: '#1a1a1a', rank: 10 },
  { id: 'yellow', name: 'Yellow Belt', korean: 'Norang Ddi', color: '#f5c518', textColor: '#1a1a1a', rank: 9 },
  { id: 'green', name: 'Green Belt', korean: 'Chorok Ddi', color: '#22a852', textColor: '#ffffff', rank: 7 },
  { id: 'blue', name: 'Blue Belt', korean: 'Cheong Ddi', color: '#2563eb', textColor: '#ffffff', rank: 5 },
  { id: 'red', name: 'Red Belt', korean: 'Bulg Ddi', color: '#dc2626', textColor: '#ffffff', rank: 3 },
  { id: 'black', name: 'Black Belt', korean: 'Geom Ddi', color: '#1a1a1a', textColor: '#d4af37', rank: 1 },
];

export function getBeltById(id) {
  return BELTS.find((b) => b.id === id);
}
