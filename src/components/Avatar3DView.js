import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

export default function Avatar3DView({ color = '#3498db' }) {
  
  const onContextCreate = async (gl) => {
    // 1. Configurar Motor
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x111111); // Fundo Cinza Escuro

    // 2. Cena e Câmera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1;

    // 3. Luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // 4. CRIAR PERSONAGEM (Estilo Minecraft: Blocos)
    const material = new THREE.MeshStandardMaterial({ color: color });
    
    // Cabeça
    const headGeo = new THREE.BoxGeometry(1, 1, 1);
    const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: '#f8d9bd' })); // Pele
    head.position.y = 1.5;
    
    // Corpo
    const bodyGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
    const body = new THREE.Mesh(bodyGeo, material); // Cor da Camisa
    body.position.y = 0.25;

    // Pernas (Juntas para simplificar)
    const legsGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
    const legs = new THREE.Mesh(legsGeo, new THREE.MeshStandardMaterial({ color: '#333' })); // Calça
    legs.position.y = -1.25;

    // Grupo do Personagem
    const character = new THREE.Group();
    character.add(head);
    character.add(body);
    character.add(legs);
    
    scene.add(character);

    // 5. Loop de Renderização (Animação)
    const render = () => {
      requestAnimationFrame(render);
      // Rotação automática suave (Iddle animation)
      character.rotation.y += 0.01;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();
  };

  return (
    <View style={{ flex: 1 }}>
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
    </View>
  );
}
