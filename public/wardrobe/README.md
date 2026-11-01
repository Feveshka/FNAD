# 01-L1-0161 — browser parameters

Import `source/asset.mjs`, inspect `parameterSchema`, and call **await asset.updateParams(patch)**. All published controls execute in the browser with Three.js. Do not implement dimension controls by scaling the asset root.

```js
import {createAsset, parameterSchema} from './source/asset.mjs';
const asset = await createAsset(THREE);
scene.add(asset);
console.log(parameterSchema, asset.getParams());
// On slider input: await asset.updateParams({[parameterName]: Number(slider.value)});
// Restore defaults: await asset.resetParams();
// State switching is asynchronous: await asset.setState(stateName);
// On removal: await asset.dispose();
```

Serve the entire directory over HTTP(S). The host supplies Three.js (tested r170).
`parameters.json` describes types, units, defaults and ranges. Unknown keys, NaN,
noninteger counts and out-of-range values are rejected. Each instance owns editable
geometry and materials; resource sharing never shares editable geometry.

## Execution and limits

The browser evaluates vertex response coefficients compiled from the native generator.
This is a numerical approximation, not a Python interpreter or an exact port of every
native formula. `response.json` records independent axis and simultaneous-parameter
comparisons, with a 0.5 mm sampled maximum vertex error acceptance threshold. Finite
samples do not establish a whole-domain bound. Existing UV/PBR textures are retained;
this does not regenerate Blender procedural textures. Native-only fields are listed
in `fixedNativeOnly` in response.json. Do not create controls for absent fields.

Dimensions are metres, angles follow each schema unit. Sofa auto mode derives cushion
count from usable width and target seat width; explicit count switches to manual.
The model-space geometry remains Z-up; createAsset converts to Y-up by default.
