import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [footer, setFooter] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [images, setImages] = useState([]);
  const [layout, setLayout] = useState(''); // State to store the layout HTML

  // Fetch layout.html on component mount
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        console.log(import.meta.env.VITE_BACKEND_BASE_URL);
        
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/getEmailLayout`);
        setLayout(response.data); // Store layout in state
      } catch (error) {
        console.log(import.meta.env.VITE_BACKEND_BASE_URL);
        console.error('Error fetching layout:', error);
      }
    };
    fetchLayout();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));

    try {
      // Upload images
      const uploadResponse = await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/uploadImage`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImageUrls(uploadResponse.data.imageUrls); // Get uploaded image URLs

      // Store email configuration
      const config = { title, content, footer, imageUrls: uploadResponse.data.imageUrls };
      await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/uploadEmailConfig`, config);

      // Render and download template
      const templateResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/renderAndDownloadTemplate`,
        config,
        { responseType: 'text' }
      );

      const blob = new Blob([templateResponse.data], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'email-template.html';
      link.click();
    } catch (error) {
      console.error('Error uploading or rendering template:', error);
    }
  };

  return (
    <div className="max-w-2xl mt-24 mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-6 ">Email Template Builder</h1>
      {layout && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Email Layout Preview</h2>
          <div
            className="border rounded-lg p-4 mt-2 bg-gray-100"
            dangerouslySetInnerHTML={{ __html: layout }}
          />
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2 mt-4">Title</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg shadow-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Content</label>
          <textarea
            className="w-full p-3 border rounded-lg shadow-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Footer</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg shadow-sm"
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Images</label>
          <input
            type="file"
            className="w-full p-3 border rounded-lg shadow-sm"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
        </div>
        <div className="mb-4">
          <button
            type="submit"
            className="w-full p-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Generate Template
          </button>
        </div>
      </form>
      
    </div>
  );
};

export default App;
