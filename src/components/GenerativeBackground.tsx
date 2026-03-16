import React, { useEffect, useRef } from 'react';

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_scroll;
  uniform vec2 u_offset;

  // --- Noise functions ---
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  const mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );

  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.5000 * snoise(p); p = m * p * 2.02;
    f += 0.2500 * snoise(p); p = m * p * 2.03;
    f += 0.1250 * snoise(p); p = m * p * 2.01;
    f += 0.0625 * snoise(p);
    return f / 0.9375;
  }

  float domainWarp(vec2 p, float t, out vec2 q, out vec2 r) {
    // First warp layer: drifting slowly in opposing directions
    q.x = fbm(p + vec2(0.0, 0.0) + vec2(t * 0.8, t * 0.2));
    q.y = fbm(p + vec2(5.2, 1.3) + vec2(-t * 0.6, t * 0.5));

    // Second warp layer: deep swirling complexity
    r.x = fbm(p + 4.0 * q + vec2(1.7, 9.2) + vec2(t * -0.4, t * 0.9));
    r.y = fbm(p + 4.0 * q + vec2(8.3, 2.8) + vec2(t * 1.1, -t * 0.7));

    // Final fluid surface morphing
    return fbm(p + 4.0 * r + t);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= aspect;

    // Apply Subtle Position Offset from Interaction
    p += u_offset;

    // Displacement by mouse
    float dist = length(p - u_mouse);
    float mouseEffect = smoothstep(0.8, 0.0, dist) * 0.2;
    p += (p - u_mouse) * mouseEffect;

    // Parallax by scroll
    p.y += u_scroll * 0.5;

    // Movement
    float t = u_time * 0.02; 
    vec2 q, r;
    float zoom = 0.06; 
    
    // Pass 't' as an argument so the fluid churns internally instead of panning diagonally
    float f = domainWarp(p * zoom, t, q, r);

    // Normal estimation for specular
    float eps = 0.01;
    vec2 dummyQ, dummyR;
    
    // Update these to match the new domainWarp structure!
    float f_x = domainWarp((p + vec4(eps, 0, 0, 0).xy) * zoom, t, dummyQ, dummyR);
    float f_y = domainWarp((p + vec4(0, eps, 0, 0).xy) * zoom, t, dummyQ, dummyR);
    vec3 normal = normalize(vec3(f_x - f, f_y - f, eps));

    // --- COLOR MIXING ---
    
    // 1. Base Dark Purple (Shifts very subtly with scroll and mouse Y)
    vec3 baseColor = vec3(0.02, 0.01 + (u_mouse.y * 0.02), 0.06 + (u_scroll * 0.03));
    
    // 2. Pinkish/Magenta Hue
    vec3 pinkColor = vec3(0.3, 0.05, 0.2);
    
    // 3. Blueish/Cyan Hue
    vec3 blueColor = vec3(0.05, 0.15, 0.4);

    // Blend the pink in based on the main FBM noise, slightly shifted by mouse X
    float mixPink = clamp(f * 0.6 + 0.4 + (u_mouse.x * 0.1), 0.0, 1.0);
    vec3 finalColor = mix(baseColor, pinkColor, mixPink);

    // Blend the blue in based on the deep domain warp (r) and scroll position
    float mixBlue = clamp(length(r) * 0.6 + (u_scroll * 0.15), 0.0, 1.0);
    finalColor = mix(finalColor, blueColor, mixBlue);

    // --- LIGHTING ---
    vec3 lightDir = normalize(vec3(1.0, 1.0, 2.0));
    float spec = pow(max(dot(normal, lightDir), 0.0), 32.0);
    
    // Soft specular highlight
    vec3 specColor = vec3(0.8, 0.8, 0.9);
    finalColor += spec * specColor * 0.35;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function GenerativeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const stateRef = useRef({
    time: 0,
    mouse: { x: 0, y: 0 },
    targetMouse: { x: 0, y: 0 },
    scroll: 0,
    offset: { x: 0, y: 0 },
    targetOffset: { x: 0, y: 0 },
    reducedMotion: false,
  });

  useEffect(() => {
    // Reduced motion check
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    stateRef.current.reducedMotion = mediaQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      stateRef.current.reducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    // --- Shader Compilation ---
    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // --- Attributes ---
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // --- Uniforms ---
    const uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      mouse: gl.getUniformLocation(program, 'u_mouse'),
      scroll: gl.getUniformLocation(program, 'u_scroll'),
      offset: gl.getUniformLocation(program, 'u_offset'),
    };

    // --- Resizing ---
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(document.body);
    resize();

    // --- Events ---
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (stateRef.current.reducedMotion) return;
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const aspect = window.innerWidth / window.innerHeight;
      stateRef.current.targetMouse = {
        x: (x / window.innerWidth * 2 - 1) * aspect,
        y: -(y / window.innerHeight * 2 - 1)
      };
    };

    const handleScroll = () => {
      if (stateRef.current.reducedMotion) return;
      stateRef.current.scroll = window.scrollY / window.innerHeight;
    };

    const handleInteractionShift = () => {
      stateRef.current.targetOffset = {
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousedown', handleInteractionShift);
    window.addEventListener('keydown', handleInteractionShift);

    // --- Render Loop ---
    let lastTime = performance.now();
    const render = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const state = stateRef.current;

      // Update Uniform Values
      if (state.reducedMotion) {
        state.time += delta * 0.05; // Slow down
        state.mouse.x = 0;
        state.mouse.y = 0;
        state.scroll = 0;
      } else {
        state.time += delta;
        // Smooth mouse follow
        state.mouse.x += (state.targetMouse.x - state.mouse.x) * 0.1;
        state.mouse.y += (state.targetMouse.y - state.mouse.y) * 0.1;
        
        // Very slow drifting interpolation for randomized offset
        state.offset.x += (state.targetOffset.x - state.offset.x) * 0.02;
        state.offset.y += (state.targetOffset.y - state.offset.y) * 0.02;
      }

      // Send to GPU
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, state.time);
      gl.uniform2f(uniforms.mouse, state.mouse.x, state.mouse.y);
      gl.uniform1f(uniforms.scroll, state.scroll);
      gl.uniform2f(uniforms.offset, state.offset.x, state.offset.y);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleInteractionShift);
      window.removeEventListener('keydown', handleInteractionShift);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1] pointer-events-none w-full h-full block"
      style={{ background: '#000' }}
    />
  );
}
