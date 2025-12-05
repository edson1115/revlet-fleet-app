export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const MAX_WIDTH = 1600;
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);

  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob(
      (b) => resolve(b!),
      "image/jpeg",
      0.7 // quality
    )
  );

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
}



