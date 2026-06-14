import React, { useState } from 'react';
import { Code, FileJson, Copy, Check, Play, AlertCircle } from 'lucide-react';

export default function App() {
  const [javaCode, setJavaCode] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [mappingType, setMappingType] = useState('Blue Far');
  const [error, setError] = useState('');

  const handleGenerate = () => {
    try {
      setError('');
      const json = generatePathingJson(javaCode, mappingType);
      setJsonOutput(json);
    } catch (err: any) {
      setError(err.message || 'An error occurred during parsing.');
    }
  };

  const handleCopy = () => {
    if (!jsonOutput) return;
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Code className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">PedroPathing JSON Generator</h1>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={mappingType}
            onChange={(e) => setMappingType(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Blue Far">Blue Far Start</option>
            <option value="Blue Close">Blue Close Start</option>
            <option value="Red Far">Red Far Start</option>
            <option value="Red Close">Red Close Start</option>
            <option value="All Starts">All Starts</option>
          </select>
          <button 
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            Generate JSON
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800">
        <div className="bg-zinc-950 flex flex-col">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 text-sm text-zinc-400 font-medium">
            <Code className="w-4 h-4" />
            Java Autonomous Code
          </div>
          <textarea
            value={javaCode}
            onChange={(e) => setJavaCode(e.target.value)}
            placeholder="Paste your PedroPathing Java code here..."
            className="flex-1 w-full bg-transparent resize-none p-4 text-sm font-mono text-zinc-300 focus:outline-none"
            spellCheck={false}
          />
        </div>

        <div className="bg-zinc-950 flex flex-col relative">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-sm text-zinc-400 font-medium">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              Pathing JSON
            </div>
            {jsonOutput && (
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          
          {error && (
            <div className="absolute top-12 left-4 right-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <textarea
            value={jsonOutput}
            readOnly
            placeholder="Generated JSON will appear here..."
            className="flex-1 w-full bg-transparent resize-none p-4 text-sm font-mono text-zinc-300 focus:outline-none"
            spellCheck={false}
          />
        </div>
      </main>
    </div>
  );
}

function generatePathingJson(code: string, mappingType: string) {
  if (!code.trim()) {
    throw new Error("Please paste your Java code first.");
  }

  // Remove Java comments (single-line and multi-line) to prevent parsing commented-out code
  const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

  const poses: Record<string, { x: number, y: number, heading: number }> = {};
  
  // Extract Poses
  const poseRegex = /Pose\s+(\w+)\s*=\s*new\s+Pose\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*(?:Math\.toRadians\(\s*([-\d.]+)\s*\)|([-\d.]+))\s*\)/g;
  let match;
  while ((match = poseRegex.exec(cleanCode)) !== null) {
    let heading = 0;
    if (match[4]) {
      heading = parseFloat(match[4]);
    } else if (match[5]) {
      heading = parseFloat(match[5]) * (180 / Math.PI);
    }
    poses[match[1]] = {
      x: parseFloat(match[2]),
      y: parseFloat(match[3]),
      heading: heading
    };
  }

  // Extract Paths (BezierLine or BezierCurve)
  const paths: Record<string, { startPose: string, endPose: string, controlPoses: string[], startHeadingPose?: string, endHeadingPose?: string }> = {};
  
  // Legacy parsing
  const pathRegex = /(\w+)\s*=\s*new\s+Path\(\s*new\s+Bezier(?:Line|Curve)\(\s*([^)]+)\s*\)\s*\)/g;
  while ((match = pathRegex.exec(cleanCode)) !== null) {
    const args = match[2].split(',').map(s => s.trim());
    paths[match[1]] = {
      startPose: args[0],
      endPose: args[args.length - 1],
      controlPoses: args.slice(1, -1)
    };
  }

  // New buildPath parsing
  const buildPathRegex = /(\w+)\s*=\s*buildPath\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*(true|false)\s*\)/g;
  while ((match = buildPathRegex.exec(cleanCode)) !== null) {
    const pathName = match[1];
    const startPose = match[2].trim();
    const endPose = match[3].trim();
    const isConstant = match[4].trim() === 'true';
    
    paths[pathName] = {
      startPose,
      endPose,
      controlPoses: [],
      startHeadingPose: isConstant ? endPose : startPose,
      endHeadingPose: endPose
    };
  }

  // Extract Headings (for legacy parsing)
  const headingRegex = /(\w+)\.set(?:Linear|Tangent|Constant)HeadingInterpolation\(([^)]*)\)/g;
  while ((match = headingRegex.exec(cleanCode)) !== null) {
    const pathName = match[1];
    const args = match[2].split(',').map(s => s.trim());
    
    if (paths[pathName]) {
      const startMatch = args[0]?.match(/(\w+)\.getHeading\(\)/);
      const endMatch = args[1]?.match(/(\w+)\.getHeading\(\)/);
      if (startMatch) paths[pathName].startHeadingPose = startMatch[1];
      if (endMatch) paths[pathName].endHeadingPose = endMatch[1];
      else if (startMatch && !endMatch) paths[pathName].endHeadingPose = startMatch[1]; // Constant heading
    }
  }

  // Extract PathChains
  const pathChains: Record<string, string[]> = {};
  const pathChainRegex = /(\w+)\s*=\s*(?:follower\(\)\.)?pathBuilder\(\)[^;]*?\.addPaths\(([^)]+)\)[^;]*?\.build\(\)/g;
  while ((match = pathChainRegex.exec(cleanCode)) !== null) {
    const chainName = match[1];
    const constituentPaths = match[2].split(',').map(s => s.trim());
    pathChains[chainName] = constituentPaths;
  }

  // Extract Sequence
  const sequenceRegex = /(?:new\s+FollowPath|follower\(\)\.followPath)\(\s*(\w+)(?:\s*,[^)]*)?\)/g;
  const sequence: string[] = [];
  while ((match = sequenceRegex.exec(cleanCode)) !== null) {
    const name = match[1];
    if (pathChains[name]) {
      sequence.push(...pathChains[name]);
    } else {
      sequence.push(name);
    }
  }

  const baseBlueFar = {
    startPose: 'startPoseFarBlue',
    scorePoseGeneral: 'scorePoseFarBlue',
    scorePose1: 'scorePoseFarBlue',
    intakeAlign1: 'intakeAlign1Blue',
    intake1: 'intake1Blue',
    intakeAlign2: 'intakeAlign2Blue',
    intake2: 'intake2Blue',
    intakeAlign3: 'intakeAlign3Blue',
    intake3: 'intake3Blue',
    intakeAlignPlayer: 'IntakeAlignPlayerBlue',
    intakePlayer: 'IntakePlayerBlue',
    targetExitPos: 'targetExitPosFarBlue'
  };

  const baseBlueClose = {
    startPose: 'startPoseCloseBlue',
    scorePoseGeneral: 'scorePoseCloseBlue',
    scorePose1: 'scorePoseCloseBlue',
    intakeAlign1: 'intakeAlign1Blue',
    intake1: 'intake1Blue',
    intakeAlign2: 'intakeAlign2Blue',
    intake2: 'intake2Blue',
    intakeAlign3: 'intakeAlign3Blue',
    intake3: 'intake3Blue',
    intakeAlignPlayer: 'IntakeAlignPlayerBlue',
    intakePlayer: 'IntakePlayerBlue',
    targetExitPos: 'targetExitPosCloseBlue'
  };

  const mappings: Record<string, { mirror: boolean, poses: Record<string, string> }> = {
    "Blue Far": { mirror: false, poses: baseBlueFar },
    "Blue Close": { mirror: false, poses: baseBlueClose },
    "Red Far": { mirror: true, poses: baseBlueFar },
    "Red Close": { mirror: true, poses: baseBlueClose }
  };

  const mappingTypesToProcess = mappingType === "All Starts" 
    ? ["Blue Far", "Blue Close", "Red Far", "Red Close"] 
    : [mappingType];

  const createResolver = (type: string) => {
    const mappingConfig = mappings[type] || mappings["Blue Far"];
    const mapping = mappingConfig.poses;
    const shouldMirror = mappingConfig.mirror;

    return (poseName: string) => {
      const concreteName = mapping[poseName] || poseName;
      const pose = poses[concreteName];
      if (!pose) return undefined;

      if (shouldMirror) {
        // PedroPathing mirror logic:
        // x = 141.5 - x
        // y = y
        // heading = pi - heading (180 - heading in degrees)
        return {
          x: 141.5 - pose.x,
          y: pose.y,
          heading: ((180 - pose.heading) % 360 + 360) % 360
        };
      }
      return pose;
    };
  };

  // Use the first mapping type to determine the global start point
  const firstResolver = createResolver(mappingTypesToProcess[0]);
  const startPoseData = firstResolver('startPose');
  if (!startPoseData) {
    throw new Error(`Could not resolve start pose. Make sure the code contains the poses for ${mappingTypesToProcess[0]}.`);
  }

  const json: any = {
    startPoint: {
      x: startPoseData.x,
      y: startPoseData.y,
      heading: "linear",
      startDeg: startPoseData.heading,
      endDeg: startPoseData.heading,
      locked: false
    },
    lines: [],
    shapes: [
      {
        "id": "triangle-1",
        "name": "Red Goal",
        "vertices": [
          { "x": 144, "y": 70 },
          { "x": 144, "y": 144 },
          { "x": 120, "y": 144 },
          { "x": 138, "y": 119 },
          { "x": 138, "y": 70 }
        ],
        "color": "#dc2626",
        "fillColor": "#ff6b6b"
      },
      {
        "id": "triangle-2",
        "name": "Blue Goal",
        "vertices": [
          { "x": 6, "y": 119 },
          { "x": 25, "y": 144 },
          { "x": 0, "y": 144 },
          { "x": 0, "y": 70 },
          { "x": 7, "y": 70 }
        ],
        "color": "#2563eb",
        "fillColor": "#60a5fa"
      }
    ],
    sequence: [],
    settings: {
      "xVelocity": 75,
      "yVelocity": 65,
      "aVelocity": 3.141592653589793,
      "kFriction": 0.1,
      "rWidth": 18,
      "rHeight": 18,
      "safetyMargin": 1,
      "maxVelocity": 40,
      "maxAcceleration": 30,
      "maxDeceleration": 30,
      "fieldMap": "decode.webp",
      "robotImage": "/robot.png",
      "theme": "auto",
      "showGhostPaths": false,
      "showOnionLayers": false,
      "onionLayerSpacing": 3,
      "onionColor": "#dc2626",
      "onionNextPointOnly": false
    },
    version: "1.2.1",
    timestamp: new Date().toISOString()
  };

  const colors = ["#7B9B79", "#7C8AC7", "#97ACAD", "#D4A373", "#E5989B", "#B5838D", "#6D6875"];
  let colorIndex = 0;

  const lineIds: Record<string, string> = {};
  const processedPaths = new Set<string>();

  if (sequence.length === 0) {
    throw new Error("No FollowPath commands found in the sequence.");
  }

  mappingTypesToProcess.forEach((type, index) => {
    const resolvePose = createResolver(type);
    const lineIds: Record<string, string> = {};
    const processedPaths = new Set<string>();

    // If this is not the first mapping type, we need to add a "teleport" line from the end of the previous sequence to the start of this one
    if (index > 0) {
      const currentStartPose = resolvePose('startPose');
      if (currentStartPose) {
        const teleportLineId = `teleport-${Math.random().toString(36).substr(2, 9)}`;
        json.lines.push({
          id: teleportLineId,
          name: `Teleport to ${type}`,
          endPoint: {
            x: currentStartPose.x,
            y: currentStartPose.y,
            heading: "linear",
            startDeg: currentStartPose.heading,
            endDeg: currentStartPose.heading
          },
          controlPoints: [],
          color: "#00000000", // Transparent or invisible if supported
          locked: false,
          waitBeforeMs: 0,
          waitAfterMs: 0,
          waitBeforeName: "",
          waitAfterName: ""
        });
        json.sequence.push({
          kind: "path",
          lineId: teleportLineId
        });
      }
    }

    sequence.forEach((pathName) => {
      if (!paths[pathName] || processedPaths.has(pathName)) return;
      processedPaths.add(pathName);

      const pathData = paths[pathName];
      const endPoseData = resolvePose(pathData.endPose);
      const startHeadingData = pathData.startHeadingPose ? resolvePose(pathData.startHeadingPose) : null;
      const endHeadingData = pathData.endHeadingPose ? resolvePose(pathData.endHeadingPose) : null;

      if (!endPoseData) {
        console.warn(`Could not resolve end pose for path ${pathName} in ${type}`);
        return;
      }

      const controlPoints = pathData.controlPoses.map(cpName => {
        const cpData = resolvePose(cpName);
        return cpData ? { x: cpData.x, y: cpData.y } : null;
      }).filter(Boolean);

      const lineId = `line-${Math.random().toString(36).substr(2, 9)}`;
      lineIds[pathName] = lineId;

      json.lines.push({
        id: lineId,
        name: `${pathName} (${type})`,
        endPoint: {
          x: endPoseData.x,
          y: endPoseData.y,
          heading: "linear",
          startDeg: startHeadingData ? startHeadingData.heading : 0,
          endDeg: endHeadingData ? endHeadingData.heading : 0
        },
        controlPoints: controlPoints,
        color: colors[colorIndex % colors.length],
        locked: false,
        waitBeforeMs: 0,
        waitAfterMs: 0,
        waitBeforeName: "",
        waitAfterName: ""
      });

      colorIndex++;
    });

    sequence.forEach((pathName) => {
      if (lineIds[pathName]) {
        json.sequence.push({
          kind: "path",
          lineId: lineIds[pathName]
        });
        json.sequence.push({
          kind: "wait",
          id: `wait-${Math.random().toString(36).substr(2, 9)}`,
          name: "Wait",
          durationMs: 0,
          locked: false
        });
      }
    });
  });

  return JSON.stringify(json, null, 2);
}
