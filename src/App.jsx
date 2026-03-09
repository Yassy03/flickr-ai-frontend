import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  Controls, applyNodeChanges, applyEdgeChanges, addEdge,
  ReactFlowProvider, useReactFlow, Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400&display=swap');

  body {
    margin: 0; padding: 0; overflow: hidden;
    background-color: #fff;
    background-image: radial-gradient(circle, #c8c8c8 1px, transparent 1px);
    background-size: 24px 24px;
  }

  * {
    font-family: 'DM Sans', Helvetica, Arial, sans-serif !important;
    font-weight: 400 !important;
    font-size: 14px;
    text-transform: lowercase;
    -webkit-font-smoothing: antialiased;
    box-sizing: border-box;
  }
  
  /* NEW: Allow strong tags to be bold */
  strong { font-weight: 700 !important; }

  .canvas-label {
    position: absolute;
    z-index: 10;
    font-size: 18px !important;
    color: rgba(0,0,0,0.8);
    pointer-events: none;
    letter-spacing: 0.02em;
    line-height: 1;
    text-transform: lowercase;
    font-weight: 500 !important;
  }

  /* ── Panel UI: title + buttons, top-right of right panel ── */
  .panel-ui {
    position: absolute;
    top: 28px;        
    right: 20px;
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    pointer-events: none;
    gap: 2px;         
  }
  .panel-ui > * { pointer-events: all; }

  .main-title {
    font-family: 'Share Tech Mono', monospace !important;
    font-weight: 400 !important;
    font-size: clamp(48px, 8vw, 96px);
    line-height: 0.85;
    letter-spacing: 0.15em;
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    text-shadow: none !important;
    text-transform: lowercase !important;
    text-align: right;
    margin: 0 0 6px 0;  
    padding: 0;
    white-space: nowrap;
  }

  .howto-btn, .category-btn {
    background: none; border: none; padding: 0;
    cursor: pointer; color: #000; font-size: 14px;
    text-transform: lowercase; outline: none; box-shadow: none;
    text-align: right; display: block; line-height: 1.6;
    margin: 0 14px 0 0; /* UPDATED: Pulled inwards by 14px to align with the 'a' in the title */
  }
  .howto-btn:hover, .category-btn:hover { opacity: 0.4; }

  .react-flow, .react-flow__renderer,
  .react-flow__zoompane, .react-flow__pane,
  .react-flow__container { background: transparent !important; }
  .react-flow__background { display: none !important; }

  .react-flow__node-default {
    border: 2px solid #000 !important; border-radius: 0 !important;
    box-shadow: none !important; background: #000 !important;
    color: #fff !important; text-transform: lowercase !important; padding: 8px 12px !important;
  }
  .react-flow__node-imageNode {
    border: none !important; border-radius: 0 !important;
    box-shadow: none !important; outline: none !important;
    background: transparent !important; padding: 0 !important; margin: 0 !important;
  }
  .react-flow__node-imageNode.selected,
  .react-flow__node-imageNode:focus,
  .react-flow__node-imageNode:focus-within {
    border: none !important; box-shadow: none !important; outline: none !important;
  }
  .react-flow__handle {
    width: 10px !important; height: 10px !important;
    background: #000 !important; border: none !important;
    border-radius: 50% !important; box-shadow: none !important; outline: none !important;
  }

  /* ── Glass overlays ── */
  .glass-overlay {
    position: absolute; inset: 0; z-index: 200;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  }
  
  /* NEW: Anchor the concept pop-up to the left of the screen */
  .glass-overlay-left {
    position: fixed; inset: 0; z-index: 1000;
    display: flex; align-items: center; justify-content: flex-start;
    padding-left: 60px;
    pointer-events: none;
  }

  .glass-card {
    position: relative; pointer-events: all;
    width: min(420px, 85%); padding: 44px 48px; border-radius: 20px;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(28px) saturate(160%);
    -webkit-backdrop-filter: blur(28px) saturate(160%);
    border: 1px solid rgba(255,255,255,0.5);
    box-shadow: 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
  }
  .glass-card p {
    margin: 0; font-size: 15px !important; line-height: 1.75;
    color: #111; text-align: left; text-transform: lowercase;
  }
  
  /* NEW: Override the global lowercase rule just for the concept text */
  .concept-text * {
    text-transform: none !important;
  }
  .concept-title {
    font-family: 'Share Tech Mono', monospace !important;
    font-size: 28px !important;
    margin: 0 0 24px 0;
    color: #000;
    text-transform: lowercase !important;
    font-weight: 400 !important;
  }

  .glass-close {
    position: absolute; top: 18px; right: 22px;
    background: none; border: none; font-size: 18px;
    cursor: pointer; color: rgba(0,0,0,0.3); line-height: 1; padding: 0;
  }
  .glass-close:hover { color: #000; }

  /* ── Score panel ── */
  .glass-score {
    position: absolute; top: 40px; left: 40px; z-index: 50;
    padding: 20px 24px; border-radius: 16px; width: 340px;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(28px) saturate(160%);
    -webkit-backdrop-filter: blur(28px) saturate(160%);
    border: 1px solid rgba(255,255,255,0.5);
    box-shadow: 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
    display: flex; flex-direction: column; gap: 12px;
    animation: fadeIn 0.4s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .score-header {
    display: flex; justify-content: space-between; align-items: flex-end; width: 100%;
  }
  .score-title { font-size: 14px !important; color: #000; line-height: 1.3; }
  .score-value {
    font-size: 14px !important; color: #000;
    font-family: 'Share Tech Mono', monospace !important;
  }
  .score-bar-wrapper {
    width: 100%; height: 14px;
    border: 1px solid #000; border-radius: 10px; padding: 2px;
  }
  .score-bar-fill {
    height: 100%; background: #000; border-radius: 6px;
    transition: width 2s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .receipt-container {
    margin-top: 12px; padding-top: 16px;
    border-top: 1px dashed rgba(0,0,0,0.3);
    display: flex; flex-direction: column; gap: 12px;
    max-height: 300px; overflow-y: auto;
  }
  .receipt-item {
    font-family: 'Share Tech Mono', monospace !important;
    font-size: 11px !important; color: rgba(0,0,0,0.8); line-height: 1.4;
  }
  .receipt-cat-name { font-weight: 600 !important; color: #000; }
  .receipt-stat { margin-left: 8px; color: rgba(0,0,0,0.6); }
  .receipt-endorsement {
    font-size: 13px !important; color: rgba(0,0,0,0.9);
    margin-top: 12px; text-align: center;
    border-top: 1px dashed rgba(0,0,0,0.3); padding-top: 12px;
  }

  /* ── Category modal ── */
  .cat-label {
    display: block; font-size: 13px !important;
    color: rgba(0,0,0,0.45); margin-bottom: 12px; letter-spacing: 0.04em;
  }
  .cat-input {
    width: 100%; background: transparent; border: none;
    border-bottom: 1px solid rgba(0,0,0,0.2); outline: none;
    font-size: 18px !important; color: #000; padding: 6px 0 10px 0;
    caret-color: #000; text-transform: lowercase;
  }
  .cat-input:focus { border-bottom-color: #000; }
  .cat-actions {
    display: flex; justify-content: flex-end; gap: 24px; margin-top: 28px;
  }
  .cat-cancel, .cat-create {
    background: none; border: none; padding: 0;
    cursor: pointer; font-size: 14px !important;
    outline: none; box-shadow: none; text-transform: lowercase;
  }
  .cat-cancel { color: rgba(0,0,0,0.4); }
  .cat-cancel:hover { color: #000; }
  .cat-create { color: #000; }
  .cat-create:hover { opacity: 0.5; }

  .divider {
    position: relative; z-index: 200; flex-shrink: 0;
    width: 2px; height: 50vh; align-self: center;
    background: #000; cursor: col-resize;
  }
  .divider::before {
    content: ''; position: absolute; top: 0; left: -8px;
    width: 18px; height: 100%;
  }
`;

const HOWTO_TEXT = `a schema is a mental representation we have of the world, based on semantic associations. every object, item or model we perceive has an existing schema within our minds — where one object may have hundreds of subconscious associations.

to play, connect the ungrouped images on the right side of the canvas. group images by their relative associations — they only have to make sense to you. add a category name to label these groups; you can make as many as you like.

once completed, assess how closely your similarity grouping of the images matches their mathematical truth.`;

const ImageNode = ({ data }) => (
  <div style={{ position: 'relative', background: 'transparent', border: 'none', padding: 0, margin: 0, lineHeight: 0, display: 'inline-block' }}>
    <Handle type="target" position={Position.Top}
      style={{ background: '#000', border: 'none', width: 10, height: 10, borderRadius: '50%', boxShadow: 'none' }} />
    <img src={data.src} alt="" style={{ display: 'block', width: data.width || 150, border: 'none', outline: 'none', boxShadow: 'none' }} />
    <Handle type="source" position={Position.Bottom}
      style={{ background: '#000', border: 'none', width: 10, height: 10, borderRadius: '50%', boxShadow: 'none' }} />
  </div>
);

function computeFitViewport(nodes, width, height, padding = 80) {
  if (!nodes.length) return { x: 0, y: 0, zoom: 1 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => {
    minX = Math.min(minX, n.position.x); minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + 160); maxY = Math.max(maxY, n.position.y + 160);
  });
  const cW = maxX - minX, cH = maxY - minY;
  const zoom = Math.min((width - padding * 2) / cW, (height - padding * 2) / cH, 1);
  return {
    x: padding - minX * zoom + (width - padding * 2 - cW * zoom) / 2,
    y: padding - minY * zoom + (height - padding * 2 - cH * zoom) / 2,
    zoom,
  };
}

function LeftFlow({ nodes, edges, onNodesChange, onEdgesChange, containerWidth }) {
  const { setViewport } = useReactFlow();
  const memoizedNodeTypes = useMemo(() => ({ imageNode: ImageNode }), []);
  useEffect(() => {
    if (nodes.length > 0 && containerWidth > 0)
      setViewport(computeFitViewport(nodes, containerWidth, window.innerHeight), { duration: 0 });
  }, [nodes.length, containerWidth, setViewport]);
  return (
    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      nodeTypes={memoizedNodeTypes} minZoom={0.05} maxZoom={2}>
      <Controls />
    </ReactFlow>
  );
}

function RightFlow({ nodes, edges, onNodesChange, onEdgesChange, onConnect }) {
  const memoizedNodeTypes = useMemo(() => ({ imageNode: ImageNode }), []);
  return (
    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      onConnect={onConnect} nodeTypes={memoizedNodeTypes} fitView minZoom={0.05} maxZoom={2}>
      <Controls />
    </ReactFlow>
  );
}

export default function App() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [humanNodes, setHumanNodes] = useState([]);
  const [humanEdges, setHumanEdges] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [isConceptOpen, setIsConceptOpen] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiMapping, setAiMapping] = useState({});
  const [accuracyScore, setAccuracyScore] = useState(0);
  const [scorePanelVisible, setScorePanelVisible] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);
  const [scoreLogs, setScoreLogs] = useState([]);
  const humanFlowInstance = useRef(null);

  useEffect(() => {
    fetch('https://yazzy1709-flickr-ai-backend.hf.space/api/cluster-images')
      .then(r => r.json())
      .then(data => {
        const newNodes = [], newEdges = [], newHumanNodes = [];
        const newAiMapping = {};
        const COLS = 3, COL_W = 700, ROW_H = 600;
        let gi = 0;
        Object.keys(data.clusters).forEach((clusterId, ci) => {
          const col = ci % COLS, row = Math.floor(ci / COLS);
          const bX = col * COL_W, bY = row * ROW_H;
          const labelId = `label-${clusterId}`;
          const urls = data.clusters[clusterId];
          newNodes.push({
            id: labelId, type: 'default',
            position: { x: bX + 220, y: bY + 320 },
            zIndex: 1000,
            data: { label: data.labels[clusterId] },
            style: { background: '#FF0000', color: '#fff', padding: '12px 18px', border: '2px solid #000', borderRadius: 0, fontSize: '18px', fontWeight: 'bold' }
          });
          urls.forEach((url, ii) => {
            newAiMapping[url] = clusterId;
            const imgId = `img-${clusterId}-${ii}`;
            const ox = (ii % 3) * 190 + (Math.random() * 30 - 15);
            const oy = Math.floor(ii / 3) * 190 - 240 + (Math.random() * 30 - 15);
            newNodes.push({ id: imgId, type: 'imageNode', position: { x: bX + ox, y: bY + 320 + oy }, data: { src: url, width: 150 } });
            newEdges.push({ id: `e-${imgId}`, source: imgId, target: labelId, style: { stroke: '#000', strokeWidth: 1.5 } });
            newHumanNodes.push({ id: `h-${gi}`, type: 'imageNode', position: { x: gi * 50 + 40, y: gi * 50 + 80 }, zIndex: gi, data: { src: url, width: 180 } });
            gi++;
          });
        });
        setNodes(newNodes); setEdges(newEdges); setHumanNodes(newHumanNodes);
        setAiMapping(newAiMapping); setLoading(false);
      })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = e => {
      const w = (e.clientX / window.innerWidth) * 100;
      if (w >= 10 && w <= 90) setLeftWidth(w);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isDragging]);

  const onNodesChange = useCallback(c => setNodes(n => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback(c => setEdges(e => applyEdgeChanges(c, e)), []);
  const onHNChange = useCallback(c => setHumanNodes(n => applyNodeChanges(c, n)), []);
  const onHEChange = useCallback(c => setHumanEdges(e => applyEdgeChanges(c, e)), []);
  const onConnect = useCallback(p => setHumanEdges(e => addEdge({ ...p, style: { stroke: '#000', strokeWidth: 1.5 } }, e)), []);

  const addCategory = () => {
    const name = (categoryInput.trim() || 'new category').toLowerCase();
    let spawnPosition = { x: 600, y: 100 };
    if (humanFlowInstance.current) {
      spawnPosition = humanFlowInstance.current.project({
        x: (window.innerWidth - containerWidth) / 2,
        y: window.innerHeight / 2,
      });
    }
    setHumanNodes(n => [...n, {
      id: `cat-${Date.now()}`, type: 'default',
      position: spawnPosition,
      zIndex: 1000,
      data: { label: name },
      style: { background: '#000', color: '#fff', padding: '12px 18px', border: '2px solid #000', borderRadius: 0, fontSize: '18px', fontWeight: 'bold' }
    }]);
    setCategoryInput(''); setIsModalOpen(false);
  };

  const runAccuracyTest = () => {
    let correctCount = 0;
    const totalImages = Object.keys(aiMapping).length;
    if (totalImages === 0) return;
    const humanCategories = humanNodes.filter(n => n.id.startsWith('cat-'));
    const newLogs = [];
    if (humanCategories.length === 0) {
      newLogs.push({ name: "SYSTEM ALERT", isError: true, message: "no categories detected." });
    }
    humanCategories.forEach(catNode => {
      const catName = catNode.data.label;
      const connectedEdges = humanEdges.filter(e => e.target === catNode.id || e.source === catNode.id);
      const connectedImageIds = connectedEdges.map(e => e.target === catNode.id ? e.source : e.target);
      const connectedUrls = humanNodes
        .filter(n => connectedImageIds.includes(n.id) && n.type === 'imageNode')
        .map(n => n.data.src);
      if (connectedUrls.length > 0) {
        const clusterCounts = {};
        connectedUrls.forEach(url => {
          const aiCluster = aiMapping[url];
          clusterCounts[aiCluster] = (clusterCounts[aiCluster] || 0) + 1;
        });
        let maxCount = 0, dominantCluster = null;
        for (const [cluster, count] of Object.entries(clusterCounts)) {
          if (count > maxCount) { maxCount = count; dominantCluster = cluster; }
        }
        correctCount += maxCount;
        newLogs.push({ name: catName, total: connectedUrls.length, matched: maxCount, clusterId: parseInt(dominantCluster) + 1 });
      } else {
        newLogs.push({ name: catName, isError: true, message: "no images wired." });
      }
    });
    const percentage = Math.round((correctCount / totalImages) * 100);
    setAccuracyScore(percentage);
    setScoreLogs(newLogs);
    setScorePanelVisible(true);
    setAnimateScore(false);
    setTimeout(() => setAnimateScore(true), 50);
  };

  const containerWidth = (leftWidth / 100) * window.innerWidth;

  return (
    <>
      <style>{globalStyles}</style>

      {/* NEW: Placed the Left Concept modal here so it overlays the entire screen easily */}
      {isConceptOpen && (
        <div className="glass-overlay-left">
          <div className="glass-card concept-text" style={{ width: 'min(580px, 85%)', maxHeight: '85vh', overflowY: 'auto' }}>
            <button className="glass-close" onClick={() => setIsConceptOpen(false)}>×</button>
            <h2 className="concept-title">+ concept</h2>
            <p style={{ marginBottom: '1.4em' }}>
              Understanding where meaning lies within images is fundamental to their role within visual culture. Humans process images semantically, driven by our own unique mental schemas—frameworks built from a lifetime of subjective representations and associations.
            </p>
            <p style={{ marginBottom: '1.4em' }}>
              For a machine, meaning does not exist in memories, but in geometry. It is understood through the mathematical distance between specific coordinates within a 512-dimensional universe.
            </p>
            <p style={{ marginBottom: '1.4em' }}>
              <strong>Schema</strong> is an interactive tool that demonstrates how these systems of understanding differ between an AI and a human, and how varying associations between images can be represented visually.
            </p>
            <p style={{ marginBottom: '1.4em' }}>
              On the <strong>left</strong> side, an AI model (CLIP) calculates the mathematical similarity between images by comparing their vector distances using cosine similarity, and grouping them via K-Means clustering. This represents the mathematical truth of similarity, where meaning is defined purely by spatial relationships to create an AI's schema.
            </p>
            <p style={{ marginBottom: '1.4em' }}>
              On the <strong>right</strong> side, users are invited to create their own semantically similar clusters, grouping together images they feel categorically align with one another based on human intuition.
            </p>
            <p style={{ marginBottom: 0 }}>
              After creating categories and wiring the connections, users can test their subjective semantic understanding against the AI's mathematical baseline. Ultimately, <strong>Schema</strong> is designed to interactively reveal the inner workings of computer vision—holding the machine's universal geometry against our own individual truths.
            </p>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', width: '100vw', height: '100vh',
        cursor: isDragging ? 'col-resize' : 'default',
        userSelect: isDragging ? 'none' : 'auto',
      }}>

        {/* LEFT */}
        <div style={{ width: `${leftWidth}%`, height: '100%', position: 'relative', overflow: 'hidden' }}>
          <span className="canvas-label" style={{ bottom: 48, left: '50%', transform: 'translateX(-50%)' }}>machine schema</span>

          {scorePanelVisible && (
            <div className="glass-score">
              <button className="glass-close" onClick={() => setScorePanelVisible(false)}>×</button>

              <div className="score-header">
                <div className="score-title">schematic accuracy<br/>(according to CLIP)</div>
                <div className="score-value">{animateScore ? `${accuracyScore}%` : '0%'}</div>
              </div>
              <div className="score-bar-wrapper">
                <div className="score-bar-fill" style={{ width: animateScore ? `${accuracyScore}%` : '0%' }} />
              </div>
              {scoreLogs.length > 0 && (
                <div className="receipt-container">
                  {scoreLogs.map((log, i) => (
                    <div key={i} className="receipt-item">
                      {log.isError ? (
                        <>
                          <div className="receipt-cat-name">&gt; category: [{log.name}]</div>
                          <div className="receipt-stat" style={{ color: '#FF0000' }}>{log.message}</div>
                        </>
                      ) : (
                        <>
                          <div className="receipt-cat-name">&gt; category: [{log.name}]</div>
                          <div className="receipt-stat">math similarity: aligned w/ cluster {log.clusterId}</div>
                          <div className="receipt-stat">human accuracy: {log.matched}/{log.total} matches</div>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="receipt-endorsement">
                    end of schematic breakdown.<br/>assessment complete.
                  </div>
                </div>
              )}
            </div>
          )}

          {loading
            ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <p style={{ fontFamily: 'Share Tech Mono, monospace', letterSpacing: '0.1em' }}>[ fetching data... ]</p>
              </div>
            : <ReactFlowProvider>
                <LeftFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} containerWidth={containerWidth} />
              </ReactFlowProvider>
          }
        </div>

        {/* DIVIDER */}
        <div className="divider" onMouseDown={e => { e.preventDefault(); setIsDragging(true); }} />

        {/* RIGHT */}
        <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
          <span className="canvas-label" style={{ top: 72, left: 44 }}>your schema</span>

          <div className="panel-ui">
            <h1 className="main-title">schema</h1>
            <button className="howto-btn" onClick={() => setIsConceptOpen(true)}>+ concept</button>
            <button className="howto-btn" onClick={() => setIsHowToOpen(true)}>+ how to play</button>
            {!loading && (
              <>
                <button className="category-btn" onClick={() => setIsModalOpen(true)}>+ category</button>
                <button className="category-btn" onClick={runAccuracyTest}>+ run test</button>
              </>
            )}
          </div>

          {isHowToOpen && (
            <div className="glass-overlay-left">
              <div className="glass-card concept-text" style={{ width: 'min(580px, 85%)', maxHeight: '85vh', overflowY: 'auto' }}>
                <button className="glass-close" onClick={() => setIsHowToOpen(false)}>×</button>
                <h2 className="concept-title">+ how to play</h2>
                
                <p style={{ marginBottom: '1.4em' }}>
                  <strong>1. Group:</strong> Explore the ungrouped images on the right side of the canvas. Group them together by their relative associations—they only have to make sense to you.
                </p>
                <p style={{ marginBottom: '1.4em' }}>
                  <strong>2. Label:</strong> Click the <strong>+ category</strong> button to generate a text node. Add a category name to label your groups. You can make as many as you like.
                </p>
                <p style={{ marginBottom: '1.4em' }}>
                  <strong>3. Connect:</strong> Wire the images to your categories by clicking and dragging the connection lines from the black dots on each image to their respective label.
                </p>
                <p style={{ marginBottom: 0 }}>
                  <strong>4. Assess:</strong> Once your schema is fully connected, click <strong>+ run test</strong>. Assess how closely your subjective similarity grouping of the images matches their mathematical truth.
                </p>
              </div>
            </div>
          )}

          {isModalOpen && (
            <div className="glass-overlay">
              <div className="glass-card">
                <button className="glass-close" onClick={() => { setIsModalOpen(false); setCategoryInput(''); }}>×</button>
                <span className="cat-label">category name</span>
                <input className="cat-input" type="text" autoFocus value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                  placeholder="type a name..." />
                <div className="cat-actions">
                  <button className="cat-cancel" onClick={() => { setIsModalOpen(false); setCategoryInput(''); }}>cancel</button>
                  <button className="cat-create" onClick={addCategory}>create</button>
                </div>
              </div>
            </div>
          )}

          {loading
            ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <p style={{ fontFamily: 'Share Tech Mono, monospace', letterSpacing: '0.1em', color: '#999' }}>[ awaiting pool... ]</p>
              </div>
            : <ReactFlowProvider>
                <RightFlow nodes={humanNodes} edges={humanEdges} onNodesChange={onHNChange} onEdgesChange={onHEChange} onConnect={onConnect} ref={humanFlowInstance} />
              </ReactFlowProvider>
          }
        </div>

      </div>
    </>
  );
}