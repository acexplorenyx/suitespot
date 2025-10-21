const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  console.log('Vite Cloudinary Config:', {
    cloudName,
    uploadPreset,
    fileName: file.name
  });

  // Validate environment variables
  if (!cloudName || !uploadPreset) {
    const errorMsg = 'Cloudinary configuration missing. Please check your Vite environment variables.';
    console.error(errorMsg, {
      cloudName: !!cloudName,
      uploadPreset: !!uploadPreset
    });
    throw new Error(errorMsg);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'suitespot-listings');

  try {
    // Set upload progress
    setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
    setUploadingImages(prev => [...prev, file.name]);

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // ✅ IMMEDIATELY REMOVE FROM UPLOADING STATE
    setUploadingImages(prev => prev.filter(name => name !== file.name));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[file.name];
      return newProgress;
    });

    console.log('Upload successful:', data.secure_url);
    return data.secure_url;

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Clean up on error
    setUploadingImages(prev => prev.filter(name => name !== file.name));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[file.name];
      return newProgress;
    });
    
    throw error;
  }
};