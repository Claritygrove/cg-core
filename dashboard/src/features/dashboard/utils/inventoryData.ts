export const INVENTORY_DATA: Record<string, {
  dollarsOnHand: number;
  qtyOnHand: number;
  binsBackroom: number;
  backroomCapacity: number;
  binsOffsite: number;
}> = {
  "PC Portage":      { dollarsOnHand: 285000, qtyOnHand: 18400, binsBackroom: 42, backroomCapacity: 60, binsOffsite: 15 },
  "SE Portage":      { dollarsOnHand: 142000, qtyOnHand:  9200, binsBackroom: 28, backroomCapacity: 40, binsOffsite:  8 },
  "PC East Lansing": { dollarsOnHand: 263000, qtyOnHand: 17100, binsBackroom: 38, backroomCapacity: 55, binsOffsite: 12 },
  "PC Jackson":      { dollarsOnHand: 198000, qtyOnHand: 12800, binsBackroom: 31, backroomCapacity: 45, binsOffsite:  6 },
  "PC Ann Arbor":    { dollarsOnHand: 312000, qtyOnHand: 20100, binsBackroom: 45, backroomCapacity: 65, binsOffsite: 18 },
  "PC Canton":       { dollarsOnHand: 275000, qtyOnHand: 17800, binsBackroom: 40, backroomCapacity: 58, binsOffsite: 14 },
  "PC Novi":         { dollarsOnHand: 291000, qtyOnHand: 18900, binsBackroom: 43, backroomCapacity: 60, binsOffsite: 16 },
};
