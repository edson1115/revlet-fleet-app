if (kind === "verify_part") {
  const v = JSON.parse(message);
  const { part_name, part_number, vehicle } = v;

  const prompt = `
You are a fleet mechanic AI assistant.
Verify if this part fits this vehicle. 
Vehicle:
- Year: ${vehicle?.year}
- Make: ${vehicle?.make}
- Model: ${vehicle?.model}
- VIN: ${vehicle?.vin || "N/A"}

Part submitted:
- Name: ${part_name}
- Number: ${part_number}

Respond with:
1. FIT or NO FIT
2. Short explanation
3. If no fit, list the correct part numbers.

Be accurate. If unsure, say so.
`;

  const answer = await runAI(prompt);
  return NextResponse.json({ answer });
}
