import {orientation} from './orientation.mjs';
export {orientation};
import {openAsset} from './loader.mjs';
// Runtime bundled into every asset.mjs. The application supplies its installed THREE.
// Compressed resources are relative files; serve this entire directory over HTTP(S).
export const metadata = Object.freeze({orientation,"schema":"asset-web-module/1","itemId":"01-L1-0161","name":"Mirrored two-door wardrobe with three drawers","defaultState":"closed","sourceUpAxis":"Z","units":"metres","geometryEncoding":"float32-le-base64","textureEncoding":"lossless-png","profile":"STATE","unifiedMaterials":{"d3f5eb7d18754ff595f4fe70e77a1c3a67374d1dce23bfdf55b08f963d1e97b6":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"6f6a1be7ac643abb5a07f51de55ebd0948d835cdc20e9b43ea6ef706419de6e8":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"c74594f3a48bb41794b153583c803310d60121d460f65d8bc15a64c5624e34fb":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"85dc400da880149aabe25cc6a63ac06f55f857bb96513706c7984677646b5b7a":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"0cf877276e35576648e029be975ab1ff01e1e7d7734449acd0d14e8f62559bdb":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"c62ae93ba45f54405efaaef0156dfc029a15b566f9c37221179c37aac08a1151":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"c3f0b6c827431a544d1c1f27539dd3444afe28335e533d1a7f349f2bfa2faabb":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"b78a862aedd4c7d86724f01cb05157b33cc737f8e1950535c84aaa68bc79732a":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"bc63b63fba9cc9041ea03cff70ae3e508de2a46ab87f798921141d41359e016c":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"a6d50c48a04df43078adbdf7458839847e217f97c6216ea7c0c390b2bb9261c1":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"29157bb95dfe463f9140bb8abd2ad3eb659d6bd33715786f0e4342ed25757198":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"d3ae0bb3a0002d7fbf49fc808109e0c9e7f88672e4de87ec5c199227edf9b6e8":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"768fdb8c8a2909819d1a5c07cfe706fecd87efeb4bb4c416e7d2a2f59b8f3a56":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"c987fb2bff0b61ccf7fdd269b56beca176a028af57edc5cea35e11e8e3edf84c":{"finish_id":"mirror.silver.polished","family":"mirror","recipe_version":"1.0.0","canonical_material_id":"mirror.silver.polished","canonical_recipe_sha256":"5d808ab18672d02019b8f323b36a9b2e8d17791be35c6d93a24b016fd7e126cf","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"0e53407cb43b54a62f45c9267444728f8fac4b0a26f81e912b91af6329c19d38":{"finish_id":"metal.unspecified.satin","family":"metal","recipe_version":"1.0.0","canonical_material_id":"metal.unspecified.satin","canonical_recipe_sha256":"e32b1ab687c7318041590bc7784849259a0b4a2b3dceb6cfea7e6c6055982313","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"dd3b38d55470bfc610111cba0f0169eccc97760a8635828a5f618a933b1ac2e1":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"6d75ea9571d20e00dd77c53475871ae70aa351b034441dfcc4c9589adf7efe66":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"b3000b73d615cca2f245fcaa317578aeb30600cbf3dae29fa0b71312153b78fe":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"cb6feead50e22819bdddb7408140d28e7c70d7ce15beb9a60e2083981d58d102":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"f2149e382258766ceca2fea2cbb20c31f4518ae9fe6453f97b608cdb4fe2abb6":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"6d1f4bf1ed8512c4691b71f2d9b8a7b146f48f67945079f275df9b91962b31a0":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"7828c7e3c216ec1ea1c1336143d07a5e71a77a1a02024f74be46624305a9d6dc":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"9a5900fb85493d35830702a313d087dcb0a76acdcfb6fe43fdcc95462cbfe8a7":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"96d96d6062b48f1d0fdadb1d168e1ef07c413af74cf3f8224c1fe1c87426e1ec":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"0ced0a300cabe42c4e93155c832a5066c5370280d4270a17a62bbb7163b4283b":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"2867858ab48457e3286e970821e639d4028624fdce238ed4fb248526e5462b4a":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"ab629da2c7ed2f702ccd3adc3d8ad10471ea61851f0b490da6b9ba6f05a08134":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"398ba24e9860f2435d4da1edad73ecf59410881fb7195a2dfcd54c46bbe6f0aa":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"7f24d916a477c96c1b68fbc3bdf2c8ca9fc772aaa477c60efd6c300505b2d667":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"afbe113f1eae217209e6b1ca015ca74cd9b7dbfc6869d58cae7bd7eda589fda5":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"52b8b731ed2cfc212d51b806384a725ccd2354b741493aed1183eabef370dc3f":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"8fd3b01b4cad57f40133b8008d4dbb74c2229b06a4d2a4aab0ed5e1e7cf414f3":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"43c0916b2ecf1dbc03223ab4058657f25c500b8b27c391991bac5d5bf0aed2fb":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"30c5283c1deb0acc6e4155230fab803f06b64b6366e27cf337c24b176a88ffc4":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"2323b40d8ca9a49c4c4d2a98022248ad3e9145486429d294c670ed2b9b10d894":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"9583b5fb69d6aa37701676fd3aa221ab665f709976380a5df9580ae967a13479":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"8eabb056a480884ce9f8b10e07a7f5df69c48995d212a9f0ce17fe46e19d4064":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"16c6493bb9754a9bb807c0f880f3f2e3bbbbcfce4106a66f7caea7f13215bfb2":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"c46d5c96020b56ad7f4d09735c86150d424e177836698343d857044d5e5ed215":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."},"bdaf5987101347c839d03723297c337343d267987a3cce0047f88f58e5131ff4":{"finish_id":"appearance.opaque.dielectric","family":"appearance","recipe_version":"1.0.0","canonical_material_id":"appearance.opaque.dielectric","canonical_recipe_sha256":"bf4afc577229f59001f257b07adb3ed06f9c3bfc08a626daa3aa13a2c248f17d","mode":"standard","material_source":"Actual final saved native shader; freshly baked PBR channels."}},"styleV2":{"revision":"deadline-v2-3c7a4501f584870eeacc","registry":{"path":"/Users/moonshot/Documents/asset-library/material-unification-v1/research/deadline_controller_20261011/functional_batch02/registry/registry.json","sha256":"002dc9425dc78dec647352f21f593648e607e9631968a7d5dda5e75c2ca1fad7"},"mappingSha256":"9f33b7e5e0548650ca61189a49e9460a7df5f34d3ba247b8dc60534b1b746ebc","mode":"standard","sourceStateBlendSha256":{"closed":"0fe4201db04c7b2ae6ccd9c072264d3b2dbc6e6918b41f29d96361b2ff6185f6","open":"4657ac310adec74c1ccbecd36e75658ba55956efbe89409f5ce44f3128255285"}},"limitations":["Browser parameter API is supplied by asset.mjs; see parameters.json for runtime support and validation limits.","Final native PBR channels are finite-resolution UV textures; Cycles and three.js lighting are not pixel-identical.","The native shared library is hash-bound at the registry workspace path."]});
export const availableStates = Object.freeze(["closed","open"]);

export async function createAsset(THREE, options = {}) {
  if (!THREE?.Group || !THREE?.BufferGeometry || !THREE?.MeshPhysicalMaterial)
    throw new TypeError('Pass the three.js namespace to createAsset(THREE, options)');
  const requested = options.state ?? metadata.defaultState;
  const session = await openAsset(THREE, new URL('./', import.meta.url), options);
  const DATA = session.data;
  try {
  if (!DATA.states[requested]) throw new RangeError(`Unknown asset state: ${requested}`);
  const geometries = session.geometries, materials = new Map(), textures = session.textures;
  const floats = session.array;
  const root = new THREE.Group();
  root.name = metadata.name;
  root.userData.asset = metadata;
  root.userData.availableStates = [...availableStates];
  if ((options.upAxis ?? 'Y') === 'Y') root.rotation.x = -Math.PI / 2;
  else if (options.upAxis !== 'Z') throw new RangeError('upAxis must be Y or Z');
  const loadTexture = options.loadTexture ?? ((uri) => new THREE.TextureLoader().loadAsync(uri));
  async function texture(id, color) {
    const key = `${id}:${color}`;
    if (!textures.has(key)) textures.set(key, (async () => {
      const t = await session.loadTexture(session.uri(id), loadTexture);
      t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.flipY = true; // native Blender UVs, unlike the glTF convention
      t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
      // Continuous coverage proof bounds the exact level-zero bilinear footprint.
      t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
      return t;
    })());
    return textures.get(key);
  }
  async function material(id) {
    if(id===null)return null;
    if (!materials.has(id)) materials.set(id, (async () => {
      const d = DATA.materials[id], p = d.properties;
      const m = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(...p.color), metalness: p.metalness,
        roughness: p.roughness, opacity: p.opacity, transparent: p.transparent,
        ior: p.ior, transmission: p.transmission, clearcoat: p.clearcoat,
        clearcoatRoughness: p.clearcoatRoughness,
        emissive: new THREE.Color(...p.emissive), emissiveIntensity: p.emissiveIntensity,
        specularIntensity: p.specularIntensity, specularColor: new THREE.Color(...p.specularColor),
        sheen: p.sheen ?? 0, sheenColor: new THREE.Color(...(p.sheenColor ?? [1,1,1])),
        sheenRoughness: p.sheenRoughness ?? .5,
        anisotropy: p.anisotropy ?? 0, anisotropyRotation: p.anisotropyRotation ?? 0,
        side: THREE.DoubleSide,
        vertexColors: Boolean(d.vertexColor),
      });
      m.name = d.name; m.userData.blenderMaterial = d.name;
      Object.assign(m.userData, DATA.metadata.unifiedMaterials[id]);
      if (d.vertexColor) m.userData.vertexColorContract = d.vertexColor;
      if (d.vertexColor?.emission_vertex_multiplier) {
        // Three's ordinary vertex color path affects diffuse/alpha only.
        // The native source feeds the same interpolated RGB to emission too.
        m.onBeforeCompile = shader => {
          const token = '#include <emissivemap_fragment>';
          if (shader.fragmentShader.split(token).length !== 2) throw new Error('Unsupported Three emission shader boundary');
          shader.fragmentShader = shader.fragmentShader.replace(token, token + '\n#if defined(USE_COLOR) || defined(USE_COLOR_ALPHA)\n totalEmissiveRadiance *= vColor.rgb;\n#endif\n');
        };
        m.customProgramCacheKey = () => 'native-vertex-rgb-emission-v1';
      }
      for (const [prop, tex] of Object.entries(d.maps))
        m[prop] = await texture(tex, prop === 'map' || prop === 'emissiveMap' || prop === 'specularColorMap');
      return m;
    })());
    return materials.get(id);
  }
  function geometry(id) {
    if (!geometries.has(id)) {
      const d = DATA.geometries[id], g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(floats(d.position), 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(floats(d.normal), 3));
      if (d.color) g.setAttribute('color', new THREE.Float32BufferAttribute(floats(d.color), 4));
      const uv = floats(d.uv);
      if (uv.length) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      if (d.index) g.setIndex(new THREE.BufferAttribute(floats(d.index), 1));
      for (const [start, count, slot] of d.groups) g.addGroup(start, count, slot);
      g.computeBoundingBox(); g.computeBoundingSphere();
      geometries.set(id, g);
    }
    return geometries.get(id);
  }
  // States are actual saved Blender scenes. Swapping states does not pretend that
  // arbitrary procedural Python parameters are available as JavaScript parameters.
  const stateGroups = new Map();
  const building = new Map();
  let disposed = false;
  async function buildState(name) {
    if (disposed) throw new Error('Asset has been disposed');
    if (stateGroups.has(name)) return;
    await session.prepare(name);
    const state = DATA.states[name];
    await Promise.all([...new Set(state.nodes.flatMap(n => n.materials || []).filter(id => id !== null))].map(material));
    const container = new THREE.Group(); container.name = `state:${name}`;
    const nodes = new Map();
    for (const d of state.nodes) {
      const o = d.geometry
        ? new THREE.Mesh(geometry(d.geometry), await Promise.all(d.materials.map(material)))
        : new THREE.Group();
      o.name = d.name; o.visible = d.visible;
      o.matrix.fromArray(d.matrix); o.matrix.decompose(o.position, o.quaternion, o.scale);
      o.matrixAutoUpdate = false;
      o.userData = {...d.properties, blenderType: d.type, assetNode: d.name};
      o.castShadow = true; o.receiveShadow = true; nodes.set(d.name, o);
    }
    for (const d of state.nodes) (nodes.get(d.parent) ?? container).add(nodes.get(d.name));
    container.visible = name === requested;
    root.add(container); stateGroups.set(name, container);
  }
  async function prepareState(name) {
    if (disposed) throw new Error('Asset has been disposed');
    if (!DATA.states[name]) throw new RangeError(`Unknown asset state: ${name}`);
    if (!building.has(name)) building.set(name, buildState(name).catch(e => {building.delete(name);throw e;}));
    await building.get(name);
    return root;
  }
  for (const name of (options.states === 'lazy' ? [requested] : availableStates)) await prepareState(name);
  root.prepareState = prepareState;
  let switchRequest = 0;
  root.setState = (name) => {
    if (disposed) throw new Error('Asset has been disposed');
    const token = ++switchRequest;
    if (!stateGroups.has(name) && DATA.states[name]) return prepareState(name).then(() => token === switchRequest ? root.setState(name) : root);
    if (!stateGroups.has(name)) throw new RangeError(`Unknown asset state: ${name}`);
    for (const [state, group] of stateGroups) group.visible = state === name;
    root.userData.state = name;
    return root;
  };
  root.getStateObject = (name) => stateGroups.get(root.userData.state).getObjectByName(name);
  root.dispose = async () => {
    if (disposed) return; disposed = true;
    await Promise.allSettled(building.values());
    for (const m of materials.values()) (await m).dispose();
    await session.release();
  };
  root.setState(requested); root.updateMatrixWorld(true);
  return root;
  } catch (error) { await session.release(); throw error; }
}

export default createAsset;
