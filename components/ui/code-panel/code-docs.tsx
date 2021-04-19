import { styled } from "stitches.config"
import { PlayCircle } from "react-feather"

export default function CodeDocs({ isHidden }: { isHidden: boolean }) {
  return (
    <StyledDocs isHidden={isHidden}>
      <h2>Code Globs</h2>
      <p>
        You can use JavaScript in the Code Panel to create globs and nodes with
        code.
      </p>
      <p>Here&apos;s how it works:</p>
      <ul>
        <li>Write your code using the API described below.</li>
        <li>
          Click the <PlayCircle size={12} /> button (or press <b>Command + S</b>
          ) to run your script.
        </li>
        <li>
          When your script runs, any <code>Node</code> or <code>Glob</code> that
          you have created will be added to the canvas. Any <i>previously</i>{" "}
          generated nodes or globs will be removed.
        </li>
      </ul>
      <p>
        Note that in the API documentation, <i>points</i> and <i>vectors</i> are
        used interchangably, as both are instances of the <code>Vector</code>{" "}
        class described below.
      </p>
      <hr />
      <h3>
        <code>Node</code>
      </h3>
      <pre>
        <code>{`const node = new Node({
  x: 0,
  y: 0,
  radius: 25
})

const node = new Node({
  point: new Vector(0, 0),
  radius: 25
})`}</code>
      </pre>
      <h3>Properties</h3>
      <h4>
        <code>
          <i>node.</i>point
        </code>
      </h4>
      <p>
        A <code>Vector</code> for the center of the node.
      </p>
      <h4>
        <code>
          <i>node.</i>x
        </code>
      </h4>
      <p>The x coordinate of the vector's point.</p>
      <h4>
        <code>
          <i>node.</i>y
        </code>
      </h4>
      <p>The y coordinate of the vector's point.</p>
      <h4>
        <code>
          <i>node.</i>radius
        </code>
      </h4>
      <p>A number for the length of the node&apos;s radius.</p>
      <h4>
        <code>
          <i>node.</i>cap
        </code>
      </h4>
      <p>
        The appearance of the node when part of a glob, either{" "}
        <code>&quot;round&quot;</code> or <code>&quot;flat&quot;</code>.
      </p>
      <h3>Methods</h3>
      <h4>
        <code>
          <i>node.</i>clone()
        </code>
      </h4>
      <p>Return a new node with the same properties.</p>
      <h4>
        <code>
          <i>node.</i>getBounds()
        </code>
      </h4>
      <p>Return a bounding box for the node.</p>
      <h4>
        <code>
          <i>node.</i>destroy()
        </code>
      </h4>
      <p>Remove the node. Destroyed nodes will not be added to the canvas.</p>
      <hr />
      <h3>
        <code>Glob</code>
      </h3>
      <p>
        Globs are shapes drawn between nodes. They have two <b>handles</b>,{" "}
        <code>D</code> and <code>Dp</code>, and four <b>anchors</b>,
        <code>a</code>, <code>b</code>, <code>ap</code>, and <code>bp</code>,
        that together determine the curves on either side of the glob.
      </p>
      <pre>
        <code>{`const glob = new Glob({
  start: myNodeA,
  end: myNodeB,
})`}</code>
      </pre>{" "}
      <h3>Properties</h3>
      <h4>
        <code>
          <i>glob.</i>start
        </code>
      </h4>
      <p>
        A <code>Node</code> where the glob begins.
      </p>
      <h4>
        <code>
          <i>glob.</i>end
        </code>
      </h4>
      <p>
        A <code>Node</code> where the glob ends.
      </p>
      <h4>
        <code>
          <i>glob.</i>D
        </code>
      </h4>
      <p>
        A <code>Vector</code> for the position of the glob&apos;s first handle.
      </p>
      <h4>
        <code>
          <i>glob.</i>Dp
        </code>
      </h4>
      <p>
        A <code>Vector</code> for the position of the glob&apos;s second handle.
      </p>
      <h4>
        <code>
          <i>glob.</i>a
        </code>
      </h4>
      <p>
        A number between 0 and 1 for the distance of the anchor between the
        <code>start</code> node and the <code>D</code> handle. At 0, the anchor
        will be touching the <code>start</code> node; at 1, the anchor will be
        touching the <code>D</code> handle.
      </p>
      <h4>
        <code>
          <i>glob.</i>b
        </code>
      </h4>
      <p>
        A number between 0 and 1 for the distance of the anchor between the
        <code>start</code> node and the <code>D</code> handle. At 0, the anchor
        will be touching the <code>end</code> node; at 1, the anchor will be
        touching the <code>D</code> handle.
      </p>
      <h4>
        <code>
          <i>glob.</i>ap
        </code>
      </h4>
      <p>
        A number between 0 and 1 for the distance of the anchor between the
        <code>start</code> node and the <code>Dp</code> handle. At 0, the anchor
        will be touching the <code>start</code> node; at 1, the anchor will be
        touching the <code>Dp</code> handle.
      </p>
      <h4>
        <code>
          <i>glob.</i>bp
        </code>
      </h4>
      <p>
        A number between 0 and 1 for the distance of the anchor between the
        <code>start</code> node and the <code>Dp</code> handle. At 0, the anchor
        will be touching the <code>end</code> node; at 1, the anchor will be
        touching the <code>Dp</code> handle.
      </p>
      <h4>
        <code>
          <i>glob.</i>center
        </code>
      </h4>
      <p>The point between the glob's nodes.</p>
      <h4>
        <code>
          <i>glob.</i>vector
        </code>
      </h4>
      <p>The vector between the glob's nodes.</p>
      <h3>Methods</h3>
      <h4>
        <code>
          <i>glob.</i>straighten()
        </code>
      </h4>
      <p>
        Places the glob's handles such that both of the glob's curves form
        straight lines.
      </p>
      <h4>
        <code>
          <i>glob.</i>pinch()
        </code>
      </h4>
      <p>Places the glob's handles at the point between the glob's nodes.</p>
      <h4>
        <code>
          <i>glob.</i>getCenter()
        </code>
      </h4>
      <p>Returns the point between the glob's nodes.</p>
      <h4>
        <code>
          <i>glob.</i>getVector()
        </code>
      </h4>
      <p>Returns the vector between the glob's nodes.</p>
      <h4>
        <code>
          <i>glob.</i>getPoints()
        </code>
      </h4>
      <p>
        Return all relevant vectors for the glob, such as the tangent points
        where the globs curves touch its nodes. These are <code>E0</code> and{" "}
        <code>E0p</code> on the start node, <code>E1</code> and <code>E1p</code>{" "}
        on the end node; as well as the exact points of the anchors (
        <code>F0</code> for <code>a</code>, <code>F1</code> for <code>b</code>,{" "}
        <code>F0p</code> for <code>ap</code>, and
        <code>F1p</code> for <code>bp</code>).
      </p>
      <h4>
        <code>
          <i>glob.</i>getBounds()
        </code>
      </h4>
      <p>Return a bounding box for the glob.</p>
      <h4>
        <code>
          <i>glob.</i>destroy()
        </code>
      </h4>
      <p>Remove the glob. Destroyed globs will not be added to the canvas.</p>
      <hr />
      <h3>
        <code>Vector</code>
      </h3>
      <p>
        A <code>Vector</code> is a class representing either a point in space or
        some movement through space. With apologies to the mathletes, we use
        them here interchangeably: the <code>point</code> of each{" "}
        <code>Node</code> is a <code>Vector</code>, as well as the point of each{" "}
        <code>Glob</code> handle. However, being vectors, you may perform vector
        operations on those points to move them around or create new vectors for
        new items.
      </p>
      <p>
        Many of the methods described below will mutate the vector on which the
        method is called. For example, <code>vectorA.add(vectorB)</code> will
        change the <code>x</code> and <code>y</code> properties of{" "}
        <code>vectorA</code>. To produce new vectors <i>without</i> mutating any
        inputs, each method has a static twin. For example,{" "}
        <code>Vector.add(vectorA, vectorB)</code> will return the same result
        but as a new vector.
      </p>
      <pre>
        <code>{`const vectorA = new Vector({
  x: 0,
  y: 0,
})

const vectorB = new Vector(vectorA)

const vectorC = Vector.from(vectorA)
`}</code>
      </pre>{" "}
      <h3>Methods</h3>
      <h4>
        <code>
          <i>vector.</i>copy()
        </code>
      </h4>
      <p>
        Return a new <code>Vector</code> identical to this one.
      </p>
      <h4>
        <code>
          <i>vector.</i>toArray()
        </code>
      </h4>
      <p>
        Return this vector as <code>[x, y]</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>add(b: Vector)
        </code>
      </h4>
      <p>
        Add <code>b</code> to the vector.
      </p>
      <h4>
        <code>
          <i>vector.</i>sub(b: Vector)
        </code>
      </h4>
      <p>
        Subtract <code>b</code> from the vector.
      </p>
      <h4>
        <code>
          <i>vector.</i>mul(b: Vector)
        </code>
      </h4>
      <p>
        Multiply the vector by <code>b</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>mulScalar(s: number)
        </code>
      </h4>
      <p>
        Multiply the vector by the scalar <code>s</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>div(b: Vector)
        </code>
      </h4>
      <p>
        Divide the vector by <code>b</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>divScalar(s: number)
        </code>
      </h4>
      <p>
        Divide the vector by the scalar <code>s</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>vec(b: Vector)
        </code>
      </h4>
      <p>
        Get the vector to <code>b</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>dpr(b: Vector)
        </code>
      </h4>
      <p>
        Get the dot product between the vector and <code>b</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>cpr(b: Vector)
        </code>
      </h4>
      <p>
        Get the cross product between the vector and <code>b</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>tangent(b: Vector)
        </code>
      </h4>
      <p>
        Get the tangent to <code>b</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>dist2(b: Vector)
        </code>
      </h4>
      <p>
        Get the distance length to <code>b</code>, squared.
      </p>
      <h4>
        <code>
          <i>vector.</i>dist(b: Vector)
        </code>
      </h4>
      <p>
        Get the distance to <code>b</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>ang(b: Vector)
        </code>
      </h4>
      <p>
        Get the angle to <code>b</code> in radians.
      </p>
      <h4>
        <code>
          <i>vector.</i>med(b: Vector)
        </code>
      </h4>
      <p>
        Get the point between the vector and <code>b</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>rot(r: number)
        </code>
      </h4>
      <p>
        Rotate this vector by <code>r</code> radians.
      </p>
      <h4>
        <code>
          <i>vector.</i>rotAround(b: Vector, r: number)
        </code>
      </h4>
      <p>
        Rotate this vector around <code>b</code> by <code>r</code> radians.
      </p>
      <h4>
        <code>
          <i>vector.</i>lrp(b: Vector, t: number)
        </code>
      </h4>
      <p>
        Interpolate between this vector and <code>b</code> by the normal value{" "}
        <code>t</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>nudge(b: Vector, d: number)
        </code>
      </h4>
      <p>
        Move this in the direction <code>b</code> by the distance <code>d</code>
        .<code>t</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>int(b: Vector, from: number, to: number, s: number)
        </code>
      </h4>
      <p>
        Interpolate from this vector to <code>b</code> when <code>s</code> moves
        between <code>from</code> and <code>to</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>equals(b: Vector)
        </code>
      </h4>
      <p>
        Get whether this vector is the same as <code>b</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>abs()
        </code>
        <br />
      </h4>
      <p>Get the absolute value of this vector.</p>
      <h4>
        <code>
          <i>vector.</i>len()
        </code>
      </h4>
      <p>Get the length of this vector.</p>
      <h4>
        <code>
          <i>vector.</i>len2()
        </code>
      </h4>
      <p>Get the length of this vector squared.</p>
      <h4>
        <code>
          <i>vector.</i>per()
        </code>
      </h4>
      <p>Get the perpendicular of this vector.</p>
      <h4>
        <code>
          <i>vector.</i>neg()
        </code>
      </h4>
      <p>Get this vector with its signs reversed.</p>
      <h4>
        <code>
          <i>vector.</i>uni()
        </code>
      </h4>
      <p>Get this vector as a unit vector (or normalized vector).</p>
      <h4>
        <code>
          <i>vector.</i>isLeft(center: Vector, b: Vector)
        </code>
      </h4>
      <p>
        Get whether this vector is to the left of <code>b</code> relative to{" "}
        <code>center</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>nearestPointOnLineThroughPoint(b: Vector, u: Vector)
        </code>
      </h4>
      <p>
        Get the nearest point on a line with a direction vector <code>u</code>{" "}
        that passes through the point <code>b</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>distanceToLineThroughPoint(b: Vector, u: Vector)
        </code>
      </h4>
      <p>
        Get the distance to the nearest point on a line with a direction vector{" "}
        <code>u</code> that passes through the point <code>b</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>nearestPointOnLineSegment(p0: Vector, p1: Vector, clamp
          = true)
        </code>
      </h4>
      <p>
        Get the nearest point on a line segment that starts at <code>p0</code>{" "}
        and ends at <code>p1</code>. If <code>clamp</code> is true, then the
        resulting vector will be a point on the segment; otherwise, the result
        will be a point on an infinite line that passes through both{" "}
        <code>p0</code> and <code>p1</code>.
      </p>
      <h4>
        <code>
          <i>vector.</i>distanceToLineSegment(p0: Vector, p1: Vector, clamp =
          true)
        </code>
      </h4>
      <p>
        Get the distance to the nearest point on a line segment that starts at{" "}
        <code>p0</code> and ends at <code>p1</code>. If <code>clamp</code> is
        true, then the resulting distance vector will be to a point on the
        segment; otherwise, the result will be the distance to teh nearest point
        on an infinite line that passes through both <code>p0</code> and{" "}
        <code>p1</code>.
      </p>
      <h3>Static Methods</h3>
      <p>
        All of the above methods are implemented as static methods with an
        additional first argument as an input <code>Vector</code>. Static
        methods will always create new vectors without mutating their inputs.
      </p>
      <pre>
        <code>{`// The non-static method
const v0 = vectorA.add(vectorB)`}</code>
      </pre>
      <pre>
        <code>{`// The static method
const v0 = Vector.add(vectorA, vectorB)
`}</code>
      </pre>
      <h4>
        <code>
          <i>Vector.</i>ang3(center: Vector, a: Vector, b: Vector)
        </code>
      </h4>
      <p>Get the angle between the three vectors.</p>
      <h4>
        <code>
          <i>Vector.</i>clockwise(center: Vector, a: Vector, b: Vector)
        </code>
      </h4>
      <p>
        Get whether <code>a</code> and <code>b</code> are clockwise relative to{" "}
        <code>center</code>.
      </p>
      <h4>
        <code>
          <i>Vector.</i>cast(a: Vector | {`{ x: number, y: number }`})
        </code>
      </h4>
      <p>
        Create a <code>Vector</code> from <code>a</code> unless it already is
        one.
      </p>
      <hr />
      <h3>
        <code>Utils</code>
      </h3>
      <p>
        The <code>Utils</code> class contains useful static methods.
      </p>
      <h4>
        <code>
          <i>Utils.</i>getRayRayIntersection(p0: Vector, n0: Vector, p1: Vector,
          n1: Vector)
        </code>
      </h4>
      <p>
        Returns the intersection of a line with unit direction vector{" "}
        <code>n0</code>, on whch is located point vector <code>p0</code>, and a
        second line with unit direction vector <code>n1</code>, on whch is
        located point vector <code>p1</code>.
      </p>
      <h4>
        <code>
          <i>Utils.</i>getRayRayIntersection(p0: Vector, n0: Vector, p1: Vector,
          n1: Vector)
        </code>
      </h4>
      <p>
        Returns the intersection of a line with unit direction vector{" "}
        <code>n0</code>, on whch is located point vector <code>p0</code>, and a
        second line with unit direction vector <code>n1</code>, on whch is
        located point vector <code>p1</code>.
      </p>
      <h4>
        <code>
          <i>Utils.</i>bez1d(a: number, b: number, c: number, d: number, t:
          number)
        </code>
      </h4>
      <p>A basis function for a bezier curve.</p>
    </StyledDocs>
  )
}

const StyledDocs = styled("div", {
  position: "absolute",
  backgroundColor: "$panel",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  padding: 16,
  font: "$docs",
  overflowY: "scroll",
  userSelect: "none",
  paddingBottom: 64,

  variants: {
    isHidden: {
      true: {
        visibility: "hidden",
      },
      false: {
        visibility: "visible",
      },
    },
  },

  "& ol": {},

  "& li": {
    marginTop: 8,
    marginBottom: 4,
  },

  "& code": {
    font: "$mono",
  },

  "& hr": {
    margin: "32px 0",
    borderColor: "$muted",
  },

  "& h2": {
    margin: "24px 0px",
  },

  "& h3": {
    margin: "48px 0px",
  },

  "& h3 > code": {
    fontSize: 20,
    fontWeight: 600,
    font: "$monoheading",
  },

  "& h4": {
    margin: "32px 0px 0px 0px",
  },

  "& h4 > code": {
    font: "$monoheading",
    fontSize: 16,
    userSelect: "all",
  },

  "& h4 > code > i": {
    fontSize: 14,
    color: "$muted",
  },

  "& pre": {
    backgroundColor: "$bounds_bg",
    padding: 16,
    borderRadius: 4,
    userSelect: "all",
    margin: "24px 0",
  },

  "& p > code, blockquote > code": {
    backgroundColor: "$bounds_bg",
    padding: "2px 4px",
    borderRadius: 2,
    color: "$code",
  },

  "& blockquote": {
    backgroundColor: "rgba(144, 144, 144, .05)",
    padding: 12,
    margin: "20px 0",
    borderRadius: 8,
  },
})
