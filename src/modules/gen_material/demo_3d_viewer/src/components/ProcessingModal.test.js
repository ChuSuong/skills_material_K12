import { render, screen } from '@testing-library/react';
import ProcessingModal from './ProcessingModal';

describe('ProcessingModal', () => {
  test('renders when open', () => {
    render(<ProcessingModal isOpen processing3DObjectId="cat.glb" />);

    expect(screen.getByText('Đang tạo mô hình 3D')).toBeInTheDocument();
    expect(screen.getByText(/cat\.glb/)).toBeInTheDocument();
  });

  test('renders nothing when closed', () => {
    const { container } = render(<ProcessingModal isOpen={false} processing3DObjectId="cat.glb" />);
    expect(container).toBeEmptyDOMElement();
  });
});
