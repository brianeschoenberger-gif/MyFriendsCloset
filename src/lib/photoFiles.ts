const typesByExtension = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', jpe: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  avif: 'image/avif', gif: 'image/gif', bmp: 'image/bmp', heic: 'image/heic', heif: 'image/heif',
} as const
const supportedTypes = new Set<string>(Object.values(typesByExtension))
const typeAliases: Record<string, string> = { 'image/jpg': 'image/jpeg', 'image/pjpeg': 'image/jpeg', 'image/x-ms-bmp': 'image/bmp' }

function supportedType({ name, type }: Pick<File, 'name' | 'type'>) {
  const mime = type.trim().toLowerCase()
  if (supportedTypes.has(mime)) return mime
  if (Object.prototype.hasOwnProperty.call(typeAliases, mime)) return typeAliases[mime]
  if (mime && mime !== 'application/octet-stream') return undefined
  const extension = name.toLowerCase().split('.').at(-1) as keyof typeof typesByExtension | undefined
  return extension && name.includes('.') && Object.prototype.hasOwnProperty.call(typesByExtension, extension) ? typesByExtension[extension] : undefined
}

export function usablePhoto(file: File, byteLimit: number): File {
  const type = supportedType(file)
  if (!type) throw new Error('Choose a JPEG, PNG, HEIC, or other supported photo. Vector images aren’t supported.')
  if (!file.size) throw new Error('This photo file is empty.')
  if (file.size > byteLimit) throw new Error(`Choose a photo under ${Math.round(byteLimit / 1_000_000)} MB.`)
  return type === file.type ? file : new File([file], file.name, { type, lastModified: file.lastModified })
}

export function photoDecodeMessage(file: File) {
  return ['image/heic', 'image/heif'].includes(file.type)
    ? 'This browser couldn’t open the HEIC/HEIF photo. Try a JPEG copy of it.'
    : 'Couldn’t open this photo. Try a JPEG or PNG copy.'
}
