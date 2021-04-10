import { styled } from "stitches.config"
import { mvPointer, useSelector } from "lib/state"
import { motion, useTransform } from "framer-motion"

export default function Cursor() {
  const x = useTransform(mvPointer.screen, (v) => v[0])
  const y = useTransform(mvPointer.screen, (v) => v[1])
  const isTranslating = useSelector((state) => state.isIn("translating"))

  if (!isTranslating) return null

  return <CursorImage src="/cursors/resizeeastwest.svg" style={{ x, y }} />
}

const CursorImage = styled(motion.img, {
  pointerEvents: "none",
  position: "absolute",
  top: -35 / 2,
  left: -35 / 2,
  background: "none",
  backgroundColor: "none",
})
