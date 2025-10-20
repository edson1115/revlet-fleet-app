// Vehicles
const veh = await getJSON<{ vehicles: Vehicle[] }>("/api/vehicles");
setVehicles(veh.vehicles ?? []);
