# Java2PedroPathingWeb

Java2PedroPathingWeb is a web-based utility designed to convert FTC PedroPathing Java autonomous code into JSON format compatible with the PedroPathing visualizer. 

## Features

- **Java to JSON Conversion**: Instantly converts your PedroPathing Java code into the standard Pathing JSON.
- **Multiple Start Configurations**: 
  - Blue Far Start
  - Blue Close Start
  - Red Far Start
  - Red Close Start
  - All Starts (generates paths for all configurations simultaneously, inserting teleport points between them)
- **Automatic Mirroring**: Accurately applies PedroPathing's `.mirror()` logic when Red alliance starts are selected (mirrors across a 141.5-inch field length).
- **Supports PathChains**: Extracts and connects paths generated using the `follower().pathBuilder().addPaths(...).build()` methodology.
- **Support for buildPath Helper**: Recognizes custom `buildPath(from, to, constantHeadingInterpolation)` functions.
- **Comments Ignored**: Built-in stripping of single (`//`) and multi-line (`/* */`) comments to avoid bugs involving commented-out code.
- **One-Click Copy**: Copy the generated JSON to your clipboard with a single click and paste it directly into your pathing visualizer.

## Usage

1. Open the [Java2PedroPathingWeb](https://jeffreyl-3.github.io/Java2PedroPathingWeb/) application (assuming it is deployed on GitHub Pages).
2. Paste your FTC PedroPathing Java Autonomous code into the left text area (`Java Autonomous Code`).
3. Select your desired start position mapping from the top right dropdown (e.g., `Blue Far Start`).
4. Click the **Generate JSON** button.
5. The corresponding JSON points will be presented in the right text area. Click **Copy** to copy the JSON to your clipboard.
6. Open your PedroPathing visualizer and import or paste the generated JSON.

## Supported Java Parsing Formats

The tool uses Regex to extract poses and paths. Ensure your Java code uses standard formatting for accurate parsing:

- **Poses**: `Pose name = new Pose(x, y, Math.toRadians(heading))` or raw radians.
- **Paths**: `Path name = new Path(new BezierLine(startPose, endPose))`
- **BuildPath Helper**: `Path name = buildPath(startPose, endPose, boolean)`
- **PathChains**: `PathChain name = follower().pathBuilder().addPaths(path1, path2).build()`
- **Interpolations**: `path.setLinearHeadingInterpolation(...)`, `path.setConstantHeadingInterpolation(...)`
- **Follow Commands**: `new FollowPath(path)` or `follower().followPath(path)`

## Setup and Development

1. Clone this repository.
2. Ensure you have Node.js version 20+ installed.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Build the project:
   ```bash
   npm run build
   ```

## Deployment

This tool is configured to automatically deploy to GitHub Pages upon pushing to the `main` branch via GitHub Actions (`.github/workflows/deploy.yml`).
