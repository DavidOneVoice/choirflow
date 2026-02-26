export async function uploadAudioToCloudinary(file) {
  const cloudName = "dsdfeajv3";
  const uploadPreset = "choirflow";

  // Cloudinary treats audio uploads under "video" resource type
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
  }

  return res.json();
}
