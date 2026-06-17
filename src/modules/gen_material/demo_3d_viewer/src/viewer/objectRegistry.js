import React from 'react';
import {
  Artifact,
  Cactus,
  Citizen,
  Cloud,
  Coral,
  Crystal,
  Duck,
  Fish,
  FloatingCube,
  Fox,
  GeneratedModel,
  GeneratedPlaceholder,
  Lantern,
  Market,
  Mountain,
  Pharaoh,
  Planet,
  Pyramid,
  Sun,
  Temple,
  Tent,
  Tree,
} from './objectComponents';

const directProps = (obj, onClick, Component) => <Component key={obj.id} data={obj} onClick={onClick} />;
const positionedProps = (obj, onClick, Component) => (
  <Component
    key={obj.id}
    position={obj.position}
    scale={obj.scale}
    rotation={obj.rotation}
    color={obj.color}
    data={obj}
    onClick={onClick}
  />
);

export const objectRegistry = {
  __generatedModel: {
    component: GeneratedModel,
    render: (obj, onClick) => <GeneratedModel key={obj.id} obj={obj} onClick={onClick} />,
  },
  __generatedPlaceholder: {
    component: GeneratedPlaceholder,
    render: (obj, onClick) => <GeneratedPlaceholder key={obj.id} obj={obj} onClick={onClick} />,
  },
  torusKnot: { component: Artifact, render: directProps },
  crystal: {
    component: Crystal,
    render: (obj, onClick, Component) => <Component key={obj.id} position={obj.position} color={obj.color} data={obj} onClick={onClick} />,
  },
  floatingCube: {
    component: FloatingCube,
    render: (obj, onClick, Component) => <Component key={obj.id} position={obj.position} color={obj.color} data={obj} onClick={onClick} />,
  },
  sun: {
    component: Sun,
    render: (obj, onClick, Component) => <Component key={obj.id} size={obj.size} color={obj.color} texturePath={obj.texture} data={obj} onClick={onClick} />,
  },
  planet: {
    component: Planet,
    render: (obj, onClick, Component) => (
      <Component
        key={obj.id}
        name={obj.name}
        size={obj.size}
        color={obj.color}
        texturePath={obj.texture}
        orbitRadius={obj.orbitRadius}
        orbitSpeed={obj.orbitSpeed}
        data={obj}
        onClick={onClick}
      />
    ),
  },
  fish: { component: Fish, render: positionedProps },
  duck: { component: Duck, render: positionedProps },
  coral: { component: Coral, render: positionedProps },
  tree: { component: Tree, render: positionedProps },
  fox: { component: Fox, render: positionedProps },
  lantern: { component: Lantern, render: positionedProps },
  mountain: { component: Mountain, render: positionedProps },
  tent: { component: Tent, render: positionedProps },
  cloud: { component: Cloud, render: positionedProps },
  pyramid: { component: Pyramid, render: positionedProps },
  pharaoh: {
    component: Pharaoh,
    render: (obj, onClick, Component) => (
      <Component
        key={obj.id}
        id={obj.id}
        position={obj.position}
        scale={obj.scale}
        rotation={obj.rotation}
        color={obj.color}
        data={obj}
        onClick={onClick}
      />
    ),
  },
  market: { component: Market, render: positionedProps },
  citizen: { component: Citizen, render: positionedProps },
  cactus: { component: Cactus, render: positionedProps },
  temple: { component: Temple, render: positionedProps },
};

export const builtInObjectTypes = Object.keys(objectRegistry).filter((key) => !key.startsWith('__'));
