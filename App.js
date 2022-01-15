import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';
import { useCallback, useEffect, useRef } from 'react';

const vertices = new Float32Array([
  0.0,  0.0,
  1.0,  0.0,
  0.0,  1.0,
  0.0,  1.0,
  1.0,  0.0,
  1.0,  1.0,
]);

export default function App() {

  const frameHandle = useRef(0);
  const frameValue = useRef(0)
  const contextRef = useRef(null);
  const rotationRef = useRef(null);

  const frameTicker = useCallback((time) => {
    if(contextRef.current) {
      const gl = contextRef.current;
      frameValue.current += Math.PI / 600; // 180 degrees in 10 seconds

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2fv(rotationRef.current, [Math.cos(frameValue.current), Math.sin(frameValue.current)]);

      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
      gl.flush();
      gl.endFrameEXP();
    }
    frameHandle.current = requestAnimationFrame(frameTicker);
  }, []);

  useEffect(() => {
    return () => {
      if(frameHandle.current) {
        cancelAnimationFrame(frameHandle.current);
        frameHandler.current = 0;
      }
    };
  }, []);

  const onContextCreate = useCallback((gl) => {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Create vertex shader (shape & position)
    const vert = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(
      vert,
      `
      precision highp float;
      uniform vec2 u_rotation;
      attribute vec2 a_position;
      varying vec2 uv;
      void main(void) {
        vec2 rotatedPosition = vec2(
          a_position.x * u_rotation.y + a_position.y * u_rotation.x,
          a_position.y * u_rotation.y - a_position.x * u_rotation.x
        );

        uv = a_position;
        gl_Position = vec4(rotatedPosition, 0, 1);
      }
    `
    );
    gl.compileShader(vert);

    // Create fragment shader (color)
    const frag = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(
      frag,
      `
      void main(void) {
        gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
      }
    `
    );
    gl.compileShader(frag);

    // Link together into a program
    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const positionAttrib = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttrib);
    gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

    const rotationLocation = gl.getUniformLocation(program, 'u_rotation');
    gl.uniform2fv(rotationLocation, [Math.cos(0), Math.sin(0)]);
    rotationRef.current = rotationLocation;

    gl.clearColor(1, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.flush();
    gl.endFrameEXP();
    contextRef.current = gl;
    frameHandle.current = requestAnimationFrame(frameTicker);
  }, []);

  return (
    <View style={styles.container}>
      <GLView style={{ width: 300, height: 300 }} onContextCreate={onContextCreate} />
      <StatusBar style="auto" />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
