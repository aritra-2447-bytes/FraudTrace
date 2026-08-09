import React, { useRef, useState, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { PatternGraph } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  ShieldAlert,
  Expand,
  Shrink,
  X,
} from 'lucide-react';

interface NetworkGraphProps {
  graph: PatternGraph;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ graph }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ width: 600, height: 380 });
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoverLink, setHoverLink] = useState<any>(null);
  const [searchNode, setSearchNode] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-resize graph to fit container or fullscreen mode
  useEffect(() => {
    const updateSize = () => {
      const activeContainer = isFullscreen ? fullscreenContainerRef.current : containerRef.current;
      if (activeContainer) {
        setDimensions({
          width: activeContainer.clientWidth,
          height: activeContainer.clientHeight || (isFullscreen ? window.innerHeight - 100 : 380),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isFullscreen]);

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Memoize graphData so reference stays stable across hover/click state changes
  const graphData = useMemo(() => {
    return {
      nodes: graph.nodes.map((n) => ({
        ...n,
        val: Math.max(3, Math.min(8, (n.total_sent + n.total_received) / 100000)),
      })),
      links: graph.edges.map((e) => ({
        ...e,
        value: Math.max(1, Math.min(5, e.amount / 100000)),
      })),
    };
  }, [graph]);

  // Configure physics forces ONCE when graphData changes
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(-400); // Strong repulsion for distant nodes
      fgRef.current.d3Force('link')?.distance(120);    // Generous distance between connected nodes
      
      const timer = setTimeout(() => {
        fgRef.current?.zoomToFit(400, 30);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [graphData, isFullscreen]);

  // Format rupee amounts
  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Node color helper
  const getNodeColor = (score: number) => {
    if (score > 70) return '#ef4444'; // Red
    if (score >= 40) return '#f59e0b'; // Yellow
    return '#22c55e'; // Green
  };

  const handleFocusNode = (query: string) => {
    if (!query) return;
    const match = graphData.nodes.find((n) =>
      n.id.toLowerCase().includes(query.toLowerCase())
    );
    if (match) {
      setSelectedNode(match);
      if (fgRef.current && (match as any).x !== undefined && (match as any).y !== undefined) {
        fgRef.current.centerAt((match as any).x, (match as any).y, 500);
        fgRef.current.zoom(2.5, 500);
      }
    }
  };

  const activeDisplayNode = selectedNode || hoverNode;

  const renderGraphCanvas = (heightClass: string, isFull: boolean) => (
    <div
      ref={isFull ? fullscreenContainerRef : containerRef}
      className={`relative w-full ${heightClass} ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1117] border-[#2a2d3e]'
      } rounded-lg border overflow-hidden transition-colors`}
    >
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        cooldownTicks={120}
        nodeLabel={(node: any) => `${node.id} (${node.role || 'Account'})`}
        nodeColor={(node: any) => getNodeColor(node.risk_score)}
        nodeRelSize={4}
        linkWidth={(link: any) => Math.max(1, Math.min(3, link.amount / 100000))}
        linkColor={() => (isLight ? 'rgba(79, 70, 229, 0.55)' : 'rgba(99, 102, 241, 0.45)')}
        linkDirectionalParticles={0}
        onNodeHover={(node) => setHoverNode(node)}
        onNodeClick={(node) => setSelectedNode(node)}
        onBackgroundClick={() => setSelectedNode(null)}
        onLinkHover={(link) => setHoverLink(link)}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.id;
          const fontSize = Math.max(8 / globalScale, 2.5);
          // Small, concise node radius (4px to 8px max)
          const radius = Math.max(4, Math.min(8, (node.total_sent + node.total_received) / 150000));

          const isHighlighted =
            (searchNode && node.id.toLowerCase().includes(searchNode.toLowerCase())) ||
            (selectedNode && selectedNode.id === node.id);

          // Node Outer Glow / Highlight
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + (isHighlighted ? 3 : 1.5), 0, 2 * Math.PI, false);
          ctx.fillStyle = isHighlighted
            ? isLight ? 'rgba(79, 70, 229, 0.3)' : 'rgba(255, 255, 255, 0.9)'
            : isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(0, 0, 0, 0.4)';
          ctx.fill();

          // Node Circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = getNodeColor(node.risk_score);
          ctx.fill();
          ctx.strokeStyle = isHighlighted
            ? isLight ? '#4f46e5' : '#ffffff'
            : isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = isHighlighted ? 2 : 0.8;
          ctx.stroke();

          // Label text underneath node
          ctx.font = `${fontSize}px Arial, Helvetica, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isLight ? '#1e293b' : '#f1f5f9';
          ctx.fillText(label, node.x, node.y + radius + fontSize + 2);
        }}
      />

      {/* Node Info Card (Shown on Hover or Click Selection) */}
      {activeDisplayNode && (
        <div
          className={`absolute top-3 left-3 backdrop-blur-md p-3.5 rounded-lg shadow-2xl text-xs space-y-1.5 z-20 min-w-[220px] transition-colors ${
            isLight
              ? 'bg-white/95 text-slate-800 border border-slate-200'
              : 'bg-[#1a1d2e]/95 text-slate-100 border border-[#2a2d3e]'
          }`}
        >
          <div className="font-mono font-bold flex items-center justify-between">
            <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {activeDisplayNode.id}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="px-2 py-0.5 text-[10px] rounded font-bold"
                style={{
                  backgroundColor: `${getNodeColor(activeDisplayNode.risk_score)}20`,
                  color: getNodeColor(activeDisplayNode.risk_score),
                }}
              >
                Risk: {activeDisplayNode.risk_score}/100
              </span>
              {selectedNode && (
                <button
                  onClick={() => setSelectedNode(null)}
                  className={`p-0.5 cursor-pointer rounded transition-colors ${
                    isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-[#2a2d3e]'
                  }`}
                  title="Unpin Card"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {activeDisplayNode.account_name && (
            <div className="text-indigo-600 font-medium">{activeDisplayNode.account_name}</div>
          )}
          <div className={`${isLight ? 'text-slate-600' : 'text-slate-400'} text-[11px] font-mono`}>
            Role: <span className={isLight ? 'text-slate-900 font-semibold' : 'text-slate-200'}>{activeDisplayNode.role || 'Participant'}</span>
          </div>
          <div className={`${isLight ? 'text-slate-600' : 'text-slate-400'} text-[11px] font-mono`}>
            Total Sent: <span className="text-red-500 font-semibold">{formatRupees(activeDisplayNode.total_sent)}</span>
          </div>
          <div className={`${isLight ? 'text-slate-600' : 'text-slate-400'} text-[11px] font-mono`}>
            Total Received: <span className="text-emerald-600 font-semibold">{formatRupees(activeDisplayNode.total_received)}</span>
          </div>

          {selectedNode && (
            <div className={`pt-1 text-[10px] font-mono border-t ${isLight ? 'text-indigo-600 border-slate-200' : 'text-indigo-300 border-[#2a2d3e]'}`}>
              📌 Node selected. Click background to deselect.
            </div>
          )}
        </div>
      )}

      {/* Link Hover Tooltip Card */}
      {hoverLink && !activeDisplayNode && (
        <div
          className={`absolute top-3 left-3 backdrop-blur-md p-3 rounded-lg shadow-xl text-xs space-y-1 pointer-events-none z-20 min-w-[220px] transition-colors ${
            isLight
              ? 'bg-white/95 text-slate-800 border border-slate-200'
              : 'bg-[#1a1d2e]/95 text-slate-100 border border-[#2a2d3e]'
          }`}
        >
          <div className="font-mono font-bold text-indigo-600">
            Transfer: {hoverLink.source.id || hoverLink.source} → {hoverLink.target.id || hoverLink.target}
          </div>
          <div className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
            Amount: <span className="text-emerald-600">{formatRupees(hoverLink.amount)}</span>
          </div>
          <div className={`${isLight ? 'text-slate-500' : 'text-slate-400'} text-[11px] font-mono`}>
            Timestamp: {new Date(hoverLink.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {/* Graph Legend */}
      <div
        className={`absolute bottom-3 right-3 p-2 rounded-lg text-[10px] flex items-center gap-3 backdrop-blur-xs transition-colors ${
          isLight
            ? 'bg-white/90 border border-slate-200 text-slate-700 shadow-sm'
            : 'bg-[#1a1d2e]/90 border border-[#2a2d3e] text-slate-300'
        }`}
      >
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
          <span>High Risk (&gt;70)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span>Medium (40-70)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Low (&lt;40)</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Standard In-Page Component */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 flex flex-col relative transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#161926] border-[#232738]'
        }`}
      >
        {/* Header & Controls */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-2 border-b ${
            isLight ? 'border-slate-200' : 'border-[#232738]'
          }`}
        >
          <div>
            <h3 className={`text-sm font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              <ShieldAlert className="w-4 h-4 text-indigo-500" />
              <span>Interactive Account Transaction Topology</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Nodes = Accounts (color by risk score) | Edges = Transfer Amount
            </p>
          </div>

          {/* Search & Fullscreen Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Highlight Account..."
                value={searchNode}
                onChange={(e) => {
                  setSearchNode(e.target.value);
                  if (e.target.value) handleFocusNode(e.target.value);
                }}
                className={`border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 w-full sm:w-40 transition-colors min-h-[36px] ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-[#0f1117] border-[#232738] text-slate-200 placeholder-slate-500'
                }`}
              />
            </div>

            <button
              onClick={() => setIsFullscreen(true)}
              title="Full Screen View"
              className="px-3 h-9 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-500 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-bold whitespace-nowrap min-h-[36px]"
            >
              <Expand className="w-4 h-4 text-indigo-500" />
              <span className="inline">Expand</span>
            </button>
          </div>
        </div>

        {/* Normal Canvas */}
        {!isFullscreen && renderGraphCanvas('h-[380px]', false)}
      </div>

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div
          className={`fixed inset-0 z-50 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-between animate-in fade-in duration-200 ${
            isLight ? 'bg-slate-100/95 text-slate-900' : 'bg-[#0f1117]/95 text-slate-100'
          }`}
        >
          <div
            className={`flex items-center justify-between pb-3 border-b p-3 rounded-xl mb-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1a1d2e] border-[#2a2d3e]'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className={`text-base font-bold font-mono ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Full Screen Account Transaction Topology
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Press{' '}
                  <kbd
                    className={`px-1.5 py-0.5 border rounded font-mono text-[10px] ${
                      isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-[#0f1117] border-[#2a2d3e] text-indigo-300'
                    }`}
                  >
                    Esc
                  </kbd>{' '}
                  or click exit to close full screen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Highlight Account..."
                  value={searchNode}
                  onChange={(e) => {
                    setSearchNode(e.target.value);
                    if (e.target.value) handleFocusNode(e.target.value);
                  }}
                  className={`border rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 w-44 transition-colors ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-[#0f1117] border-[#2a2d3e] text-slate-200 placeholder-slate-500'
                  }`}
                />
              </div>

              <button
                onClick={() => setIsFullscreen(false)}
                title="Exit Full Screen"
                className="px-3 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-600 font-mono font-bold text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Shrink className="w-4 h-4" />
                <span>Exit Full Screen</span>
              </button>
            </div>
          </div>

          <div className="flex-grow w-full overflow-hidden relative">
            {renderGraphCanvas('h-full', true)}
          </div>
        </div>
      )}
    </>
  );
};


