import { ICanvasItems, INode, IGlob } from "lib/types"

export interface IData {
  viewport: {
    point: number[]
    size: number[]
    scroll: number[]
  }
  document: {
    point: number[]
    size: number[]
  }
  camera: {
    zoom: number
    point: number[]
  }
  brush: {
    start: number[]
    end: number[]
    targets: { id: string; type: "glob" | "handle" | "node"; path: string }[]
  }
  nodeIds: string[]
  nodes: Record<string, INode>
  globIds: string[]
  globs: Record<string, IGlob>
  selectedHandle: { id: string; handle: string } | undefined
  selectedGlobs: string[]
  hoveredNodes: string[]
  hoveredGlobs: string[]
  highlightNodes: string[]
  highlightGlobs: string[]
  selected: string[]
  cloning: string[]
}

export const initialData: IData = {
  viewport: {
    point: [0, 0],
    size: [0, 0],
    scroll: [0, 0],
  },
  document: {
    point: [0, 0],
    size: [0, 0],
  },
  camera: {
    point: [0, 0],
    zoom: 1,
  },
  brush: undefined,
  nodes: {
    0: {
      id: "0",
      name: "Node 0",
      type: ICanvasItems.Node,
      point: [100, 100],
      radius: 50,
      zIndex: 0,
      cap: "round",
    },
    1: {
      id: "1",
      name: "Node 1",
      type: ICanvasItems.Node,
      point: [400, 300],
      radius: 25,
      zIndex: 1,
      cap: "round",
    },
    2: {
      id: "2",
      name: "Node 2",
      type: ICanvasItems.Node,
      point: [200, 350],
      radius: 10,
      zIndex: 1,
      cap: "round",
    },
    3: {
      id: "3",
      name: "Node 3",
      type: ICanvasItems.Node,
      point: [100, 350],
      radius: 20,
      zIndex: 1,
      cap: "round",
    },
    4: {
      id: "4",
      name: "Node 4",
      type: ICanvasItems.Node,
      point: [300, 550],
      radius: 50,
      zIndex: 1,
      cap: "round",
    },
  },
  globs: {
    g0: {
      id: "g0",
      name: "Glob 0",
      nodes: ["0", "1"],
      options: {
        D: [400, 150],
        Dp: [300, 150],
        a: 0.5,
        ap: 0.5,
        b: 0.5,
        bp: 0.5,
      },
      zIndex: 2,
    },
    g1: {
      id: "g1",
      name: "Glob 1",
      nodes: ["1", "2"],
      options: {
        D: [450, 450],
        Dp: [420, 400],
        a: 0.5,
        ap: 0.5,
        b: 0.5,
        bp: 0.5,
      },
      zIndex: 2,
    },
    g2: {
      id: "g2",
      name: "Glob 2",
      nodes: ["2", "3"],
      options: {
        D: [250, 550],
        Dp: [220, 500],
        a: 0.5,
        ap: 0.5,
        b: 0.5,
        bp: 0.5,
      },
      zIndex: 3,
    },
  },
  selectedHandle: undefined,
  nodeIds: ["0", "1", "2", "3", "4"],
  globIds: ["g0", "g1", "g2"],
  hoveredNodes: [],
  hoveredGlobs: [],
  highlightNodes: [],
  selected: [],
  selectedGlobs: [],
  highlightGlobs: [],
  cloning: [],
}
