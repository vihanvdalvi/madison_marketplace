'use client';
import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { Upload, Tag, X, Loader2, Search, Trash2, Settings } from 'lucide-react';

// Ensure TypeScript recognizes JSX intrinsic elements (avoid "JSX.IntrinsicElements" error)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// ADD YOUR KEYS HERE
const CLAUDE_API_KEY = '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';
const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME_HERE';
const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET_HERE';

interface Tags {
  main_category: string;
  specific_item: string;
  color: string;
  material: string;
  description: string;
}

interface ImageData {
  id: string;
  cloudinaryUrl: string;
  publicId: string;
  tags: Tags;
  timestamp: string;
}

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}

interface ClaudeContent {
  type: string;
  text?: string;
}

interface ClaudeResponse {
  content?: ClaudeContent[];
}

declare global {
  interface Window {
    storage: {
      get: (key: string) => Promise<{ value: string } | null>;
      set: (key: string, value: string) => Promise<void>;
      delete: (key: string) => Promise<void>;
      list: (prefix: string) => Promise<{ keys: string[] } | null>;
    };
  }
}

export default function ImageTagger() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<Tags | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<ImageData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ImageData[]>([]);
  const [activeView, setActiveView] = useState<'upload' | 'gallery'>('upload');

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async (): Promise<void> => {
    try {
      const result = await window.storage.list('cloudinary-image:');
      if (result && result.keys) {
        const images = await Promise.all(
          result.keys.map(async (key) => {
            const data = await window.storage.get(key);
            return data ? JSON.parse(data.value) as ImageData : null;
          })
        );
        setGallery(images.filter((img): img is ImageData => img !== null));
      }
    } catch (err) {
      console.log('No stored images yet');
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setTags(null);
    
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    
    setImage(file);
  };

  const generateTags = async (): Promise<void> => {
    if (!image) return;
    
    if (!CLAUDE_API_KEY || CLAUDE_API_KEY === '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') {
      setError('Please add your Claude API key in the code');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: image.type,
                    data: base64
                  }
                },
                {
                  type: 'text',
                  text: `Analyze this image and provide tags in the following JSON format (respond with ONLY valid JSON, no other text):

{
  "main_category": "the primary category (e.g., furniture, clothing, food, electronics, etc.)",
  "specific_item": "the specific item name",
  "color": "primary color(s)",
  "material": "material composition",
  "description": "a casual 2-line description"
}`
                }
              ]
            }
          ]
        })
      });

      const data: ClaudeResponse = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        const text = data.content[0].text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed: Tags = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        setTags(parsed);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      setError('Failed to generate tags. Check your API key and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (): Promise<{ url: string; publicId: string; cloudinaryData: CloudinaryResponse }> => {
    if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME_HERE' || !image || !tags) {
      throw new Error('Missing Cloudinary credentials or image data');
    }

    try {
      const formData = new FormData();
      formData.append('file', image);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('context', `alt=${tags.specific_item}|caption=${tags.description}`);
      formData.append('tags', `${tags.main_category},${tags.color},${tags.material}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data: CloudinaryResponse = await response.json();
      
      if (data.secure_url) {
        return {
          url: data.secure_url,
          publicId: data.public_id,
          cloudinaryData: data
        };
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw err;
    }
  };

  const saveImage = async (): Promise<void> => {
    if (!tags || !image) return;

    setLoading(true);
    setError(null);

    try {
      const cloudinaryResult = await uploadToCloudinary();

      const imageData: ImageData = {
        id: Date.now().toString(),
        cloudinaryUrl: cloudinaryResult.url,
        publicId: cloudinaryResult.publicId,
        tags,
        timestamp: new Date().toISOString()
      };

      await window.storage.set(`cloudinary-image:${imageData.id}`, JSON.stringify(imageData));
      
      await loadGallery();
      setActiveView('gallery');
      clearImage();
    } catch (err) {
      setError('Failed to save image. Check your Cloudinary credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchImages = (): void => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    const results = gallery.filter((img) => {
      const searchText = `${img.tags.main_category} ${img.tags.specific_item} ${img.tags.color} ${img.tags.material} ${img.tags.description}`.toLowerCase();
      return searchText.includes(query);
    });

    setSearchResults(results);
  };

  const deleteImage = async (id: string, publicId: string): Promise<void> => {
    try {
      await window.storage.delete(`cloudinary-image:${id}`);
      await loadGallery();
      setSearchResults([]);
      
      // Note: To delete from Cloudinary, you'd need the API secret and admin API
      // For now, we just remove from local storage
    } catch (err) {
      console.error('Failed to delete image', err);
    }
  };

  const clearImage = (): void => {
    setImage(null);
    setPreview(null);
    setTags(null);
    setError(null);
  };

  const displayGallery = searchResults.length > 0 ? searchResults : gallery;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Image Tagger with Cloudinary</h1>
          <p className="text-gray-600">Upload, tag, and store images in the cloud</p>
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 max-w-2xl mx-auto">
            <Settings className="w-4 h-4 inline mr-2" />
            Remember to add your API keys in the code (lines 5-7)
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveView('upload')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeView === 'upload'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Upload & Tag
          </button>
          <button
            onClick={() => setActiveView('gallery')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeView === 'gallery'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Gallery ({gallery.length})
          </button>
        </div>

        {activeView === 'upload' ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!preview ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 rounded-xl p-12 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                <Upload className="w-16 h-16 text-indigo-400 mb-4" />
                <span className="text-lg font-medium text-gray-700 mb-2">Drop an image here or click to browse</span>
                <span className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-64 object-contain bg-gray-50 rounded-lg"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!tags && (
                  <button
                    onClick={generateTags}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Tag className="w-5 h-5" />
                        Generate Tags with AI
                      </>
                    )}
                  </button>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {tags && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Generated Tags (Editable)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Main Category</label>
                        <input
                          type="text"
                          value={tags.main_category}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setTags({ ...tags, main_category: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Specific Item</label>
                        <input
                          type="text"
                          value={tags.specific_item}
                          onChange={(e) => setTags({...tags, specific_item: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Color</label>
                        <input
                          type="text"
                          value={tags.color}
                          onChange={(e) => setTags({...tags, color: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Material</label>
                        <input
                          type="text"
                          value={tags.material}
                          onChange={(e) => setTags({...tags, material: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-indigo-200">
                      <label className="text-sm font-semibold text-gray-600">Description</label>
                      <textarea
                        value={tags.description}
                        onChange={(e) => setTags({...tags, description: e.target.value})}
                        rows={3}
                        className="w-full mt-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={saveImage}
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Save to Cloudinary'
                        )}
                      </button>
                      <button
                        onClick={generateTags}
                        disabled={loading}
                        className="flex-1 bg-white text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-100 disabled:bg-gray-200 transition-colors"
                      >
                        Regenerate Tags
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && searchImages()}
                  placeholder="Search by category, color, material, description..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={searchImages}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              {searchResults.length > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  Found {searchResults.length} results
                </p>
              )}
            </div>

            {displayGallery.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No images in gallery yet. Upload some to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayGallery.map((img) => (
                  <div key={img.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative h-48 bg-gray-100">
                      <img
                        src={img.cloudinaryUrl}
                        alt={img.tags.specific_item}
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => deleteImage(img.id, img.publicId)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800">{img.tags.specific_item}</h3>
                        <span className="text-xs text-gray-500">{img.tags.main_category}</span>
                      </div>
                      <div className="flex gap-2 mb-2 text-sm flex-wrap">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{img.tags.color}</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{img.tags.material}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{img.tags.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}