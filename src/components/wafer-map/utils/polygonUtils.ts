/**
 * 多边形相关工具函数
 */

export interface Point {
  x: number
  y: number
}

/**
 * 判断点是否在多边形内（射线法）
 * @param point 要判断的点
 * @param polygon 多边形顶点数组
 * @returns 是否在多边形内
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false

  let inside = false
  const x = point.x
  const y = point.y

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

/**
 * 判断矩形是否与多边形相交或在多边形内
 * @param rect 矩形 {x, y, width, height}
 * @param polygon 多边形顶点数组
 * @returns 是否相交或在内部
 */
export function isRectIntersectPolygon(
  rect: { x: number; y: number; width: number; height: number },
  polygon: Point[]
): boolean {
  if (polygon.length < 3) return false

  // 检查矩形的四个角是否有任何一个在多边形内
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height }
  ]

  for (const corner of corners) {
    if (isPointInPolygon(corner, polygon)) {
      return true
    }
  }

  // 检查多边形的顶点是否有任何一个在矩形内
  for (const point of polygon) {
    if (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    ) {
      return true
    }
  }

  // 检查多边形的边是否与矩形的边相交
  const rectEdges = [
    [corners[0], corners[1]],
    [corners[1], corners[2]],
    [corners[2], corners[3]],
    [corners[3], corners[0]]
  ]

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i]
    const p2 = polygon[(i + 1) % polygon.length]

    for (const rectEdge of rectEdges) {
      if (doLineSegmentsIntersect(p1, p2, rectEdge[0], rectEdge[1])) {
        return true
      }
    }
  }

  return false
}

/**
 * 判断两条线段是否相交
 */
function doLineSegmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const ccw = (a: Point, b: Point, c: Point) => {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x)
  }

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
}

/**
 * 计算多边形的边界框
 */
export function getPolygonBounds(polygon: Point[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  if (polygon.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  let minX = polygon[0].x
  let minY = polygon[0].y
  let maxX = polygon[0].x
  let maxY = polygon[0].y

  for (const point of polygon) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  return { minX, minY, maxX, maxY }
}
