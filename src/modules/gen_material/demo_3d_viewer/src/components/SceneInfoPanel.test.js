import { fireEvent, render, screen } from '@testing-library/react';
import SceneInfoPanel from './SceneInfoPanel';

jest.mock('canvas-confetti', () => jest.fn());

describe('SceneInfoPanel', () => {
  const selectedInfo = {
    title: 'Quiz Object',
    description: 'Description text',
    quiz: {
      question: 'What is 2 + 2?',
      answers: ['3', '4'],
      correctAnswer: '4',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  test('renders info and quiz content', () => {
    render(<SceneInfoPanel selectedInfo={selectedInfo} isDissolving={false} onClose={jest.fn()} />);

    expect(screen.getByText('Quiz Object')).toBeInTheDocument();
    expect(screen.getByText('Description text')).toBeInTheDocument();
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  test('calls close handler and handles correct answer', () => {
    const onClose = jest.fn();
    render(<SceneInfoPanel selectedInfo={selectedInfo} isDissolving={false} onClose={onClose} />);

    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('Đóng'));

    expect(window.alert).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
