import { useEffect, useRef, useState } from 'react';

export default function useGenerationPipeline({
  setScene,
  replaceSceneAndResetChrome,
}) {
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);
  const [confirmingImage, setConfirmingImage] = useState(null);
  const [generationStep, setGenerationStep] = useState('');
  const [isConfirming3D, setIsConfirming3D] = useState(false);
  const [processing3DObjectId, setProcessing3DObjectId] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDirectUploadGenerating, setIsDirectUploadGenerating] = useState(false);
  const [directUploadError, setDirectUploadError] = useState('');
  const [worldError, setWorldError] = useState('');
  const [isWorldPanoGenerating, setIsWorldPanoGenerating] = useState(false);
  const [isWorldPanoUploadGenerating, setIsWorldPanoUploadGenerating] = useState(false);
  const [worldModePrompt, setWorldModePrompt] = useState('');
  const [worldPanoViewerUrl, setWorldPanoViewerUrl] = useState('');
  const [worldPanoImageUrl, setWorldPanoImageUrl] = useState('');
  const [isWorldPanoViewerOpen, setIsWorldPanoViewerOpen] = useState(false);
  const [imageEnhanceMode, setImageEnhanceMode] = useState('auto');

  const pendingImagesRef = useRef(pendingImages);
  const currentSessionIdRef = useRef(currentSessionId);
  const confirmingImageRef = useRef(confirmingImage);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    confirmingImageRef.current = confirmingImage;
  }, [confirmingImage]);

  const resetTransientQueueState = () => {
    setPendingImages([]);
    setConfirmingImage(null);
    setProcessing3DObjectId(null);
  };

  const openWorldPanoViewer = () => {
    if (!worldPanoViewerUrl) return;
    setIsWorldPanoViewerOpen(true);
  };

  const generateNextImage = async (sessionId, obj, queue = pendingImagesRef.current) => {
    setUploadError('');
    setGenerationStep(`Đang vẽ ảnh 2D cho: ${obj.id}...`);
    try {
      const res = await fetch('/generate_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, object_id: obj.id })
      });
      const data = await res.json();
      setConfirmingImage({ ...obj, imageUrl: data.image_url });
      const remainingCount = queue.filter((item) => item.id !== obj.id).length;
      setGenerationStep(
        remainingCount > 0
          ? `Chờ duyệt ${obj.id}. Còn ${remainingCount} đối tượng trong hàng đợi.`
          : `Chờ duyệt ${obj.id}.`
      );
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!promptInput) return;
    setIsGenerating(true);
    setGenerationStep('Đang khởi tạo cấu trúc bài giảng (LLM)...');
    try {
      const res = await fetch('/generate_scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptInput })
      });
      const data = await res.json();
      setCurrentSessionId(data.session_id);
      setScene(data.scene_data);

      const objectsToGen = data.scene_data.objects.filter((obj) => obj.image_prompt);

      if (objectsToGen.length > 0) {
        setPendingImages(objectsToGen);
        setGenerationStep(`Đang chuẩn bị vẽ hình 2D (${objectsToGen.length} đối tượng)...`);
        await generateNextImage(data.session_id, objectsToGen[0], objectsToGen);
      } else {
        setGenerationStep('');
        setIsGenerating(false);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi kết nối với Backend.');
      setIsGenerating(false);
    }
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    const currentImage = confirmingImageRef.current;
    const sessionId = currentSessionIdRef.current;

    if (!file || !currentImage || !sessionId || isUploadingImage || isConfirming3D) {
      return;
    }

    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('object_id', currentImage.id);
    formData.append('file', file);

    setIsUploadingImage(true);
    setUploadError('');
    setGenerationStep(`Đang tải ảnh có sẵn cho: ${currentImage.id}...`);

    try {
      const res = await fetch('/upload_image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Không thể tải ảnh lên.');
      }

      setConfirmingImage((current) => current ? { ...current, imageUrl: data.image_url } : current);
      const remainingCount = pendingImagesRef.current.filter((item) => item.id !== currentImage.id).length;
      setGenerationStep(
        remainingCount > 0
          ? `Đã cập nhật ảnh cho ${currentImage.id}. Còn ${remainingCount} đối tượng trong hàng đợi.`
          : `Đã cập nhật ảnh cho ${currentImage.id}.`
      );
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'Không thể tải ảnh lên.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleConfirmImage = async (approved) => {
    const currentObject = confirmingImageRef.current;
    const sessionId = currentSessionIdRef.current;

    if (!currentObject || !sessionId || isConfirming3D || isUploadingImage) return;
    const remaining = pendingImagesRef.current.filter((item) => item.id !== currentObject.id);

    if (approved) {
      setUploadError('');
      setConfirmingImage(null);
      setGenerationStep(`Đang dựng mô hình 3D (Trellis) cho: ${currentObject.id}...`);
      setIsConfirming3D(true);
      setProcessing3DObjectId(currentObject.id);
      try {
        const res = await fetch('/generate_3d', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, object_id: currentObject.id, enhance_mode: imageEnhanceMode })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || 'Lỗi khi dựng mô hình 3D.');
        }

        setScene(data.scene_data);
      } catch (err) {
        console.error(err);
        alert(err.message || 'Lỗi khi dựng mô hình 3D.');
        setIsConfirming3D(false);
        setProcessing3DObjectId(null);
        setConfirmingImage(currentObject);
        return;
      }
    } else {
      await generateNextImage(sessionId, currentObject, pendingImagesRef.current);
      return;
    }

    setPendingImages(remaining);

    if (remaining.length > 0) {
      setIsConfirming3D(false);
      setProcessing3DObjectId(null);
      setGenerationStep(`Đã xong 3D cho ${currentObject.id}. Chuyển sang tạo ảnh 2D cho ${remaining[0].id}...`);
      await generateNextImage(sessionId, remaining[0], remaining);
    } else {
      setConfirmingImage(null);
      setIsConfirming3D(false);
      setProcessing3DObjectId(null);
      setIsGenerating(false);
      setGenerationStep('');
      alert('Hoàn tất tạo học liệu 3D!');
    }
  };

  const handleDirectUpload3D = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || isGenerating || isDirectUploadGenerating || isConfirming3D || isUploadingImage) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('enhance_mode', imageEnhanceMode);

    setIsDirectUploadGenerating(true);
    setDirectUploadError('');
    setUploadError('');
    setWorldError('');
    setGenerationStep('Đang tải ảnh có sẵn và dựng mô hình 3D...');
    setProcessing3DObjectId(file.name);
    resetTransientQueueState();

    try {
      const res = await fetch('/generate_3d_from_upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Không thể tạo 3D từ ảnh tải lên.');
      }

      setCurrentSessionId(data.session_id);
      replaceSceneAndResetChrome(data.scene_data);
      setGenerationStep('Đã tạo xong mô hình 3D từ ảnh có sẵn.');
    } catch (err) {
      console.error(err);
      setDirectUploadError(err.message || 'Không thể tạo 3D từ ảnh tải lên.');
      setGenerationStep('');
      setProcessing3DObjectId(null);
    } finally {
      setIsDirectUploadGenerating(false);
      setProcessing3DObjectId(null);
    }
  };

  const handleGenerateWorldPano = async () => {
    if (!worldModePrompt || isGenerating || isDirectUploadGenerating || isWorldPanoGenerating || isWorldPanoUploadGenerating || isConfirming3D || isUploadingImage) {
      return;
    }

    setIsWorldPanoGenerating(true);
    setWorldError('');
    setDirectUploadError('');
    setUploadError('');
    resetTransientQueueState();
    setGenerationStep('Đang tạo panorama 360 từ prompt với WorldGen...');

    try {
      const res = await fetch('/generate_world_pano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: worldModePrompt })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Không thể tạo pano WorldGen từ prompt.');
      }

      setCurrentSessionId(data.session_id);
      setWorldPanoViewerUrl(data.viewer_url);
      setWorldPanoImageUrl(data.pano_url);
      setIsWorldPanoViewerOpen(true);
      setGenerationStep('Đã tạo xong panorama 360. Đang mở pano HTML.');
    } catch (err) {
      console.error(err);
      setWorldError(err.message || 'Không thể tạo pano WorldGen từ prompt.');
      setGenerationStep('');
    } finally {
      setIsWorldPanoGenerating(false);
    }
  };

  const handleGenerateWorldPanoFromUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || isGenerating || isDirectUploadGenerating || isWorldPanoGenerating || isWorldPanoUploadGenerating || isConfirming3D || isUploadingImage) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsWorldPanoUploadGenerating(true);
    setWorldError('');
    setDirectUploadError('');
    setUploadError('');
    resetTransientQueueState();
    setProcessing3DObjectId(file.name);
    setGenerationStep('Đang tạo panorama 360 từ ảnh với WorldGen...');

    try {
      const res = await fetch('/generate_world_pano_from_upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Không thể tạo pano WorldGen từ ảnh tải lên.');
      }

      setCurrentSessionId(data.session_id);
      setWorldPanoViewerUrl(data.viewer_url);
      setWorldPanoImageUrl(data.pano_url);
      setIsWorldPanoViewerOpen(true);
      setGenerationStep('Đã tạo xong panorama 360 từ ảnh. Đang mở pano HTML.');
    } catch (err) {
      console.error(err);
      setWorldError(err.message || 'Không thể tạo pano WorldGen từ ảnh tải lên.');
      setGenerationStep('');
    } finally {
      setIsWorldPanoUploadGenerating(false);
      setProcessing3DObjectId(null);
    }
  };

  return {
    promptInput,
    setPromptInput,
    isGenerating,
    currentSessionId,
    pendingImages,
    confirmingImage,
    generationStep,
    isConfirming3D,
    processing3DObjectId,
    isUploadingImage,
    uploadError,
    isDirectUploadGenerating,
    directUploadError,
    worldError,
    isWorldPanoGenerating,
    isWorldPanoUploadGenerating,
    worldModePrompt,
    worldPanoViewerUrl,
    worldPanoImageUrl,
    isWorldPanoViewerOpen,
    imageEnhanceMode,
    setImageEnhanceMode,
    setWorldModePrompt,
    handleGenerate,
    handleUploadImage,
    handleConfirmImage,
    handleDirectUpload3D,
    handleGenerateWorldPano,
    handleGenerateWorldPanoFromUpload,
    openWorldPanoViewer,
    setPendingImages,
    setConfirmingImage,
    setGenerationStep,
    setProcessing3DObjectId,
    isImageActionDisabled: isConfirming3D || isUploadingImage,
    isDirectActionDisabled: isGenerating || isDirectUploadGenerating || isConfirming3D || isUploadingImage,
    isWorldActionDisabled: isWorldPanoGenerating || isWorldPanoUploadGenerating,
    clearGenerationUi: () => {
      resetTransientQueueState();
      setGenerationStep('');
      setWorldPanoViewerUrl('');
      setWorldPanoImageUrl('');
      setIsWorldPanoViewerOpen(false);
    },
  };
}
