import { useCallback, useState, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { CanvasNode } from "@/components/canvas/CanvasNode";
import { NodeInspector } from "@/components/canvas/NodeInspector";
import { NodePalette } from "@/components/canvas/NodePalette";
import { cn } from "@/lib/utils";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "canvasNode",
    position: { x: 100, y: 200 },
    data: { label: "Prompt", nodeType: "prompt", settings: { text: "" } },
  },
  {
    id: "2",
    type: "canvasNode",
    position: { x: 420, y: 200 },
    data: {
      label: "Image Generator",
      nodeType: "image-generator",
      settings: { model: "stable-diffusion-xl", width: 1024, height: 1024, guidanceScale: 7.5, steps: 30, seed: -1 },
    },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "hsl(217 91% 60%)", strokeWidth: 2 } },
];

let nodeId = 10;

export default function AICreationCanvas() {
  const nodeTypes = useMemo(() => ({ canvasNode: CanvasNode }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: "hsl(217 91% 60%)", strokeWidth: 2 } }, eds)
      ),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const data = event.dataTransfer.getData("application/reactflow");
      if (!data) return;
      const parsed = JSON.parse(data);
      const reactFlowBounds = (event.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect();
      if (!reactFlowBounds) return;
      const position = {
        x: event.clientX - reactFlowBounds.left - 120,
        y: event.clientY - reactFlowBounds.top - 30,
      };
      const newNode: Node = {
        id: `node-${nodeId++}`,
        type: "canvasNode",
        position,
        data: parsed,
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const updateNodeSettings = useCallback(
    (nodeId: string, settings: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, settings: { ...n.data.settings, ...settings } } } : n))
      );
      setSelectedNode((prev) =>
        prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, settings: { ...prev.data.settings, ...settings } } } : prev
      );
    },
    [setNodes]
  );

  return (
    <div className="h-[calc(100vh-3rem)] w-full relative overflow-hidden bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-background"
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(240 4% 16%)" />
        <Controls
          className="!bg-card/80 !backdrop-blur-xl !border-border/50 !rounded-xl !shadow-2xl [&>button]:!bg-transparent [&>button]:!border-border/30 [&>button]:!text-muted-foreground [&>button:hover]:!bg-accent"
        />
        <MiniMap
          className="!bg-card/60 !backdrop-blur-xl !border-border/50 !rounded-xl"
          nodeColor="hsl(217 91% 60%)"
          maskColor="hsl(240 10% 3.9% / 0.7)"
        />
        <Panel position="top-left" className="!m-3">
          <NodePalette />
        </Panel>
        <Panel position="top-center" className="!m-3">
          <div className="glass-panel px-4 py-2 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-foreground">AI Creation Canvas</span>
            <span className="text-[10px] text-muted-foreground">
              {nodes.length} nodes · {edges.length} connections
            </span>
          </div>
        </Panel>
      </ReactFlow>
      <NodeInspector node={selectedNode} onSettingsChange={updateNodeSettings} onClose={() => setSelectedNode(null)} />
    </div>
  );
}
