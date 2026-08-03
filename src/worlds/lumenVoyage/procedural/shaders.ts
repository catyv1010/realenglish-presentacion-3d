export const GLSL_CAUSTIC = `
float caustic(vec2 uv, float t){
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
  vec2 i = p; float c = 1.0; const float inten = 0.0045;
  for (int n = 0; n < 5; n++){
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 5.0; c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.8);
}
`

export const GLSL_NOISE3 = `
float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123); }
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
        mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
        mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
  return n;
}
float fbm3(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise3(p); p *= 2.0; a *= 0.5; }
  return v;
}
`

export function waterVertexUniforms() {
  return `
    uniform float uTime;
    uniform float uSway;
    varying vec3 vWorldPos;
  `
}

export function waterVertexSway() {
  return `
    #include <begin_vertex>
    if (uSway > 0.0) {
      float h = max(transformed.y, 0.0);
      float k = h * h * uSway;
      transformed.x += sin(uTime * 0.72 + transformed.z * 0.55 + transformed.y * 0.3) * k;
      transformed.z += cos(uTime * 0.58 + transformed.x * 0.5) * k * 0.8;
    }
    #ifdef USE_INSTANCING
      vWorldPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
    #else
      vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
    #endif
  `
}

export function waterFragmentCaustic() {
  return `
    #include <dithering_fragment>
    float cs = caustic(vWorldPos.xz * 0.048, uTime * 0.26);
    float haz = smoothstep(-10.0, 5.0, vWorldPos.y);
    gl_FragColor.rgb += uCaustColor * cs * uCaustAmt * (0.30 + haz * 0.80);
    float d = length(vWorldPos - cameraPosition);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(0.30, 0.90, 1.18), clamp(d / 78.0, 0.0, 0.88));
  `
}

export function waterFragmentUniforms() {
  return `
    uniform float uTime;
    uniform vec3 uCaustColor;
    uniform float uCaustAmt;
    varying vec3 vWorldPos;
  `
}
