import { ImageResponse } from "next/og"
import fs from "fs"
import path from "path"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  const imgPath = path.join(process.cwd(), "public", "apple-touch-icon.png")
  const imgData = fs.readFileSync(imgPath)
  const base64  = `data:image/png;base64,${imgData.toString("base64")}`

  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={base64} width={180} height={180} alt="Rendi" />
    ),
    size
  )
}
