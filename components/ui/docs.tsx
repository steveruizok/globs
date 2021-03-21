import { ArrowRight, ArrowUp, Disc, X } from "react-feather"

export default function Docs() {
  return (
    <div>
      <p>
        You can create <b>nodes</b> and connect nodes to form <b>globs</b>.
      </p>
      <p>
        Hold <b>Space</b> to see the solid shape.
      </p>
      <p>
        To <b>create</b> a node: click the{" "}
        <Disc size={14} strokeWidth={3} style={{ marginBottom: -2 }} /> and then
        click on the canvas.
      </p>
      <p>
        To <b>resize</b> a node: hold Command and drag the node.
      </p>
      <p>
        To <b>move</b> a node: drag it on the canvas.
      </p>
      <hr />
      <p>
        To <b>link</b> two nodes with a glob: select a node, click the{" "}
        <ArrowRight size={14} strokeWidth={3} style={{ marginBottom: -2 }} />{" "}
        and then click the second node.
      </p>
      <p>
        To <b>branch</b> a node into a glob: select a node, click the{" "}
        <ArrowUp size={14} strokeWidth={3} style={{ marginBottom: -2 }} /> and
        then click on the canvas.
      </p>
      <p>
        To <b>delete</b> a node: select a node and then click the{" "}
        <X size={14} strokeWidth={3} style={{ marginBottom: -2 }} />.
      </p>
      <p>
        To <b>move</b> a glob, drag it on the canvas.
      </p>
      <hr />
      <p>Hold Shift to select multiple nodes or globs.</p>
      <p>Click on the canvas and drag to select multiple nodes and/or globs.</p>
    </div>
  )
}
