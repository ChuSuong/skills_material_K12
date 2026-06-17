import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderSceneObject } from './renderSceneObject';

function makeStub(label) {
  return function Stub(props) {
    return <div data-testid={label}>{JSON.stringify(props)}</div>;
  };
}

describe('renderSceneObject', () => {
  const registry = {
    __generatedModel: {
      component: makeStub('GeneratedModel'),
      render: (obj, onClick, Component) => <Component key={obj.id} obj={obj} onClick={onClick} />,
    },
    __generatedPlaceholder: {
      component: makeStub('GeneratedPlaceholder'),
      render: (obj, onClick, Component) => <Component key={obj.id} obj={obj} onClick={onClick} />,
    },
    torusKnot: {
      component: makeStub('Artifact'),
      render: (obj, onClick, Component) => <Component key={obj.id} data={obj} onClick={onClick} />,
    },
    planet: {
      component: makeStub('Planet'),
      render: (obj, onClick, Component) => <Component key={obj.id} name={obj.name} onClick={onClick} />,
    },
  };

  test('renders generated model when model_url exists', () => {
    render(renderSceneObject({ id: 'g1', model_url: '/g1.glb' }, jest.fn(), registry));
    expect(screen.getByTestId('GeneratedModel')).toBeInTheDocument();
  });

  test('uses mapped component for known built-in type', () => {
    render(renderSceneObject({ id: 'a1', type: 'torusKnot' }, jest.fn(), registry));
    expect(screen.getByTestId('Artifact')).toBeInTheDocument();
  });

  test('falls back to placeholder for unknown type', () => {
    render(renderSceneObject({ id: 'u1', type: 'unknown' }, jest.fn(), registry));
    expect(screen.getByTestId('GeneratedPlaceholder')).toBeInTheDocument();
  });

  test('passes rendering through registry entry', () => {
    render(renderSceneObject({ id: 'p1', type: 'planet', name: 'Mars' }, jest.fn(), registry));
    expect(screen.getByTestId('Planet')).toBeInTheDocument();
  });
});
