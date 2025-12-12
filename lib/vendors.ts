export const VENDORS = [
  { id: "67c6df7f-89c2-4d8b-a7cd-f914dc7d8484", name: "Element" },
  { id: "a67fcc1c-6fae-4137-93c9-c325e4bea734", name: "Enterprise Fleet" },
  { id: "9751b307-dd96-4a53-8fc3-46e9a73229b7", name: "Enterprise Rent" },
  { id: "0875794e-090e-45b5-b021-df17209c6f7c", name: "Fleetio" },
  { id: "e49a6b93-b111-4d89-91e2-08c57c493735", name: "Hertz" },
  { id: "8d265d80-a156-4451-a888-5aa6d219f061", name: "Holman" },
  { id: "7c2fb20b-06af-41ce-8661-32ad5ed850fb", name: "LMR" },
  { id: "7868c6de-cea6-4291-b1ab-9f219394ee13", name: "Local Rental Partner" },
  { id: "68cd469b-ea7b-4f78-974a-b0980792304e", name: "Merchant Fleet" },
  { id: "9bec229d-4461-4835-afb2-771c321e0364", name: "Other" },
  { id: "f35aac31-53d7-447a-8230-b19595624683", name: "Owned" },
  { id: "9d3ae90d-0693-4153-aa39-f12efaaae88d", name: "Ryder" },
  { id: "26e79860-9d3e-4c08-b626-693ca05273d1", name: "U-Haul" },
  { id: "00000000-0000-0000-0000-000000000000", name: "Unassigned" },
  { id: "6c61db76-bf22-469d-b78e-9a26c81a5254", name: "Wheels" },
];

export function vendorName(id?: string | null) {
  if (!id) return "Unassigned";
  return VENDORS.find(v => v.id === id)?.name ?? "Unassigned";
}
