import { fireEvent, render, screen } from '@testing-library/react';
import ImageReviewModal from './ImageReviewModal';

describe('ImageReviewModal', () => {
  const baseProps = {
    confirmingImage: { id: 'apple-1', imageUrl: '/apple.png' },
    pendingImages: [{ id: 'apple-1' }, { id: 'apple-2' }],
    isImageActionDisabled: false,
    handleUploadImage: jest.fn(),
    isUploadingImage: false,
    uploadError: '',
    handleConfirmImage: jest.fn(),
    isConfirming3D: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders confirmation content and queue hint', () => {
    render(<ImageReviewModal {...baseProps} />);

    expect(screen.getByText('Duyệt thiết kế 2D')).toBeInTheDocument();
    expect(screen.getByAltText('apple-1')).toBeInTheDocument();
    expect(screen.getByText(/1 đối tượng còn lại/)).toBeInTheDocument();
  });

  test('calls confirm handlers for approve and regenerate actions', () => {
    render(<ImageReviewModal {...baseProps} />);

    fireEvent.click(screen.getByText(/Vẽ lại ảnh khác/));
    fireEvent.click(screen.getByText(/Duyệt & Tạo 3D/));

    expect(baseProps.handleConfirmImage).toHaveBeenNthCalledWith(1, false);
    expect(baseProps.handleConfirmImage).toHaveBeenNthCalledWith(2, true);
  });
});
