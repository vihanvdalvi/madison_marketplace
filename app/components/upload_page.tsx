"use client";
import React, { useState, ChangeEvent } from "react";
import { Upload, Tag, X, Loader2 } from "lucide-react";

interface Tags {
  main_category: string;
  specific_item: string;
  color: string;
  material: string;
  description: string;
  price: string;
  pickup_location: string;
}

export default function ImageTagger() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<Tags | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (
    e: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
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

    setLoading(true);
    setError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });

      // Call our API route instead of calling Claude directly
      const response = await fetch("/api/generate-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64,
          mediaType: image.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate tags");
      }

      const data = await response.json();
      // Ensure new fields exist and default to empty so user can fill them
      setTags({
        ...data.tags,
        price: data.tags?.price ?? "",
        pickup_location: data.tags?.pickup_location ?? "",
      });
    } catch (err) {
      setError("Failed to generate tags. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveImage = async (): Promise<void> => {
    if (!tags || !image) return;

    setLoading(true);
    setError(null);

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });

      // Call our API route to upload to Cloudinary
      const response = await fetch("/api/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64,
          tags,
          // include price as a numeric value if provided, otherwise null
          price:
            tags.price && tags.price.toString().trim() !== ""
              ? isNaN(parseFloat(tags.price))
                ? null
                : parseFloat(tags.price)
              : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const cloudinaryResult = await response.json();

      // Uploaded successfully — clear the form and keep user on upload screen
      clearImage();
    } catch (err) {
      setError("Failed to save image. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const clearImage = (): void => {
    setImage(null);
    setPreview(null);
    setTags(null);
    setError(null);
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            What would you like to sell today?
          </h1>
          <p className="text-gray-600">
            Receive predictions for competitive pricing
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!preview ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 rounded-xl p-12 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all">
              <Upload className="w-16 h-16 text-indigo-400 mb-4" />
              <span className="text-lg font-medium text-gray-700 mb-2">
                Drop an image here or click to browse
              </span>
              <span className="text-sm text-gray-500">
                PNG, JPG, GIF up to 10MB
              </span>
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
                <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Generated Tags (Editable)
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Main Category
                      </label>
                      <input
                        type="text"
                        value={tags.main_category}
                        onChange={(e) =>
                          setTags({ ...tags, main_category: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Specific Item
                      </label>
                      <input
                        type="text"
                        value={tags.specific_item}
                        onChange={(e) =>
                          setTags({ ...tags, specific_item: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Color
                      </label>
                      <input
                        type="text"
                        value={tags.color}
                        onChange={(e) =>
                          setTags({ ...tags, color: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Material
                      </label>
                      <input
                        type="text"
                        value={tags.material}
                        onChange={(e) =>
                          setTags({ ...tags, material: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Price (USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={tags.price}
                        onChange={(e) =>
                          setTags({ ...tags, price: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. 19.99"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        value={tags.pickup_location}
                        onChange={(e) =>
                          setTags({ ...tags, pickup_location: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Address or meetup spot"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-indigo-200">
                    <label className="text-sm font-semibold text-gray-600">
                      Description
                    </label>
                    <textarea
                      value={tags.description}
                      onChange={(e) =>
                        setTags({ ...tags, description: e.target.value })
                      }
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
                        "Save to Cloudinary"
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
      </div>
    </div>
  );
}
