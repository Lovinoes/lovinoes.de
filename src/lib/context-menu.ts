// Only allow the browser's right-click menu on actual text (to copy it, look it up, open
// a text link...) or on a selection. Images, icons, cards and empty space get none.

function caretTextNode(x: number, y: number): Node | null {
  if (document.caretPositionFromPoint) return document.caretPositionFromPoint(x, y)?.offsetNode ?? null
  // Safari and older Chromium only have the non-standard version.
  const legacy = (document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null })
    .caretRangeFromPoint
  return legacy?.call(document, x, y)?.startContainer ?? null
}

function isOverText(x: number, y: number) {
  const node = caretTextNode(x, y)
  if (!node || node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return false
  // The caret APIs snap to the nearest text, so check the pointer is really on its glyphs.
  const range = document.createRange()
  range.selectNodeContents(node)
  return [...range.getClientRects()].some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
}

export function restrictContextMenu() {
  document.addEventListener("contextmenu", (e) => {
    if (window.getSelection()?.toString()) return
    if (e.target instanceof Element && e.target.closest("input, textarea, [contenteditable]")) return
    if (isOverText(e.clientX, e.clientY)) return
    e.preventDefault()
  })
}
