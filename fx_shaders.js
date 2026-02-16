export const vertexShaderBlob = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
uniform float uTime;
uniform float uNoiseFreq;
uniform float uNoiseAmp;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    float noiseVal = snoise(position * uNoiseFreq + uTime * 0.5);
    vec3 newPos = position + normal * noiseVal * uNoiseAmp;
    vec4 worldPos = modelMatrix * vec4(newPos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const fragmentShaderBlob = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
uniform vec3 uColor;
uniform vec3 uRimColor;
uniform float uTime;
uniform int uSkinType;
uniform float uDamage;
uniform float uShield;
uniform float uStealth;
uniform float uMagnet;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1.0 - dot(viewDir, normal), 3.0);
    vec3 glow = uRimColor * fresnel * 2.0;
    vec3 col = mix(uColor, uRimColor, fresnel * 0.5);
    float alpha = 0.8;
    
    if (uSkinType == 1) {
        float stripes = sin(vWorldPosition.y * 10.0 + uTime * 5.0);
        col += uColor * stripes * 0.8;
    } else if (uSkinType == 2) {
        float grid = step(0.8, fract(vWorldPosition.x * 2.0)) + step(0.8, fract(vWorldPosition.z * 2.0));
        col += uColor * grid * 1.0;
    } else if (uSkinType == 3) {
        float noise = snoise(vWorldPosition * 0.5 + uTime * 0.2);
        col += uColor * noise * 0.6;
    }

    if (uStealth > 0.0) {
        col = mix(col, vec3(0.2, 0.2, 0.2), uStealth * 0.8);
        alpha = mix(0.8, 0.1, uStealth);
    }

    if (uShield > 0.0) {
        float shieldRim = pow(1.0 - dot(viewDir, normal), 1.5);
        col += vec3(0.0, 1.0, 1.0) * shieldRim * uShield * 2.0;
    }

    if (uMagnet > 0.0) {
        float magnetRim = pow(1.0 - dot(viewDir, normal), 2.0);
        col += vec3(1.0, 1.0, 0.0) * magnetRim * uMagnet * 1.5;
    }

    col = mix(col, vec3(1.0, 0.0, 0.0), uDamage);
    gl_FragColor = vec4(col + glow, alpha);
}
`;

export const vertexShaderGrid = `
varying vec3 vWorldPos;
void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const fragmentShaderGrid = `
varying vec3 vWorldPos;
uniform float uTime;
uniform vec4 uBlobData[32]; // xyz: position, w: radius
uniform vec3 uBlobColor[32];
uniform int uBlobCount;

void main() {
    vec2 grid = abs(fract(vWorldPos.xz * 0.2 - 0.5) - 0.5) / fwidth(vWorldPos.xz * 0.2);
    float line = min(grid.x, grid.y);
    float alpha = 1.0 - min(line, 1.0);
    
    float noise = sin(vWorldPos.x * 0.02) + sin(vWorldPos.z * 0.02);
    vec3 cBlue = vec3(0.0, 0.2, 0.3);
    vec3 cPurple = vec3(0.3, 0.0, 0.3);
    vec3 cGreen = vec3(0.0, 0.3, 0.1);
    
    vec3 baseColor = mix(cBlue, cPurple, smoothstep(0.0, 1.5, noise));
    baseColor = mix(baseColor, cGreen, smoothstep(-1.5, 0.0, noise));
    
    vec3 color = baseColor * alpha * 0.2;
    float pulse = sin(uTime * 0.5 + vWorldPos.x * 0.1 + vWorldPos.z * 0.1) * 0.5 + 0.5;
    
    // Fake Reflections (All Blobs)
    for(int i = 0; i < 32; i++) {
        if(i >= uBlobCount) break;
        float dist = distance(vWorldPos.xz, uBlobData[i].xz);
        float radius = uBlobData[i].w;
        float reflection = smoothstep(radius * 4.0, 0.0, dist);
        color += uBlobColor[i] * reflection * 0.4 * alpha;
    }

    gl_FragColor = vec4(color * (0.5 + pulse * 0.5), alpha * 0.3);
}
`;

export const NightVisionShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "time": { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
        void main() {
            vec4 c = texture2D(tDiffuse, vUv);
            float lum = dot(c.rgb, vec3(0.30, 0.59, 0.11));
            vec3 vision = vec3(0.0, lum * 1.5, 0.0);
            float scanline = sin(vUv.y * 800.0 + time * 10.0) * 0.1;
            vision -= scanline;
            float noise = rand(vUv + time) * 0.2;
            vision += noise;
            float dist = distance(vUv, vec2(0.5));
            vision *= smoothstep(0.8, 0.2, dist);
            gl_FragColor = vec4(vision, 1.0);
        }
    `
};

export const vertexShaderCinematic = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
uniform float uTime;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    // Complex deformation
    float wave1 = sin(position.y * 3.0 + uTime * 2.0) * 0.3;
    float wave2 = cos(position.x * 4.0 + uTime * 1.5) * 0.3;
    vec3 newPos = position + normal * (wave1 + wave2);
    
    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const fragmentShaderCinematic = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
uniform vec3 uColor;
uniform vec3 uRimColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.0);
    
    vec3 col = mix(uColor, uRimColor, fresnel * 1.5);
    // Add subtle pulse
    col *= 1.0 + sin(vUv.y * 20.0 + vViewPosition.x) * 0.1;
    gl_FragColor = vec4(col, 1.0);
}
`;
