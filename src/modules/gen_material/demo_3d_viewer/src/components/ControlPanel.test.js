import { fireEvent, render, screen } from '@testing-library/react';
import ControlPanel from './ControlPanel';


describe('ControlPanel', () => {
  const baseProps = {
    isObjectMode: true,
    setObjectMode: jest.fn(),
    activeScene: { id: 'museum' },
    switchScene: jest.fn(),
    generatedSceneLibrary: [{ libraryId: 'lib-1', libraryLabel: 'Scene A' }],
    restoreGeneratedSceneFromLibrary: jest.fn(),
    removeGeneratedSceneFromLibrary: jest.fn(),
    activeTheme: 'Theme',
    activeIntroText: 'Intro',
    showDissolveControl: true,
    showGeneratedRenderModeControl: true,
    generatedRenderMode: 'flat',
    setGeneratedRenderMode: jest.fn(),
    isDissolving: false,
    onToggleDissolve: jest.fn(),
    objectPanelStyle: { display: 'block' },
    promptInput: '',
    setPromptInput: jest.fn(),
    isDirectActionDisabled: false,
    isGenerating: false,
    handleGenerate: jest.fn(),
    handleDirectUpload3D: jest.fn(),
    isDirectUploadGenerating: false,
    directUploadError: '',
    generationStep: 'Step text',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders scene buttons and generated library entries', () => {
    render(<ControlPanel {...baseProps} />);

    expect(screen.getByText('Bảo tàng')).toBeInTheDocument();
    expect(screen.getByText('Library 3D')).toBeInTheDocument();
    expect(screen.getByText('Scene A')).toBeInTheDocument();
    expect(screen.getByText('Step text')).toBeInTheDocument();
  });

  test('calls restore and remove handlers for library actions', () => {
    render(<ControlPanel {...baseProps} />);

    fireEvent.click(screen.getByText('Scene A'));
    fireEvent.click(screen.getByText('X'));

    expect(baseProps.restoreGeneratedSceneFromLibrary).toHaveBeenCalledWith(baseProps.generatedSceneLibrary[0]);
    expect(baseProps.removeGeneratedSceneFromLibrary).toHaveBeenCalledWith('lib-1');
  });

  test('toggles generated render mode', () => {
    render(<ControlPanel {...baseProps} />);

    fireEvent.click(screen.getByText('Studio'));

    expect(baseProps.setGeneratedRenderMode).toHaveBeenCalledWith('studio');
  });
});
