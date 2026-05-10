export function buildImageUrl(request, imagePath) {
  if (!imagePath) return null;
  return `${request.protocol}://${request.host}/uploads${imagePath}`;
}
